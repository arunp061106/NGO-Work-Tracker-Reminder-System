
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="staff") # admin or staff
    punch_status = Column(String(20), default="PUNCHED_OUT") # PUNCHED_IN or PUNCHED_OUT
    tasks_completed_count = Column(Integer, default=0)

    tasks = relationship("Task", back_populates="staff_member")
    logs = relationship("DailyLog", back_populates="staff_member")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False)
    priority = Column(String(20), default="Medium") # High, Medium, Low
    due_date = Column(String(20), nullable=False)
    due_time = Column(String(10), nullable=False)
    reminder = Column(String(10), default="60") # Minutes offset
    location = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(20), default="Pending") # Pending, In Progress, Completed, Overdue
    staff_id = Column(Integer, ForeignKey("users.id"))

    staff_member = relationship("User", back_populates="tasks")

class DailyLog(Base):
    __tablename__ = "daily_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(255), nullable=False)
    date = Column(String(20), nullable=False)
    completion_time = Column(String(20), nullable=False)
    remarks = Column(Text, nullable=False)
    observations = Column(Text, nullable=True)
    outcome = Column(String(255), nullable=False)
    gps = Column(String(50), nullable=True)
    staff_id = Column(Integer, ForeignKey("users.id"))

    staff_member = relationship("User", back_populates="logs")
    photos = relationship("Photo", back_populates="log")

class Photo(Base):
    __tablename__ = "photos"
    
    id = Column(Integer, primary_key=True, index=True)
    cloudinary_url = Column(String(255), nullable=False)
    public_id = Column(String(100), nullable=False)
    log_id = Column(Integer, ForeignKey("daily_logs.id"))

    log = relationship("DailyLog", back_populates="photos")
