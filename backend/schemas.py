from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    punch_status: str
    tasks_completed_count: int
    is_approved: bool

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str
    due_date: str
    due_time: str
    reminder: str
    location: Optional[str] = None
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskResponse(TaskBase):
    id: int
    status: str
    staff_id: int

    class Config:
        from_attributes = True

class PhotoResponse(BaseModel):
    id: int
    cloudinary_url: str

    class Config:
        from_attributes = True

class DailyLogBase(BaseModel):
    task_name: str
    date: str
    completion_time: str
    remarks: str
    observations: Optional[str] = None
    outcome: str
    gps: Optional[str] = None

class DailyLogCreate(DailyLogBase):
    pass

class DailyLogResponse(DailyLogBase):
    id: int
    staff_id: int
    photos: List[PhotoResponse] = []

    class Config:
        from_attributes = True
