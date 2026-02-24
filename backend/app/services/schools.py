import re
from typing import Dict, List, Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status
from app.models.school import School
from app.schemas.school import SchoolCreate, SchoolOut, SchoolStatus, SchoolUpdate, Contact, LoomaInfo
from datetime import datetime, timezone

from app.utils.dates import now_utc


def parse_lat_long(lat_long_str: Optional[str]) -> tuple[Optional[float], Optional[float]]:
    if not lat_long_str:
        return None, None
    try:
        parts = lat_long_str.split(",")
        lat = float(parts[0].strip())
        lng = float(parts[1].strip()) if len(parts) > 1 else None
        return lat, lng
    except (ValueError, IndexError):
        return None, None


def school_to_out(school: School) -> SchoolOut:
    lat, lng = parse_lat_long(school.Lat_long)

    contact = Contact(
        email=school.Principal_Email,
        phone=str(school.principal_number) if school.principal_number else None,
        headmaster=school.Principal_name
    )

    looma = LoomaInfo(
        id=school.Looma_Id,
        serialNumber=school.Serial_Number,
        version=school.Version
    )

    return SchoolOut(
        id=school.id,
        name=school.Name_of_the_School or "",
        latitude=lat,
        longitude=lng,
        contact=contact,
        province=school.Province or "",
        district=school.District or "",
        palika=school.Municipality or "",
        status=SchoolStatus(school.status) if school.status in ["online", "offline", "maintenance"] else SchoolStatus.ONLINE,
        lastSeen=school.lastSeen or now_utc(),
        loomaId=school.Looma_Id or "",
        loomaCount=0,
        looma=looma,
        qrScans=[],
        accessLogs=[],
        image=school.image,
    )


async def list_schools(search: Optional[str] = None, province: Optional[str] = None) -> List[SchoolOut]:
    schools: List[School] = []

    if search is not None:
        safe_search = re.escape(search)
        schools = await School.find(
            {
                "$or": [
                    {"Name of the School": {"$regex": safe_search, "$options": "i"}},
                    {"District": {"$regex": safe_search, "$options": "i"}},
                    {"Province": {"$regex": safe_search, "$options": "i"}},
                    {"Municipality": {"$regex": safe_search, "$options": "i"}},
                    {"Principal_name": {"$regex": safe_search, "$options": "i"}},
                    {"Looma_Id": {"$regex": safe_search, "$options": "i"}},
                ]
            }
        ).to_list()
    elif province is not None:
        schools = await School.find({"Province": province}).to_list()
    else:
        schools = await School.find_all().to_list()

    return [school_to_out(school) for school in schools]


async def get_school_stats() -> Dict[str, int]:
    total = await School.count()
    online = await School.find({"status": "online"}).count()
    offline = await School.find({"status": "offline"}).count()
    maintenance = await School.find({"status": "maintenance"}).count()

    no_status = total - online - offline - maintenance

    return {
        "total": total,
        "online": online + no_status,
        "offline": offline,
        "maintenance": maintenance
    }


async def add_school(data: SchoolCreate) -> School:
    lat_long = None
    if data.latitude and data.longitude:
        lat_long = f"{data.latitude}, {data.longitude}"

    school_data = {
        "Name of the School": data.name,
        "Province": data.province,
        "District": data.district,
        "Municipality": data.palika,
        "Looma_Id": data.loomaId,
        "Lat long": lat_long,
        "Principal_Email": data.contact.email if data.contact else None,
        "Principal_name": data.contact.headmaster if data.contact else None,
        "principal_number": data.contact.phone if data.contact else None,
        "Serial_Number": data.looma.serialNumber if data.looma else None,
        "Version": data.looma.version if data.looma else None,
        "status": data.status.value if data.status else "online",
        "image": data.image,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc)
    }

    school = School(**school_data)
    await school.insert()
    return school


async def get_schoool_by_id(id: PydanticObjectId) -> SchoolOut | None:
    try:
        school = await School.get(id)
        if school:
            return school_to_out(school)
    except Exception:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Internal server error occurred when retrieving the school.")
    return None


async def delete_school_by_id(id: PydanticObjectId):
    school_to_delete = await School.get(id)
    if not school_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"School with id {id} not found")
    await school_to_delete.delete()


async def update_school_status(id: PydanticObjectId, status_str: SchoolStatus):
    school_to_update = await School.get(id)
    if not school_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"School with id {id} not found")

    school_to_update.status = status_str.value
    school_to_update.updatedAt = now_utc()
    await school_to_update.save()
    return school_to_out(school_to_update)


async def update_school(id: PydanticObjectId, data: SchoolUpdate) -> SchoolOut:
    school_to_update = await School.get(id)
    if not school_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"School with id {id} not found")

    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        school_to_update.Name_of_the_School = update_data["name"]
    if "province" in update_data:
        school_to_update.Province = update_data["province"]
    if "district" in update_data:
        school_to_update.District = update_data["district"]
    if "palika" in update_data:
        school_to_update.Municipality = update_data["palika"]
    if "loomaId" in update_data:
        school_to_update.Looma_Id = update_data["loomaId"]
    if "latitude" in update_data or "longitude" in update_data:
        lat = update_data.get("latitude", school_to_update.Lat_long.split(",")[0] if school_to_update.Lat_long else None)
        lng = update_data.get("longitude", school_to_update.Lat_long.split(",")[1] if school_to_update.Lat_long else None)
        if lat and lng:
            school_to_update.Lat_long = f"{lat}, {lng}"
    if "contact" in update_data and update_data["contact"]:
        contact = update_data["contact"]
        if "email" in contact:
            school_to_update.Principal_Email = contact["email"]
        if "headmaster" in contact:
            school_to_update.Principal_name = contact["headmaster"]
        if "phone" in contact:
            school_to_update.principal_number = contact["phone"]
    if "looma" in update_data and update_data["looma"]:
        looma = update_data["looma"]
        if "serialNumber" in looma:
            school_to_update.Serial_Number = looma["serialNumber"]
        if "version" in looma:
            school_to_update.Version = looma["version"]
    if "status" in update_data:
        school_to_update.status = update_data["status"].value if hasattr(update_data["status"], "value") else update_data["status"]
    if "image" in update_data:
        school_to_update.image = update_data["image"]

    school_to_update.updatedAt = now_utc()
    await school_to_update.save()

    return school_to_out(school_to_update)