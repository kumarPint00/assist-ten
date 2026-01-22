"""Proctoring endpoints for logging and reviewing events."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import ProctoringEvent, User, TestSession
from app.models.schemas import ProctoringEventCreate, ProctoringEventResponse, ProctoringEventReview, ProctoringEventAdminResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/proctoring", tags=["proctoring"])


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
        event_metadata=payload.metadata,
        detected_at=datetime.utcnow(),
    )
    db.add(evt)
    await db.commit()
    await db.refresh(evt)
    return ProctoringEventResponse.from_orm(evt)


def _serialize_event(evt: ProctoringEvent, session: TestSession | None) -> dict:
    # Safely serialize a ProctoringEvent to a plain dict suitable for JSON responses.
    # Some DB rows may have `metadata` column name conflicts; ensure `event_metadata` is a dict.
    try:
        base = ProctoringEventResponse.from_orm(evt).dict(by_alias=True)
    except Exception:
        # Fallback: build the dict manually to avoid Pydantic validation errors (e.g., when event_metadata is not a dict)
        base = {
            "id": getattr(evt, 'id', None),
            "event_id": getattr(evt, 'event_id', None),
            "test_session_id": getattr(evt, 'test_session_id', None),
            "event_type": getattr(evt, 'event_type', None),
            "severity": getattr(evt, 'severity', None),
            "detected_at": getattr(evt, 'detected_at', None),
            "duration_seconds": getattr(evt, 'duration_seconds', None),
            "question_id": getattr(evt, 'question_id', None),
            "snapshot_url": getattr(evt, 'snapshot_url', None),
            # Ensure metadata is a dict
            "metadata": getattr(evt, 'event_metadata', {}) if isinstance(getattr(evt, 'event_metadata', {}), dict) else {},
            "reviewed": getattr(evt, 'reviewed', False),
            "reviewed_by": getattr(evt, 'reviewed_by', None),
            "reviewed_at": getattr(evt, 'reviewed_at', None),
            "reviewer_notes": getattr(evt, 'reviewer_notes', None),
            "flagged": getattr(evt, 'flagged', False),
            "created_at": getattr(evt, 'created_at', None),
        }

    # Attach flattened test session fields for admin UIs
    base.update({
        "test_session_id": base.get('test_session_id') or evt.test_session_id,
        "test_session_candidate_name": getattr(session, 'candidate_name', None) if session else None,
        "test_session_candidate_email": getattr(session, 'candidate_email', None) if session else None,
        "test_session_job_title": getattr(session, 'job_title', None) if session else None,
        "test_session_score_percentage": getattr(session, 'score_percentage', None) if session else None,
    })
    return base


@router.get("/events", response_model=List["ProctoringEventAdminResponse"])
async def list_events(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_admin(current_user)
    # Join TestSession to provide richer context to admin UIs
    stmt = select(ProctoringEvent, TestSession).outerjoin(TestSession, TestSession.session_id == ProctoringEvent.test_session_id).order_by(desc(ProctoringEvent.detected_at)).limit(100)
    result = await db.execute(stmt)
    rows = result.all()
    out = []
    for evt, session in rows:
        out.append(_serialize_event(evt, session))
    return out


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
