from __future__ import annotations

from typing import Optional
from sqlmodel import Field, SQLModel, UniqueConstraint


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(default="staff")  # "admin" | "staff"


class Staff(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    division: Optional[str] = None
    contact: Optional[str] = None
    
    # Kunci konsistensi ketiga field ini agar dikenali oleh sistem DB & Router Staff
    username: Optional[str] = Field(default=None, index=True, unique=True)
    hashed_password: Optional[str] = Field(default=None)
    role: Optional[str] = Field(default="staff")  # "admin" | "staff"


class Location(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    room_name: str
    floor_level: str = ""


class Assignment(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("staff_id", "time_slot", name="uq_staff_slot"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    staff_id: int = Field(foreign_key="staff.id", index=True)
    location_id: int = Field(foreign_key="location.id")
    time_slot: str = Field(index=True)
    job_description: str = ""