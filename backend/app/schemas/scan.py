from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ScanCreate(BaseModel):
    """Payload produced by the QR scan form (compatible with the looma-feedback project)."""

    serial: str = Field(..., min_length=1)
    technician: str
    school: str
    software_version: str
    condition: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    build_date: Optional[str] = None
    mfg_location: Optional[str] = None
    lot_number: Optional[str] = None
    # Prefer client timestamp if provided; fall back to server time.
    client_timestamp: Optional[datetime] = None


class ScanOut(BaseModel):
    id: str
    serial: str
    technician: str
    school: str
    software_version: str
    condition: str
    latitude: Optional[str] = None
    longitude: Optional[str] = None
    build_date: Optional[str] = None
    mfg_location: Optional[str] = None
    lot_number: Optional[str] = None
    timestamp: datetime


class ScanListOut(BaseModel):
    scans: list[ScanOut]
    total: int
