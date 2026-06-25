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
    
    # FIX UTAMA: Ubah str menjadi int dengan default nilai 0 agar sinkron dengan frontend Number()
    floor_level: int = Field(default=0)


class Assignment(SQLModel, table=True):
    # Staf tidak boleh bentrok di slot jam yang sama PADA TANGGAL YANG SAMA.
    __table_args__ = (UniqueConstraint("staff_id", "time_slot", "date", name="uq_staff_slot_date"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    staff_id: int = Field(foreign_key="staff.id", index=True)
    location_id: int = Field(foreign_key="location.id")
    time_slot: str = Field(index=True) # e.g. "00:00-00:30"
    
    # Kolom tanggal berformat string ISO (YYYY-MM-DD)
    date: str = Field(index=True) # e.g. "2026-06-26"
    
    job_description: str = ""