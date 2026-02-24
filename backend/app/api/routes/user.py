from beanie import PydanticObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import admin_only, get_current_user
from app.core.exceptions import EmailExists, UserExists, UserNotFound
from app.services.user import (
    add_user as add_user_svc, 
    delete_user_by_id, 
    edit_user as edit_user_svc, 
    edit_user_me as edit_user_me_svc,
    update_password as update_password_svc
)
from app.schemas.user import UserAdd, UserEdit, UserEditMe, UserOut, UserUpdatePassword
from app.models.user import UserDoc

router = APIRouter()

@router.get("")
async def get_all_users(access = Depends(admin_only)):
    """Get all users (admin only)"""
    users = await UserDoc.find_all().to_list()
    return {"users": [UserOut(**user.model_dump()) for user in users]}

@router.post("/add")
async def add_user(user_data: UserAdd, access = Depends(admin_only)):
    try:
        new_user = await add_user_svc(user_data=user_data)
    except UserExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already exists")
    except EmailExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User with that email already exists")
        
    return UserOut(**new_user.model_dump())

@router.patch("/me")
async def update_my_info(user_data: UserEditMe, current_user: UserOut = Depends(get_current_user)):
    try:
        edited_user = await edit_user_me_svc(current_user.id, user_data)
    except UserExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already exists")
    except EmailExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User with that email already exists")
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return edited_user

@router.patch("/me/password")
async def update_my_password(
    password_data: UserUpdatePassword, 
    current_user: UserOut = Depends(get_current_user)
):
    """Update current user's password"""
    try:
        success = await update_password_svc(current_user.id, password_data)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        return {"message": "Password updated successfully"}
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: PydanticObjectId, access = Depends(admin_only)):
    try:
        await delete_user_by_id(user_id)
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

@router.patch("/{user_id}")
async def update_user(user_id: PydanticObjectId, user_data: UserEdit, access = Depends(admin_only)):
    try:
        edited_user = await edit_user_svc(user_id, user_data)
    except UserExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User already exists")
    except EmailExists:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "User with that email already exists")
    except UserNotFound:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    return edited_user