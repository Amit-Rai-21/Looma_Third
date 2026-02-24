import random
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UserNotFound
from app.core.security import get_password_hash
from app.models.user import UserDoc

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 3


# ─── helpers ──────────────────────────────────────────────────────────────────

def _generate_otp() -> str:
    """Generate a 6-digit OTP."""
    return str(random.randint(100000, 999999))


def _hash_otp(otp: str) -> str:
    return pwd_context.hash(otp)


def _verify_otp(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _send_otp_email(to_email: str, otp: str) -> None:
    """Send OTP via Gmail SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Looma Dashboard - Password Reset OTP"
    msg["From"] = settings.GMAIL_USER
    msg["To"] = to_email

    text = f"""
Looma Dashboard - Password Reset

Your OTP code is: {otp}

This code expires in {OTP_EXPIRY_MINUTES} minutes.
Maximum {OTP_MAX_ATTEMPTS} attempts allowed.

If you did not request this, please ignore this email.

- Looma Dashboard Team
"""

    html = f"""
<html>
  <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
    <div style="max-width: 480px; margin: auto; background: white; border-radius: 12px;
                padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1a2c5b; margin: 0;">Looma Dashboard</h2>
        <p style="color: #666; margin: 4px 0 0;">Password Reset Request</p>
      </div>

      <p style="color: #333;">Your One-Time Password (OTP) is:</p>

      <div style="text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px;
                     color: #1a2c5b; background: #f0f4ff; padding: 16px 24px;
                     border-radius: 8px; display: inline-block;">{otp}</span>
      </div>

      <ul style="color: #555; font-size: 14px;">
        <li>This code expires in <strong>{OTP_EXPIRY_MINUTES} minutes</strong></li>
        <li>Maximum <strong>{OTP_MAX_ATTEMPTS} attempts</strong> allowed</li>
      </ul>

      <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee;
                padding-top: 16px;">
        If you did not request a password reset, please ignore this email.
        <br/>— Looma Dashboard Team
      </p>
    </div>
  </body>
</html>
"""

    msg.attach(MIMEText(text, "plain"))
    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(settings.GMAIL_HOST, settings.GMAIL_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
        server.sendmail(settings.GMAIL_USER, to_email, msg.as_string())


# ─── service functions ─────────────────────────────────────────────────────────

async def send_otp(email: str) -> None:
    """Find user by email, generate OTP, save hash, send email."""
    user = await UserDoc.find_one(UserDoc.email == email)
    if not user:
        raise UserNotFound

    otp = _generate_otp()
    expires = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    await user.set({
        "otpCode": _hash_otp(otp),
        "otpExpires": expires,
        "otpAttempts": 0,
    })

    _send_otp_email(email, otp)


async def verify_otp(email: str, otp: str) -> bool:
    """Verify OTP. Returns True if valid, raises on invalid/expired/max attempts."""
    user = await UserDoc.find_one(UserDoc.email == email)
    if not user:
        raise UserNotFound

    # Check expiry
    if not user.otpExpires or datetime.now(timezone.utc) > user.otpExpires.replace(tzinfo=timezone.utc):
        await user.set({"otpCode": None, "otpExpires": None, "otpAttempts": 0})
        raise ValueError("OTP has expired")

    # Check max attempts
    if user.otpAttempts >= OTP_MAX_ATTEMPTS:
        await user.set({"otpCode": None, "otpExpires": None, "otpAttempts": 0})
        raise ValueError("Maximum OTP attempts exceeded")

    # Increment attempt count
    await user.set({"otpAttempts": user.otpAttempts + 1})

    # Verify OTP
    if not user.otpCode or not _verify_otp(otp, user.otpCode):
        raise ValueError("Invalid OTP")

    return True


async def reset_password(email: str, otp: str, new_password: str) -> None:
    """Verify OTP then update password and set mustChangePassword flag."""
    user = await UserDoc.find_one(UserDoc.email == email)
    if not user:
        raise UserNotFound

    # Reuse verify logic
    await verify_otp(email, otp)

    # Update password and clear OTP, set mustChangePassword
    await user.set({
        "passwordHash": get_password_hash(new_password),
        "otpCode": None,
        "otpExpires": None,
        "otpAttempts": 0,
        "mustChangePassword": True,   # popup shown after login
    })