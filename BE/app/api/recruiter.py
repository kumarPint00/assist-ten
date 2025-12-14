"""Recruiter endpoints for job requisitions and application notes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import JobRequisition, ApplicationNote, AssessmentApplication
from app.models.schemas import (
    JobRequisitionCreate,
    JobRequisitionUpdate,
    JobRequisitionResponse,
    ApplicationNoteCreate,
    ApplicationNoteResponse,
    AssessmentApplicationResponse,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/api/v1/recruiter", tags=["recruiter"])


def _ensure_recruiter_or_admin(user):
    if not hasattr(user, 'role') or user.role not in ("recruiter", "admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Recruiter or admin privileges required")




@router.get("/requisitions", response_model=List[JobRequisitionResponse])
async def list_requisitions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> List[JobRequisitionResponse]:
    stmt = select(JobRequisition).order_by(desc(JobRequisition.created_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [JobRequisitionResponse.from_orm(r) for r in rows]


@router.post("/requisitions", response_model=JobRequisitionResponse, status_code=201)
async def create_requisition(
    req: JobRequisitionCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobRequisitionResponse:
    _ensure_recruiter_or_admin(current_user)

    requisition = JobRequisition(
        title=req.title,
        description=req.description,
        department=req.department,
        location=req.location,
        employment_type=req.employment_type,
        required_skills=req.required_skills,
        experience_level=req.experience_level,
        min_experience_years=req.min_experience_years,
        max_experience_years=req.max_experience_years,
        min_salary=req.min_salary,
        max_salary=req.max_salary,
        currency=req.currency,
        positions_available=req.positions_available,
        jd_id=req.jd_id,
        assessment_id=req.assessment_id,
        hiring_manager_id=req.hiring_manager_id,
        created_by=current_user.id,
    )

    db.add(requisition)
    await db.commit()
    await db.refresh(requisition)

    return JobRequisitionResponse.from_orm(requisition)


@router.get("/requisitions/{requisition_id}", response_model=JobRequisitionResponse)
async def get_requisition(requisition_id: str, db: AsyncSession = Depends(get_db)) -> JobRequisitionResponse:
    result = await db.execute(select(JobRequisition).where(JobRequisition.requisition_id == requisition_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return JobRequisitionResponse.from_orm(req)


@router.patch("/requisitions/{requisition_id}", response_model=JobRequisitionResponse)
async def update_requisition(
    requisition_id: str,
    payload: JobRequisitionUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JobRequisitionResponse:
    _ensure_recruiter_or_admin(current_user)
    result = await db.execute(select(JobRequisition).where(JobRequisition.requisition_id == requisition_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    # Only creator/hiring_manager or admin can update
    if current_user.role not in ("admin", "superadmin") and current_user.id not in (req.created_by, req.hiring_manager_id):
        raise HTTPException(status_code=403, detail="Not authorized to update this requisition")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(req, k, v)

    await db.commit()
    await db.refresh(req)
    return JobRequisitionResponse.from_orm(req)


@router.post("/requisitions/{requisition_id}/publish")
async def publish_requisition(
    requisition_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_recruiter_or_admin(current_user)
    result = await db.execute(select(JobRequisition).where(JobRequisition.requisition_id == requisition_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    req.is_published = True
    req.published_at = datetime.utcnow()
    req.status = "open"
    await db.commit()
    return {"message": "Published"}


@router.post("/applications/{application_id}/notes", response_model=ApplicationNoteResponse, status_code=201)
async def add_application_note(
    application_id: str,
    payload: ApplicationNoteCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Ensure application exists
    result = await db.execute(select(AssessmentApplication).where(AssessmentApplication.application_id == application_id))
    app_obj = result.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    note = ApplicationNote(
        application_id=application_id,
        author_id=current_user.id,
        note_text=payload.note_text,
        note_type=payload.note_type,
        is_private=payload.is_private,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return ApplicationNoteResponse.from_orm(note)


@router.get("/applications/{application_id}/notes", response_model=List[ApplicationNoteResponse])
async def list_application_notes(application_id: str, db: AsyncSession = Depends(get_db)) -> List[ApplicationNoteResponse]:
    stmt = select(ApplicationNote).where(ApplicationNote.application_id == application_id).order_by(desc(ApplicationNote.created_at))
    result = await db.execute(stmt)
    notes = result.scalars().all()
    return [ApplicationNoteResponse.from_orm(n) for n in notes]


@router.get("/applications", response_model=List[AssessmentApplicationResponse])
async def list_applications(
    requisition_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> List[AssessmentApplicationResponse]:
    stmt = select(AssessmentApplication)
    if requisition_id:
        stmt = stmt.where(AssessmentApplication.requisition_id == requisition_id)
    if status:
        stmt = stmt.where(AssessmentApplication.status == status)
    stmt = stmt.order_by(desc(AssessmentApplication.applied_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [AssessmentApplicationResponse.from_orm(r) for r in rows]


@router.get("/applications/{application_id}", response_model=AssessmentApplicationResponse)
async def get_application(application_id: str, db: AsyncSession = Depends(get_db)) -> AssessmentApplicationResponse:
    result = await db.execute(select(AssessmentApplication).where(AssessmentApplication.application_id == application_id))
    app_obj = result.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    return AssessmentApplicationResponse.from_orm(app_obj)


@router.patch("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    payload: dict,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _ensure_recruiter_or_admin(current_user)
    result = await db.execute(select(AssessmentApplication).where(AssessmentApplication.application_id == application_id))
    app_obj = result.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # Expect payload like {"status": "shortlisted", "note": "Reason"}
    if "status" in payload:
        app_obj.status = payload["status"]
    if "note" in payload and payload["note"]:
        note = ApplicationNote(
            application_id=application_id,
            author_id=current_user.id,
            note_text=payload["note"],
            note_type="status",
            is_private=True,
        )
        db.add(note)

    await db.commit()
    await db.refresh(app_obj)
    return AssessmentApplicationResponse.from_orm(app_obj)


@router.get("/requisitions/{requisition_id}/applications", response_model=List[AssessmentApplicationResponse])
async def list_requisition_applications(requisition_id: str, page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=200), db: AsyncSession = Depends(get_db)) -> List[AssessmentApplicationResponse]:
    stmt = select(AssessmentApplication).where(AssessmentApplication.requisition_id == requisition_id)
    stmt = stmt.order_by(desc(AssessmentApplication.applied_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [AssessmentApplicationResponse.from_orm(r) for r in rows]
