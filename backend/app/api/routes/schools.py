from datetime import datetime, timezone
from typing import Dict, List
from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.deps import admin_and_staff
from app.models.school import School
from app.schemas.school import SchoolCreate, SchoolOut, SchoolUpdate, SchoolUpdateStatus
from app.services.schools import (
    add_school,
    delete_school_by_id,
    get_school_stats,
    get_schoool_by_id,
    list_schools,
    update_school,
    update_school_status,
)


router = APIRouter()


@router.get("")
async def get_schools(
    stats: bool = False, province: str | None = None, search: str | None = None
):
    if stats:
        return await get_school_stats()
    school_list = await list_schools(search=search, province=province)
    return {"schools": school_list, "total": len(school_list)}


@router.get("/{id}", response_model=SchoolOut)
async def get_school(id: PydanticObjectId):
    school = await get_schoool_by_id(id)
    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"School with id {id} not found",
        )
    return school


@router.post("")
async def create_school(data: SchoolCreate, access=Depends(admin_and_staff)):
    created_school = await add_school(data)
    return created_school


@router.delete("/{id}")
async def delete_school(id: PydanticObjectId, access=Depends(admin_and_staff)):
    await delete_school_by_id(id)
    return {"detail": "success"}


@router.patch("/{id}/status")
async def update_status(
    id: PydanticObjectId,
    status_str: SchoolUpdateStatus,
    access=Depends(admin_and_staff),
):
    school_to_update = await update_school_status(id, status_str.status)
    return school_to_update


@router.put("/{id}")
async def update(
    id: PydanticObjectId, data: SchoolUpdate, access=Depends(admin_and_staff)
):
    updated_school = await update_school(id, data)
    return updated_school
