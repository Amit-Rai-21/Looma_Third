
from typing import Literal
from beanie import Document
from pydantic import EmailStr
from datetime import datetime

Role = Literal["admin", "staff", "viewer"]

class UserDoc(Document):
    username: str
    email: EmailStr
    passwordHash: str
    role: Role
    createdAt: datetime
    lastLogin: datetime | None = None

    # OTP fields
    otpCode: str | None = None           # hashed OTP
    otpExpires: datetime | None = None   # expiry time (10 mins)
    otpAttempts: int = 0                 # max 3 attempts
    mustChangePassword: bool = False     # flag to show popup after login

    class Settings:
        name = "users"