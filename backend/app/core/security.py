import secrets
from passlib.context import CryptContext
from typing import Any
import time

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

BCRYPT_MAX_LENGTH = 72


def get_password_hash(password: str) -> str:
    safe_password = password[:BCRYPT_MAX_LENGTH]
    return pwd_context.hash(safe_password)


def verify_password(password: str, password_hash: str) -> bool:
    safe_password = password[:BCRYPT_MAX_LENGTH]
    return pwd_context.verify(safe_password, password_hash)


def new_token() -> str:
    return secrets.token_hex(32)
