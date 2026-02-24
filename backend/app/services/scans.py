from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from bson import ObjectId
from pymongo import DESCENDING

from app.core.config import settings
from app.db.mongodb import get_client
from app.schemas.scan import ScanCreate


def _get_scans_collection():
    """Return the Mongo collection used to store scan events."""
    client = get_client()
    return client[settings.SCANS_DB_NAME][settings.SCANS_COLLECTION_NAME]


def _parse_timestamp(payload: ScanCreate) -> datetime:
    """Use client-provided timestamp when available; otherwise server time (UTC)."""
    if payload.client_timestamp is not None:
        ts = payload.client_timestamp
        # Ensure tz-aware
        if ts.tzinfo is None:
            return ts.replace(tzinfo=timezone.utc)
        return ts
    return datetime.now(timezone.utc)


async def create_scan(payload: ScanCreate) -> str:
    """Insert a scan record and return its inserted id as a string."""
    col = _get_scans_collection()
    doc: dict[str, Any] = {
        "serial": payload.serial.strip(),
        "technician": payload.technician.strip(),
        "school": payload.school.strip(),
        "software_version": payload.software_version.strip(),
        "condition": payload.condition.strip(),
        "latitude": (payload.latitude.strip() if payload.latitude else ""),
        "longitude": (payload.longitude.strip() if payload.longitude else ""),
        "build_date": payload.build_date or "",
        "mfg_location": payload.mfg_location or "",
        "lot_number": payload.lot_number or "",
        "timestamp": _parse_timestamp(payload),
    }
    res = await col.insert_one(doc)
    return str(res.inserted_id)


async def list_scans(
    *,
    serial: Optional[str] = None,
    school: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    """List scan events with optional filters."""
    col = _get_scans_collection()

    q: dict[str, Any] = {}
    if serial:
        q["serial"] = serial
    if school:
        q["school"] = school

    total = await col.count_documents(q)

    cursor = (
        col.find(q)
        .sort("timestamp", DESCENDING)
        .skip(max(skip, 0))
        .limit(max(min(limit, 500), 1))
    )
    docs = await cursor.to_list(length=max(min(limit, 500), 1))

    # normalize ObjectId
    for d in docs:
        if "_id" in d:
            d["id"] = str(d.pop("_id"))
    return docs, total


async def get_scan(scan_id: str) -> Optional[dict[str, Any]]:
    """Get a single scan by ID."""
    col = _get_scans_collection()
    try:
        oid = ObjectId(scan_id)
    except Exception:
        return None
    doc = await col.find_one({"_id": oid})
    if not doc:
        return None
    doc["id"] = str(doc.pop("_id"))
    return doc


async def delete_scan(scan_id: str) -> bool:
    """Delete a scan by ID. Returns True if deleted, False if not found."""
    col = _get_scans_collection()
    try:
        oid = ObjectId(scan_id)
    except Exception:
        return False
    result = await col.delete_one({"_id": oid})
    return result.deleted_count > 0