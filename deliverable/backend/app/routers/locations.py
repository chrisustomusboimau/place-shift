from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Location
from ..schemas import LocationCreate, LocationOut, LocationUpdate
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get("", response_model=list[LocationOut])
def list_locations(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return session.exec(select(Location).order_by(Location.floor_level, Location.room_name)).all()


@router.post("", response_model=LocationOut, status_code=201)
def create_location(
    data: LocationCreate, session: Session = Depends(get_session), _=Depends(require_admin)
):
    loc = Location(**data.model_dump())
    session.add(loc)
    session.commit()
    session.refresh(loc)
    return loc


@router.put("/{location_id}", response_model=LocationOut)
def update_location(
    location_id: int,
    data: LocationUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    loc = session.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(loc, k, v)
    session.add(loc)
    session.commit()
    session.refresh(loc)
    return loc


@router.delete("/{location_id}", status_code=204)
def delete_location(
    location_id: int, session: Session = Depends(get_session), _=Depends(require_admin)
):
    loc = session.get(Location, location_id)
    if not loc:
        raise HTTPException(404, "Location not found")
    session.delete(loc)
    session.commit()
