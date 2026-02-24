from pydantic import BaseModel


class UserLogin(BaseModel):
    identifier: str
    password: str

class UserLoginUsername(BaseModel):
    username: str
    password: str
