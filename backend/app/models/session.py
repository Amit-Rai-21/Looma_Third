from datetime import datetime
from beanie import Document, PydanticObjectId


class SessionDoc(Document):
    userId: PydanticObjectId
    token: str
    expiresAt: datetime
    createdAt: datetime

    class Settings:
        name = "sessions"
