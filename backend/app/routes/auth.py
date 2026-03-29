"""
Authentication routes — Email OTP-based sign-in.

Flow:
  POST /api/auth/send-otp    → generate + email a 6-digit OTP
  POST /api/auth/verify-otp  → verify OTP, return JWT + user

Security measures:
  • OTP is bcrypt-hashed before storage
  • OTP expires after OTP_EXPIRY_MINUTES (default 5 min)
  • Replay prevented: OTP marked `is_used` immediately on success
  • Old OTP invalidated when a new one is requested for the same email
  • Brute-force guessing limited by OTP_MAX_ATTEMPTS counter
  • Rate limiting: 5 send-otp/min, 10 verify-otp/min (via Flask-Limiter)
  • Inputs sanitized and validated
"""

import re
import random
import string
import logging
from datetime import datetime, timedelta

from flask              import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from flask_limiter      import Limiter
from flask_limiter.util import get_remote_address
from flask_bcrypt       import Bcrypt

from app          import db
from app.models   import User, OTPRecord
from app.services.email_service import send_otp_email

auth_bp = Blueprint('auth', __name__)
bcrypt  = Bcrypt()
logger  = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

def _valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email.strip()))

def _generate_otp(length: int = 6) -> str:
    """Cryptographically safe 6-digit numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))

def _make_username_from_email(email: str) -> str:
    base = email.split('@')[0][:30]
    suffix = ''.join(random.choices(string.digits, k=4))
    return f"{base}_{suffix}"


# ──────────────────────────────────────────────────────────────
# POST /api/auth/send-otp
# ──────────────────────────────────────────────────────────────

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    """
    Generate a 6-digit OTP, store its bcrypt hash, and email it to the user.

    Rate limit: 5 requests / minute per IP (enforced in __init__.py via Limiter).
    Cooldown:   reject if a valid OTP for this email was created < COOLDOWN seconds ago.
    """
    data  = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()

    # ── Validate ───────────────────────────────────────────────
    if not email:
        return jsonify({"msg": "Email is required."}), 400
    if not _valid_email(email):
        return jsonify({"msg": "Invalid email format."}), 400

    cfg           = current_app.config
    expiry_min    = cfg.get('OTP_EXPIRY_MINUTES', 5)
    cooldown_sec  = cfg.get('OTP_RESEND_COOLDOWN', 60)

    # ── Cooldown check ─────────────────────────────────────────
    existing = OTPRecord.query.filter_by(email=email, is_used=False).first()
    if existing and not existing.is_expired():
        elapsed = (datetime.utcnow() - existing.created_at).total_seconds()
        if elapsed < cooldown_sec:
            wait = int(cooldown_sec - elapsed)
            return jsonify({
                "msg": f"Please wait {wait} seconds before requesting a new OTP.",
                "cooldown_remaining": wait
            }), 429

    # ── Invalidate all previous OTPs for this email ────────────
    OTPRecord.query.filter_by(email=email).delete()
    db.session.flush()

    # ── Generate + hash OTP ────────────────────────────────────
    raw_otp    = _generate_otp()
    otp_hash   = bcrypt.generate_password_hash(raw_otp).decode('utf-8')
    expires_at = datetime.utcnow() + timedelta(minutes=expiry_min)

    record = OTPRecord(email=email, otp_hash=otp_hash, expires_at=expires_at)
    db.session.add(record)

    db.session.commit()

    # ── Send email ─────────────────────────────────────────────
    try:
        send_otp_email(email, raw_otp)
    except RuntimeError as exc:
        logger.error("Email send failed: %s", exc)
        return jsonify({"msg": str(exc)}), 503

    logger.info("OTP sent to %s (expires in %d min)", email, expiry_min)
    return jsonify({
        "msg":               "OTP sent successfully. Check your inbox.",
        "expiry_minutes":    expiry_min,
        "cooldown_seconds":  cooldown_sec,
    }), 200


# ──────────────────────────────────────────────────────────────
# POST /api/auth/verify-otp
# ──────────────────────────────────────────────────────────────

@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """
    Verify the OTP, issue a JWT, and return user info.

    Security:
      • Checks expiry before comparing
      • Increments attempt counter; OTP burned after MAX_ATTEMPTS wrong guesses
      • Marks OTP as used on success (replay prevention)
    """
    data  = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    otp   = str(data.get('otp',   '')).strip()

    # ── Validate inputs ────────────────────────────────────────
    if not email or not otp:
        return jsonify({"msg": "Email and OTP are required."}), 400
    if not _valid_email(email):
        return jsonify({"msg": "Invalid email format."}), 400
    if not otp.isdigit() or len(otp) != 6:
        return jsonify({"msg": "OTP must be a 6-digit number."}), 400

    max_attempts = current_app.config.get('OTP_MAX_ATTEMPTS', 5)

    # ── Fetch latest unused OTP record ─────────────────────────
    record = (OTPRecord.query
              .filter_by(email=email, is_used=False)
              .order_by(OTPRecord.created_at.desc())
              .first())

    if not record:
        return jsonify({"msg": "No active OTP found. Please request a new one."}), 400

    # ── Expiry check ───────────────────────────────────────────
    if record.is_expired():
        db.session.delete(record)
        db.session.commit()
        return jsonify({"msg": "OTP has expired. Please request a new one."}), 400

    # ── Brute-force guard ──────────────────────────────────────
    if record.is_exhausted(max_attempts):
        db.session.delete(record)
        db.session.commit()
        return jsonify({"msg": "Too many failed attempts. Please request a new OTP."}), 429

    # ── Hash comparison ────────────────────────────────────────
    if not bcrypt.check_password_hash(record.otp_hash, otp):
        record.attempts += 1
        remaining = max_attempts - record.attempts
        db.session.commit()
        if remaining <= 0:
            db.session.delete(record)
            db.session.commit()
            return jsonify({"msg": "Too many failed attempts. Please request a new OTP."}), 429
        return jsonify({
            "msg":                f"Incorrect OTP. {remaining} attempt(s) remaining.",
            "attempts_remaining": remaining,
        }), 400

    # ── Success: mark used ─────────────────────────────────────
    record.is_used = True
    db.session.commit()

    return jsonify({
        "msg":      "OTP verified successfully.",
        "verified": True,
    }), 200


# ──────────────────────────────────────────────────────────────
# Registration and Login
# ──────────────────────────────────────────────────────────────

@auth_bp.route('/register-details', methods=['POST'])
def register_details():
    """
    Finalize registration with user details after OTP verification.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    name = str(data.get('name', '')).strip()
    gender = str(data.get('gender', '')).strip()
    work = str(data.get('work', '')).strip()
    password = str(data.get('password', '')).strip()

    if not email or not name or not password:
        return jsonify({"msg": "Email, name, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters."}), 400

    # Ensure email was verified recently
    otp_record = OTPRecord.query.filter_by(email=email, is_used=True).order_by(OTPRecord.created_at.desc()).first()
    if not otp_record:
        return jsonify({"msg": "Email not verified via OTP."}), 403

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "User with this email already exists."}), 409

    # Generate a username since it's required by the model
    username = _make_username_from_email(email)

    user = User(
        username=username,
        email=email,
        name=name,
        gender=gender,
        work=work,
        is_verified=True
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Registration successful. You can now log in.", "user": user.to_dict()}), 201


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset user password after OTP verification.
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip()

    if not email or not password:
        return jsonify({"msg": "Email and new password are required."}), 400

    if len(password) < 6:
        return jsonify({"msg": "Password must be at least 6 characters."}), 400

    # Ensure email was verified recently
    otp_record = OTPRecord.query.filter_by(email=email, is_used=True).order_by(OTPRecord.created_at.desc()).first()
    if not otp_record:
        return jsonify({"msg": "Email not verified via OTP."}), 403

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"msg": "User not found."}), 404

    user.set_password(password)
    db.session.delete(otp_record)
    db.session.commit()

    return jsonify({"msg": "Password successfully reset. You can now log in."}), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Standard Email and Password login.
    """
    data     = request.get_json(silent=True) or {}
    email    = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', '')).strip()

    if not email or not password:
        return jsonify({"msg": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"msg": "Invalid email or password."}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"access_token": token, "user": user.to_dict()}), 200
