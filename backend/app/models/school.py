from beanie import Document
from pydantic import Field, field_validator
from datetime import datetime, timezone
from typing import Optional, Any

from pymongo import IndexModel


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


class School(Document):
    """
    School document model that maps to the existing MongoDB schema.
    Field names match the MongoDB collection format in looma-dashboard.schools
    """
    Looma_Id: Optional[str] = None
    District: Optional[str] = None
    Lat_long: Optional[str] = Field(default=None, alias="Lat long")
    Municipality: Optional[str] = None
    Name_of_the_School: Optional[str] = Field(default=None, alias="Name of the School")
    Principal_Email: Optional[str] = None
    Principal_name: Optional[str] = None
    Province: Optional[str] = None
    Serial_Number: Optional[str] = None
    Version: Optional[str] = None
    principal_number: Optional[Any] = None

    # School hero image stored as base64 data URL (e.g. "data:image/jpeg;base64,...")
    image: Optional[str] = None

    status: str = "online"
    lastSeen: datetime = Field(default_factory=now_utc)
    createdAt: datetime = Field(default_factory=now_utc)
    updatedAt: datetime = Field(default_factory=now_utc)

    # Validator to handle all string fields that might be stored as 0 or other integers in MongoDB
    @field_validator(
        'District',
        'Lat_long',
        'Municipality',
        'Principal_Email',
        'Principal_name',
        'Province',
        'Version',
        'Looma_Id',
        'Name_of_the_School',
        'Serial_Number',
        mode='before'
    )
    @classmethod
    def convert_int_to_string(cls, v):
        """Convert integers (especially 0) to None for optional string fields"""
        if isinstance(v, int):
            return None
        if v is None or v == "":
            return None
        return str(v)

    class Settings:
        name = "schools"
        use_state_management = True

    model_config = {
        "populate_by_name": True,
        "extra": "allow"
    }