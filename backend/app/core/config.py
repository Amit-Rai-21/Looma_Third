from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URI: str
    MONGODB_DB_NAME: str
    SCANS_DB_NAME: str = "looma-devices"
    SCANS_COLLECTION_NAME: str = "device_scans"
    ALLOWED_ORIGINS: List[str] = ["*"]
    SESSION_EXPIRES_DAYS: int = 7
    COOKIE_SECURE: bool = False
    SESSION_COOKIE_NAME: str = "session_token"

    # Gmail SMTP
    GMAIL_USER: str = ""
    GMAIL_APP_PASSWORD: str = ""
    GMAIL_HOST: str = "smtp.gmail.com"
    GMAIL_PORT: int = 587

    # SSH
    SSH_USERNAME: str = ""
    SSH_PASSWORD: str = ""
    SSH_HOSTNAME: str = ""

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()