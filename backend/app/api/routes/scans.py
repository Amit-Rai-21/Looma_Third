from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_session
from app.schemas.scan import ScanCreate, ScanListOut, ScanOut
from app.services.scans import create_scan, delete_scan, get_scan, list_scans


router = APIRouter()


@router.post("/submit")
async def submit_scan(payload: ScanCreate):
    """Public endpoint used by the QR scan form to submit a scan.

    This keeps the old behavior from the looma-feedback project where the
    form submission did not require a dashboard session.
    """
    inserted_id = await create_scan(payload)
    return {"success": True, "id": inserted_id}


@router.get("", response_model=ScanListOut, dependencies=[Depends(get_current_session)])
async def get_scans(serial: str | None = None, school: str | None = None, limit: int = 50, skip: int = 0):
    docs, total = await list_scans(serial=serial, school=school, limit=limit, skip=skip)
    return {"scans": docs, "total": total}


@router.get("/{scan_id}", response_model=ScanOut, dependencies=[Depends(get_current_session)])
async def get_scan_by_id(scan_id: str):
    doc = await get_scan(scan_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return doc


@router.delete("/{scan_id}", dependencies=[Depends(get_current_session)])
async def delete_scan_by_id(scan_id: str):
    """Delete a scan record by ID. Requires authentication."""
    success = await delete_scan(scan_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found")
    return {"success": True}