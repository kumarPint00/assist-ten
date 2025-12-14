"""Proctoring endpoints for logging and reviewing events."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import ProctoringEvent, User
from app.models.schemas import ProctoringEventCreate, ProctoringEventResponse, ProctoringEventReview
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/proctoring", tags=["proctoring"])


def _ensure_admin(user):
    if not hasattr(user, 'role') or user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin privileges required")


@router.post("/events", response_model=ProctoringEventResponse, status_code=201)
async def log_event(payload: ProctoringEventCreate, db: AsyncSession = Depends(get_db)) -> ProctoringEventResponse:
    evt = ProctoringEvent(
        test_session_id=payload.test_session_id,
        event_type=payload.event_type,
        severity=payload.severity,
        duration_seconds=payload.duration_seconds,
        question_id=payload.question_id,
        snapshot_url=payload.snapshot_url,
        metadata=payload.metadata,
        detected_at=datetime.utcnow(),
    )
    db.add(evt)
    await db.commit()
    await db.refresh(evt)
    return ProctoringEventResponse.from_orm(evt)


@router.get("/events", response_model=List[ProctoringEventResponse])
async def list_events(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_admin(current_user)
    stmt = select(ProctoringEvent).order_by(desc(ProctoringEvent.detected_at)).limit(100)
    result = await db.execute(stmt)
    events = result.scalars().all()
    return [ProctoringEventResponse.from_orm(e) for e in events]


@router.patch("/events/{event_id}/review")
async def review_event(event_id: str, payload: ProctoringEventReview, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _ensure_admin(current_user)
    result = await db.execute(select(ProctoringEvent).where(ProctoringEvent.event_id == event_id))
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    ev.reviewed = True
    ev.reviewed_by = current_user.id
    ev.reviewed_at = datetime.utcnow()
    ev.reviewer_notes = payload.reviewer_notes
    ev.flagged = payload.flagged
    await db.commit()
    return {"message": "Event reviewed"}
