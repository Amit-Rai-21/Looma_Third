from beanie import PydanticObjectId
from pydantic import BaseModel, EmailStr

from app.models.user import Role


class UserOut(BaseModel):
    id: PydanticObjectId
    username: str
    email: EmailStr
    role: Role

class UserAdd(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: Role

class UserEdit(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    role: Role | None = None

class UserEditMe(BaseModel):
    username: str | None = None
    email: EmailStr | None = None

class UserUpdatePassword(BaseModel):
    old_password: str
    new_password: str
