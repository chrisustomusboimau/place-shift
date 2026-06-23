from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..database import get_session
from ..models import Staff
from ..schemas import StaffCreate, StaffOut, StaffUpdate
from ..security import get_current_user, require_admin

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut])
def list_staff(session: Session = Depends(get_session), _=Depends(get_current_user)):
    return session.exec(select(Staff).order_by(Staff.name)).all()


@router.post("", response_model=StaffOut, status_code=201)
def create_staff(data: StaffCreate, session: Session = Depends(get_session), _=Depends(require_admin)):
    s = Staff(**data.model_dump())
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(
    staff_id: int,
    data: StaffUpdate,
    session: Session = Depends(get_session),
    _=Depends(require_admin),
):
    s = session.get(Staff, staff_id)
    if not s:
        raise HTTPException(404, "Staff not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(s, k, v)
    session.add(s)
    session.commit()
    session.refresh(s)
    return s


@router.delete("/{staff_id}", status_code=204)
def delete_staff(staff_id: int, session: Session = Depends(get_session), _=Depends(require_admin)):
    s = session.get(Staff, staff_id)
    if not s:
        raise HTTPException(404, "Staff not found")
    session.delete(s)
    session.commit()
