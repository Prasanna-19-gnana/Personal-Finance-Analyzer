"""
Email service — sends OTP emails via Gmail SMTP (or any SMTP provider).
All credentials come from environment variables; nothing is hardcoded.
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text       import MIMEText
from flask import current_app

logger = logging.getLogger(__name__)


def _build_html(otp: str, expiry_minutes: int) -> str:
    """Return a polished HTML email body for the OTP."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Your OTP Code</title>
</head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#161b22;border-radius:16px;border:1px solid #30363d;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#58a6ff,#bc8cff);padding:32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">💰</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
              Personal Finance Analyzer
            </h1>
            <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:14px;">
              Your secure sign-in code
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 36px;">
            <p style="color:#c9d1d9;font-size:15px;margin:0 0 24px;">
              Hi there 👋 — use the code below to sign in to your account.
              This OTP is valid for <strong style="color:#58a6ff;">{expiry_minutes} minutes</strong>.
            </p>

            <!-- OTP Box -->
            <div style="background:#0d1117;border:2px solid #30363d;border-radius:12px;
                        padding:28px;text-align:center;margin-bottom:28px;">
              <p style="color:#8b949e;font-size:12px;letter-spacing:2px;
                         text-transform:uppercase;margin:0 0 12px;">One-Time Password</p>
              <span style="font-size:42px;font-weight:800;letter-spacing:12px;
                           color:#ffffff;font-family:'Courier New',monospace;">
                {otp}
              </span>
            </div>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;">
                  <p style="color:#8b949e;font-size:13px;margin:0;line-height:1.6;">
                    ⚠️ <strong style="color:#c9d1d9;">Never share this code</strong> with anyone.<br/>
                    If you didn't request this, please ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0d1117;padding:20px 36px;text-align:center;
                     border-top:1px solid #21262d;">
            <p style="color:#484f58;font-size:12px;margin:0;">
              © 2025 Personal Finance Analyzer — Sent automatically, do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""


def send_otp_email(recipient_email: str, otp: str) -> None:
    """
    Send an OTP email to `recipient_email`.

    Raises:
        RuntimeError: If email credentials are missing or SMTP fails.
    """
    cfg = current_app.config

    mail_user = cfg.get('MAIL_USERNAME')
    mail_pass = cfg.get('MAIL_PASSWORD')
    mail_from = cfg.get('MAIL_FROM') or mail_user
    mail_name = cfg.get('MAIL_FROM_NAME', 'Finance Analyzer')
    expiry    = cfg.get('OTP_EXPIRY_MINUTES', 5)

    if not mail_user or not mail_pass:
        logger.error("Email credentials not configured (MAIL_USERNAME / MAIL_PASSWORD missing).")
        raise RuntimeError("Email service is not configured. Please contact support.")

    # Build message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"🔐 Your OTP Code: {otp}"
    msg['From']    = f"{mail_name} <{mail_from}>"
    msg['To']      = recipient_email

    # Plain-text fallback
    text_body = (
        f"Your OTP for Personal Finance Analyzer is: {otp}\n"
        f"This code expires in {expiry} minutes.\n"
        f"Do NOT share it with anyone."
    )
    msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(_build_html(otp, expiry), 'html'))

    # Send via SMTP
    try:
        with smtplib.SMTP(cfg.get('MAIL_SERVER', 'smtp.gmail.com'),
                          cfg.get('MAIL_PORT', 587)) as server:
            server.ehlo()
            server.starttls()
            server.login(mail_user, mail_pass)
            server.sendmail(mail_from, recipient_email, msg.as_string())
        logger.info("OTP email sent to %s", recipient_email)
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP authentication failed for %s", mail_user)
        raise RuntimeError("Email authentication failed. Check MAIL_USERNAME and MAIL_PASSWORD.")
    except smtplib.SMTPException as exc:
        logger.error("SMTP error sending to %s: %s", recipient_email, exc)
        raise RuntimeError(f"Failed to send email: {exc}")
