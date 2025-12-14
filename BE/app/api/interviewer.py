"""Interviewer endpoints for interview scheduling and feedback."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import InterviewSession, InterviewFeedback
from app.models.schemas import (
    InterviewSessionCreate,
    InterviewSessionUpdate,
    InterviewSessionResponse,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    InterviewFeedbackUpdate,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/interviewer", tags=["interviewer"])


def _ensure_interviewer_or_admin(user):
    if not hasattr(user, 'role') or user.role not in ("interviewer", "admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Interviewer or admin privileges required")





@router.get("/interviews", response_model=List[InterviewSessionResponse])
async def list_my_interviews(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[InterviewSessionResponse]:
    # Interviewers see their interviews; admins see all
    if current_user.role in ("admin", "superadmin"):
        stmt = select(InterviewSession).order_by(desc(InterviewSession.scheduled_at))
    else:
        stmt = select(InterviewSession).where(InterviewSession.interviewer_id == current_user.id).order_by(desc(InterviewSession.scheduled_at))

    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [InterviewSessionResponse.from_orm(r) for r in rows]


@router.post("/interviews", response_model=InterviewSessionResponse, status_code=201)
async def schedule_interview(
    payload: InterviewSessionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    _ensure_interviewer_or_admin(current_user)

    interview = InterviewSession(
        candidate_id=payload.candidate_id,
        requisition_id=payload.requisition_id,
        assessment_application_id=payload.assessment_application_id,
        interview_type=payload.interview_type,
        interview_mode=payload.interview_mode,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        timezone=payload.timezone,
        interviewer_id=current_user.id,
        additional_interviewers=payload.additional_interviewers,
        preparation_notes=payload.preparation_notes,
        question_guide=payload.question_guide,
        meeting_link=payload.meeting_link,
        meeting_room=payload.meeting_room,
    )
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return InterviewSessionResponse.from_orm(interview)


@router.get("/interviews/{interview_id}", response_model=InterviewSessionResponse)
async def get_interview(interview_id: str, db: AsyncSession = Depends(get_db)) -> InterviewSessionResponse:
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    return InterviewSessionResponse.from_orm(iv)


@router.patch("/interviews/{interview_id}", response_model=InterviewSessionResponse)
async def update_interview(
    interview_id: str,
    payload: InterviewSessionUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionResponse:
    _ensure_interviewer_or_admin(current_user)
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Only interviewer or admin can update
    if current_user.role not in ("admin", "superadmin") and current_user.id != iv.interviewer_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this interview")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(iv, k, v)

    await db.commit()
    await db.refresh(iv)
    return InterviewSessionResponse.from_orm(iv)


@router.post("/interviews/{interview_id}/start")
async def start_interview(interview_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _ensure_interviewer_or_admin(current_user)
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    iv.status = "in_progress"
    iv.started_at = datetime.utcnow()
    await db.commit()
    return {"message": "Interview started"}


@router.post("/interviews/{interview_id}/complete")
async def complete_interview(interview_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _ensure_interviewer_or_admin(current_user)
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    iv.status = "completed"
    iv.ended_at = datetime.utcnow()
    if iv.started_at:
        iv.actual_duration_minutes = int((iv.ended_at - iv.started_at).total_seconds() // 60)
    await db.commit()
    return {"message": "Interview completed"}


@router.post("/interviews/{interview_id}/cancel")
async def cancel_interview(interview_id: str, payload: Optional[dict] = None, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    _ensure_interviewer_or_admin(current_user)
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    iv = result.scalar_one_or_none()
    if not iv:
        raise HTTPException(status_code=404, detail="Interview not found")
    iv.status = "cancelled"
    if payload and payload.get("reason"):
        iv.cancellation_reason = payload.get("reason")
    await db.commit()
    return {"message": "Interview cancelled"}


@router.get("/interviews/candidate/{candidate_id}", response_model=List[InterviewSessionResponse])
async def list_candidate_interviews(candidate_id: int, page: int = 1, per_page: int = 20, db: AsyncSession = Depends(get_db)) -> List[InterviewSessionResponse]:
    stmt = select(InterviewSession).where(InterviewSession.candidate_id == candidate_id).order_by(desc(InterviewSession.scheduled_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [InterviewSessionResponse.from_orm(r) for r in rows]


@router.get("/interviews/requisition/{requisition_id}", response_model=List[InterviewSessionResponse])
async def list_requisition_interviews(requisition_id: str, page: int = 1, per_page: int = 20, db: AsyncSession = Depends(get_db)) -> List[InterviewSessionResponse]:
    stmt = select(InterviewSession).where(InterviewSession.requisition_id == requisition_id).order_by(desc(InterviewSession.scheduled_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [InterviewSessionResponse.from_orm(r) for r in rows]


@router.get("/feedback/{interview_id}", response_model=InterviewFeedbackResponse)
async def get_feedback(interview_id: str, db: AsyncSession = Depends(get_db)) -> InterviewFeedbackResponse:
    result = await db.execute(select(InterviewFeedback).where(InterviewFeedback.interview_id == interview_id))
    fb = result.scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return InterviewFeedbackResponse.from_orm(fb)


@router.get("/feedback", response_model=List[InterviewFeedbackResponse])
async def list_feedbacks(interviewer_id: Optional[int] = None, recommendation: Optional[str] = None, page: int = 1, per_page: int = 20, db: AsyncSession = Depends(get_db)) -> List[InterviewFeedbackResponse]:
    stmt = select(InterviewFeedback)
    if interviewer_id:
        stmt = stmt.where(InterviewFeedback.interviewer_id == interviewer_id)
    if recommendation:
        stmt = stmt.where(InterviewFeedback.recommendation == recommendation)
    stmt = stmt.order_by(desc(InterviewFeedback.submitted_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [InterviewFeedbackResponse.from_orm(r) for r in rows]


@router.patch("/feedback/{interview_id}", response_model=InterviewFeedbackResponse)
async def update_feedback(interview_id: str, payload: InterviewFeedbackUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> InterviewFeedbackResponse:
    _ensure_interviewer_or_admin(current_user)
    result = await db.execute(select(InterviewFeedback).where(InterviewFeedback.interview_id == interview_id))
    fb = result.scalar_one_or_none()
    if not fb:
        raise HTTPException(status_code=404, detail="Feedback not found")
    # Only original interviewer or admin can update
    if current_user.role not in ("admin", "superadmin") and current_user.id != fb.interviewer_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this feedback")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(fb, k, v)
    await db.commit()
    await db.refresh(fb)
    return InterviewFeedbackResponse.from_orm(fb)


@router.post("/feedback", response_model=InterviewFeedbackResponse, status_code=201)
async def submit_feedback(payload: InterviewFeedbackCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> InterviewFeedbackResponse:
    _ensure_interviewer_or_admin(current_user)
    feedback = InterviewFeedback(
        interview_id=payload.interview_id,
        interviewer_id=current_user.id,
        overall_rating=payload.overall_rating,
        recommendation=payload.recommendation,
        technical_skills_rating=payload.technical_skills_rating,
        communication_rating=payload.communication_rating,
        problem_solving_rating=payload.problem_solving_rating,
        culture_fit_rating=payload.culture_fit_rating,
        skills_evaluated=payload.skills_evaluated,
        strengths=payload.strengths,
        weaknesses=payload.weaknesses,
        detailed_notes=payload.detailed_notes,
        questions_asked=payload.questions_asked,
        requires_second_round=payload.requires_second_round,
        follow_up_notes=payload.follow_up_notes,
        submitted_at=datetime.utcnow(),
    )
    db.add(feedback)
    await db.commit()
    await db.refresh(feedback)
    return InterviewFeedbackResponse.from_orm(feedback)
