from enum import Enum
from typing import List, Optional, Any

from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class SchoolStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class Contact(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    headmaster: Optional[str] = None


class LoomaInfo(BaseModel):
    id: Optional[str] = None
    serialNumber: Optional[str] = None
    version: Optional[str] = None
    lastUpdate: Optional[datetime] = None


class SchoolOut(BaseModel):
    id: PydanticObjectId
    name: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact: Contact = Contact()
    province: str = ""
    district: str = ""
    palika: str = ""
    status: SchoolStatus = SchoolStatus.ONLINE
    lastSeen: datetime = Field(default_factory=now_utc)
    loomaId: str = ""
    loomaCount: int = 0
    looma: LoomaInfo = LoomaInfo()
    qrScans: List[str] = []
    accessLogs: List[str] = []
    # Base64 image data URL — None means use frontend default
    image: Optional[str] = None


class SchoolCreate(BaseModel):
    name: str
    province: str
    district: str
    palika: str = ""
    loomaId: str = ""
    contact: Contact = Contact()
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: SchoolStatus = SchoolStatus.ONLINE
    lastSeen: datetime = Field(default_factory=now_utc)
    loomaCount: int = 0
    looma: LoomaInfo = LoomaInfo()
    image: Optional[str] = None


class SchoolUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact: Optional[Contact] = None
    province: Optional[str] = None
    district: Optional[str] = None
    palika: Optional[str] = None
    status: Optional[SchoolStatus] = None
    lastSeen: Optional[datetime] = None
    loomaId: Optional[str] = None
    loomaCount: Optional[int] = None
    looma: Optional[LoomaInfo] = None
    # Base64 image data URL for hero image
    image: Optional[str] = None


class SchoolUpdateStatus(BaseModel):
    status: SchoolStatus