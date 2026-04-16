import os
from datetime import timedelta
from dotenv import load_dotenv

# Load .env from the backend root directory regardless of current working directory.
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    # ── Core ──────────────────────────────────────────────────
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-finance-key-dev-only'

    # ── Database ──────────────────────────────────────────────
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///finance.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # ── JWT ───────────────────────────────────────────────────
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-dev-only'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # ── Email (SMTP) ──────────────────────────────────────────
    MAIL_SERVER   = os.environ.get('MAIL_SERVER',   'smtp.gmail.com')
    MAIL_PORT     = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS  = os.environ.get('MAIL_USE_TLS',  'true').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')   # Gmail address
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')   # Gmail App Password
    MAIL_FROM     = os.environ.get('MAIL_FROM') or os.environ.get('MAIL_USERNAME')
    MAIL_FROM_NAME = os.environ.get('MAIL_FROM_NAME', 'Finance Analyzer')

    # ── OTP Settings ──────────────────────────────────────────
    OTP_EXPIRY_MINUTES    = 5     # OTP valid for 5 minutes
    OTP_RESEND_COOLDOWN   = 60    # Seconds before resend is allowed
    OTP_MAX_ATTEMPTS      = 5     # Max wrong guesses before OTP is burned

    # Comma-separated list of emails that should be provisioned as admins on registration.
    ADMIN_EMAILS = [
        e.strip().lower()
        for e in os.environ.get('ADMIN_EMAILS', '').split(',')
        if e.strip()
    ]
