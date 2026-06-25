from __future__ import annotations

from sqlmodel import Session, select

from .database import engine, settings
from .models import Location, User
from .security import hash_password


def run_seed() -> None:
    with Session(engine) as session:
        existing = session.exec(select(User).where(User.username == settings.admin_user)).first()
        if not existing:
            session.add(
                User(
                    username=settings.admin_user,
                    password_hash=hash_password(settings.admin_pass),
                    role="admin",
                )
            )

        if not session.exec(select(Location)).first():
            session.add_all(
                [
                    # FIX UTAMA: Mengubah nilai string "Floor X" menjadi angka integer murni (int)
                    Location(room_name="Main Hall", floor_level=1),
                    Location(room_name="Room A", floor_level=2),
                    Location(room_name="Room B", floor_level=2),
                    Location(room_name="Rooftop", floor_level=3),
                ]
            )

        session.commit()