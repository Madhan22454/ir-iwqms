from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    employee_id: str
    name: str
    email: EmailStr
    mobile_number: Optional[str] = None
    role: str
    zone_id: Optional[int] = None
    division_id: Optional[int] = None
    station_id: Optional[int] = None
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    employee_id: Optional[str] = None
