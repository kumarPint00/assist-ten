"""Candidates API endpoints."""
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re
from sqlalchemy import func, cast
from sqlalchemy import String as SAString

from app.core.dependencies import get_db, get_current_user, optional_user
from app.db.models import Candidate, User, UploadedDocument
from app.models.schemas import CandidateCreate, CandidateUpdate, CandidateResponse, FieldError, ValidationErrorResponse
from app.db.models import AssessmentApplication
from app.models.schemas import AssessmentApplicationResponse, UploadedDocumentResponse
from app.models.schemas import CandidateNoteCreate, CandidateNoteResponse
from app.db.models import CandidateNote, AssessmentToken
from app.models.schemas import AssessmentInviteRequest, AssessmentInviteResponse
from app.core.security import check_admin
from app.models.schemas import CandidateSearchResponse
from fastapi.responses import StreamingResponse
import csv
import io
import secrets
from app.core.email import send_email
from config import get_settings
from datetime import timedelta


# Schema for CV data from frontend
class CVExtractedDataRequest(BaseModel):
    """Schema for CV extracted data from frontend."""
    full_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    current_role: Optional[str] = None
    current_company: Optional[str] = None
    experience_years: Optional[str] = None
    education: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = "mid"
    availability_percentage: int = 100

# Response schemas for new endpoints
class EmailValidationResponse(BaseModel):
    email: str
    is_available: bool
    existing_candidate_id: Optional[str] = None
    message: str

class SkillsOverrideRequest(BaseModel):
    submitted_skills: dict  # {skill_name: proficiency_level}

router = APIRouter(prefix="/api/v1/candidates", tags=["candidates"])


@router.get("/check-email", response_model=EmailValidationResponse)
async def check_email_availability(
    email: str = Query(..., description="Email to validate"),
    db: AsyncSession = Depends(get_db),
) -> EmailValidationResponse:
    """
    Real-time email validation endpoint.
    
    Check if email is available for a new candidate profile.
    Returns existing candidate info if email already registered.
    
    Query Parameters:
    - email: Email address to validate
    
    Returns:
    - is_available: True if email can be used for new candidate
    - existing_candidate_id: If email exists, returns the candidate_id
    - message: Human-readable status message
    """
    stmt = select(Candidate).where(Candidate.email == email)
    result = await db.execute(stmt)
    existing = result.scalars().first()
    
    if existing:
        return EmailValidationResponse(
            email=email,
            is_available=False,
            existing_candidate_id=existing.candidate_id,
            message=f"Email already registered for candidate: {existing.full_name}"
        )
    
    return EmailValidationResponse(
        email=email,
        is_available=True,
        existing_candidate_id=None,
        message="Email is available for registration"
    )


@router.post("", response_model=CandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    request: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_user),
) -> CandidateResponse:
    """
    Create a new candidate profile.
    
    - Can be anonymous (no user_id) or linked to authenticated user
    - Email validation: Must be valid format
    - Experience level: junior, mid, senior, lead, executive, etc.
    """
    # Check if candidate with same email already exists
    stmt = select(Candidate).where(Candidate.email == request.email)
    existing = await db.execute(stmt)
    if existing.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Candidate with email {request.email} already exists"
        )
    
    candidate = Candidate(
        user_id=current_user.id if current_user else None,
        full_name=request.full_name,
        email=request.email,
        phone=request.phone,
        experience_level=request.experience_level,
        skills=request.skills,
        availability_percentage=min(100, max(0, request.availability_percentage)),
    )
    
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    
    return CandidateResponse(
        id=candidate.id,
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        experience_level=candidate.experience_level,
        skills=candidate.skills,
        availability_percentage=candidate.availability_percentage,
        jd_file_id=candidate.jd_file_id,
        cv_file_id=candidate.cv_file_id,
        portfolio_file_id=candidate.portfolio_file_id,
        is_active=candidate.is_active,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.get("/me", response_model=CandidateResponse)
async def get_current_candidate(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CandidateResponse:
    """Get current authenticated user's candidate profile."""
    stmt = select(Candidate).where(Candidate.user_id == current_user.id)
    candidate = await db.execute(stmt)
    result = candidate.scalars().first()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found"
        )
    
    return CandidateResponse(
        id=result.id,
        candidate_id=result.candidate_id,
        full_name=result.full_name,
        email=result.email,
        phone=result.phone,
        experience_level=result.experience_level,
        skills=result.skills,
        availability_percentage=result.availability_percentage,
        jd_file_id=result.jd_file_id,
        cv_file_id=result.cv_file_id,
        portfolio_file_id=result.portfolio_file_id,
        is_active=result.is_active,
        created_at=result.created_at,
        updated_at=result.updated_at,
    )


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
) -> CandidateResponse:
    """Get candidate profile by ID."""
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return CandidateResponse(
        id=candidate.id,
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        experience_level=candidate.experience_level,
        skills=candidate.skills,
        availability_percentage=candidate.availability_percentage,
        jd_file_id=candidate.jd_file_id,
        cv_file_id=candidate.cv_file_id,
        portfolio_file_id=candidate.portfolio_file_id,
        is_active=candidate.is_active,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.put("/{candidate_id}", response_model=CandidateResponse)
async def update_candidate(
    candidate_id: str,
    request: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
) -> CandidateResponse:
    """Update candidate profile."""
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Update fields if provided
    if request.full_name is not None:
        candidate.full_name = request.full_name
    if request.phone is not None:
        candidate.phone = request.phone
    if request.experience_level is not None:
        candidate.experience_level = request.experience_level
    if request.skills is not None:
        candidate.skills = request.skills
    if request.availability_percentage is not None:
        candidate.availability_percentage = min(100, max(0, request.availability_percentage))
    
    candidate.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(candidate)
    
    return CandidateResponse(
        id=candidate.id,
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        experience_level=candidate.experience_level,
        skills=candidate.skills,
        availability_percentage=candidate.availability_percentage,
        jd_file_id=candidate.jd_file_id,
        cv_file_id=candidate.cv_file_id,
        portfolio_file_id=candidate.portfolio_file_id,
        is_active=candidate.is_active,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.patch("/{candidate_id}", response_model=CandidateResponse)
async def patch_candidate(
    candidate_id: str,
    request: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
) -> CandidateResponse:
    """Partial update for candidate profile (PATCH) - mirrors PUT behavior for now."""
    return await update_candidate(candidate_id, request, db)


@router.post("/{candidate_id}/files/{file_type}", response_model=CandidateResponse)
async def link_uploaded_file(
    candidate_id: str,
    file_type: str,  # jd, cv, portfolio
    file_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> CandidateResponse:
    """
    Link an uploaded document to candidate profile.
    
    - file_type: jd, cv, portfolio
    - file_id: The file_id of the uploaded document
    """
    # Validate file_type
    valid_types = ["jd", "cv", "portfolio"]
    if file_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Get candidate
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Verify file exists
    file_stmt = select(UploadedDocument).where(UploadedDocument.file_id == file_id)
    file_result = await db.execute(file_stmt)
    uploaded_doc = file_result.scalars().first()
    if not uploaded_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Uploaded file not found"
        )
    
    # Authorization: only uploader or superadmin can link uploaded file to candidate
    # uploaded_doc already retrieved above
    if current_user and getattr(current_user, 'role', '') == 'admin':
        if uploaded_doc.user_id and uploaded_doc.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    elif current_user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Link file to candidate
    if file_type == "jd":
        candidate.jd_file_id = file_id
    elif file_type == "cv":
        candidate.cv_file_id = file_id
    elif file_type == "portfolio":
        candidate.portfolio_file_id = file_id
    
    candidate.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(candidate)
    
    return CandidateResponse(
        id=candidate.id,
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        experience_level=candidate.experience_level,
        skills=candidate.skills,
        availability_percentage=candidate.availability_percentage,
        jd_file_id=candidate.jd_file_id,
        cv_file_id=candidate.cv_file_id,
        portfolio_file_id=candidate.portfolio_file_id,
        is_active=candidate.is_active,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.put("/{candidate_id}/skills", response_model=CandidateResponse)
async def override_candidate_skills(
    candidate_id: str,
    request: SkillsOverrideRequest,
    db: AsyncSession = Depends(get_db),
) -> CandidateResponse:
    """
    Manually override auto-extracted skills for a candidate.
    
    Allows candidates to correct or adjust the skills suggested from their JD.
    
    Parameters:
    - candidate_id: The candidate's unique ID
    - submitted_skills: Dict mapping skill names to proficiency levels
        Example: {"Python": "expert", "React": "intermediate"}
    
    Returns:
    - Updated candidate profile with new skills
    """
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalars().first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    # Update skills
    candidate.skills = request.submitted_skills
    candidate.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(candidate)
    
    return CandidateResponse(
        id=candidate.id,
        candidate_id=candidate.candidate_id,
        full_name=candidate.full_name,
        email=candidate.email,
        phone=candidate.phone,
        experience_level=candidate.experience_level,
        skills=candidate.skills,
        availability_percentage=candidate.availability_percentage,
        jd_file_id=candidate.jd_file_id,
        cv_file_id=candidate.cv_file_id,
        portfolio_file_id=candidate.portfolio_file_id,
        is_active=candidate.is_active,
        created_at=candidate.created_at,
        updated_at=candidate.updated_at,
    )


@router.get("/{candidate_id}/applications", response_model=List[AssessmentApplicationResponse])
async def list_candidate_applications(candidate_id: str, page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=200), db: AsyncSession = Depends(get_db)) -> List[AssessmentApplicationResponse]:
    stmt = select(AssessmentApplication).where(AssessmentApplication.candidate_id == candidate_id).order_by(desc(AssessmentApplication.applied_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [AssessmentApplicationResponse.from_orm(r) for r in rows]


@router.post("/{candidate_id}/notes", response_model=CandidateNoteResponse, status_code=201)
async def add_candidate_note(candidate_id: str, payload: CandidateNoteCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Ensure candidate exists
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    note = CandidateNote(
        candidate_id=c.candidate_id,
        author_id=current_user.id,
        note_text=payload.note_text,
        note_type=payload.note_type,
        is_private=payload.is_private,
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return CandidateNoteResponse(
        id=note.id,
        note_id=note.note_id,
        candidate_id=note.candidate_id,
        author_id=note.author_id,
        note_text=note.note_text,
        note_type=note.note_type,
        is_private=note.is_private,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


@router.get("/{candidate_id}/notes", response_model=List[CandidateNoteResponse])
async def list_candidate_notes(candidate_id: str, db: AsyncSession = Depends(get_db), current_user: Optional[User] = Depends(optional_user)):
    stmt = select(CandidateNote).where(CandidateNote.candidate_id == candidate_id).order_by(desc(CandidateNote.created_at))
    result = await db.execute(stmt)
    notes = result.scalars().all()
    # Filter private notes: only author or admin can see private notes
    filtered = []
    for n in notes:
        if not n.is_private:
            filtered.append(n)
        elif current_user and (getattr(current_user, 'role', '') in ('admin','superadmin') or current_user.id == n.author_id):
            filtered.append(n)
    return [CandidateNoteResponse(
        id=n.id,
        note_id=n.note_id,
        candidate_id=n.candidate_id,
        author_id=n.author_id,
        note_text=n.note_text,
        note_type=n.note_type,
        is_private=n.is_private,
        created_at=n.created_at,
        updated_at=n.updated_at,
    ) for n in filtered]


@router.patch("/notes/{note_id}", response_model=CandidateNoteResponse)
async def update_candidate_note(note_id: str, payload: CandidateNoteCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CandidateNote).where(CandidateNote.note_id == note_id))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    # Only author or admin can update
    if current_user.id != n.author_id and getattr(current_user, 'role', '') not in ('admin','superadmin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update note")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(n, k, v)
    await db.commit()
    await db.refresh(n)
    return CandidateNoteResponse.from_orm(n)


@router.delete("/notes/{note_id}")
async def delete_candidate_note(note_id: str, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CandidateNote).where(CandidateNote.note_id == note_id))
    n = result.scalar_one_or_none()
    if not n:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
    if current_user.id != n.author_id and getattr(current_user, 'role', '') not in ('admin','superadmin'):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete note")
    await db.delete(n)
    await db.commit()
    return {"message": "Note deleted"}


@router.get("/search", response_model=CandidateSearchResponse)
async def search_candidates(q: Optional[str] = None, skill: Optional[str] = None, experience_level: Optional[str] = None, is_active: Optional[bool] = None, page: int = Query(1, ge=1), per_page: int = Query(20, ge=1, le=200), db: AsyncSession = Depends(get_db)) -> CandidateSearchResponse:
    stmt = select(Candidate)
    if q:
        like_q = f"%{q}%"
        stmt = stmt.where(func.lower(Candidate.full_name).ilike(like_q.lower()) | func.lower(Candidate.email).ilike(like_q.lower()))
    if experience_level:
        stmt = stmt.where(Candidate.experience_level == experience_level)
    if is_active is not None:
        stmt = stmt.where(Candidate.is_active == is_active)
    if skill:
        # Simple containment match against JSON rendered text
        stmt = stmt.where(func.lower(cast(Candidate.skills, SAString)).like(f"%{skill.lower()}%"))

    total_result = await db.execute(stmt)
    total = len(total_result.scalars().all())

    stmt = stmt.order_by(desc(Candidate.created_at)).limit(per_page).offset((page - 1) * per_page)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return CandidateSearchResponse(total=total, page=page, per_page=per_page, items=[CandidateResponse(
        id=c.id,
        candidate_id=c.candidate_id,
        full_name=c.full_name,
        email=c.email,
        phone=c.phone,
        experience_level=c.experience_level,
        skills=c.skills,
        availability_percentage=c.availability_percentage,
        jd_file_id=c.jd_file_id,
        cv_file_id=c.cv_file_id,
        portfolio_file_id=c.portfolio_file_id,
        is_active=c.is_active,
        created_at=c.created_at,
        updated_at=c.updated_at,
    ) for c in rows])


@router.patch("/{candidate_id}/assign")
async def assign_candidate(candidate_id: str, payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # payload: { recruiter_id: int }
    if getattr(current_user, 'role', '') not in ("admin", "superadmin", "recruiter"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to assign candidate")
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    recruiter_id = payload.get('recruiter_id')
    c.assigned_recruiter_id = recruiter_id
    c.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(c)
    return CandidateResponse(
        id=c.id,
        candidate_id=c.candidate_id,
        full_name=c.full_name,
        email=c.email,
        phone=c.phone,
        experience_level=c.experience_level,
        skills=c.skills,
        availability_percentage=c.availability_percentage,
        jd_file_id=c.jd_file_id,
        cv_file_id=c.cv_file_id,
        portfolio_file_id=c.portfolio_file_id,
        is_active=c.is_active,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.post("/bulk")
async def bulk_candidates(payload: dict, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # payload: { action: 'deactivate'|'reactivate'|'export', candidate_ids: [...] }
    if getattr(current_user, 'role', '') not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    action = payload.get('action')
    ids = payload.get('candidate_ids', [])
    if action in ('deactivate', 'reactivate'):
        stmt = select(Candidate).where(Candidate.candidate_id.in_(ids))
        result = await db.execute(stmt)
        rows = result.scalars().all()
        for c in rows:
            c.is_active = (action == 'reactivate')
            c.updated_at = datetime.utcnow()
        await db.commit()
        return {"message": f"Action {action} applied to {len(rows)} candidates"}
    elif action == 'export':
        # Export CSV
        stmt = select(Candidate).where(Candidate.candidate_id.in_(ids))
        result = await db.execute(stmt)
        rows = result.scalars().all()
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['candidate_id', 'full_name', 'email', 'phone', 'experience_level', 'skills'])
        for c in rows:
            writer.writerow([c.candidate_id, c.full_name, c.email, c.phone, c.experience_level, str(c.skills)])
        output.seek(0)
        return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8')), media_type='text/csv', headers={ 'Content-Disposition': 'attachment; filename="candidates_export.csv"' })
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")


@router.post("/{candidate_id}/invite-assessment", response_model=AssessmentInviteResponse)
async def invite_candidate_assessment(candidate_id: str, request: AssessmentInviteRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Invite a specific candidate to an assessment (wraps existing invite logic). Admin only."""
    await check_admin(current_user)
    # Find candidate
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Parse assessment_id from request.message JSON: {"assessment_id": "..."}
    assessment_id = None
    if request.message:
        import json
        try:
            msgobj = json.loads(request.message)
            assessment_id = msgobj.get('assessment_id')
        except Exception:
            if request.message.startswith('assessment_id:'):
                assessment_id = request.message.split(':', 1)[1].strip()

    if not assessment_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='assessment_id must be provided in request.message as JSON {"assessment_id": "..."}')

    from app.db.models import Assessment
    stmt2 = select(Assessment).where(Assessment.assessment_id == assessment_id)
    res2 = await db.execute(stmt2)
    assessment = res2.scalars().first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours or 24)

    token_record = AssessmentToken(
        token=token,
        assessment_id=assessment.id,
        candidate_email=c.email,
        expires_at=expires_at,
        is_used=False,
        created_by=current_user.id,
    )
    db.add(token_record)
    await db.flush()

    settings = get_settings()
    host = getattr(settings, 'HOST', 'localhost')
    port = getattr(settings, 'PORT', 8000)
    scheme = 'https' if getattr(settings, 'S3_USE_SSL', False) else 'http'
    invite_url = f"{scheme}://{host}:{port}/candidate-assessment/token/{token}"

    subject = f"You're invited to take the assessment: {assessment.title}"
    html_body = f"<p>Hello,</p><p>You have been invited to take the assessment '<strong>{assessment.title}</strong>'. Click the link below to start:</p><p><a href='{invite_url}'>Start Assessment</a></p>"
    if request.message:
        html_body += f"<p>{request.message}</p>"
    html_body += f"<p>This link expires on {expires_at} UTC and is single-use.</p>"

    try:
        await send_email(to_email=c.email, subject=subject, html_body=html_body)
    except Exception:
        pass

    await db.commit()
    invites = [{'email': c.email, 'token': token, 'expires_at': expires_at}]
    return AssessmentInviteResponse(success=True, invites_sent=invites, message="Invite generated and emailed if configured.")


@router.get("/{candidate_id}/files", response_model=List[UploadedDocumentResponse])
async def get_candidate_files(candidate_id: str, db: AsyncSession = Depends(get_db)) -> List[UploadedDocumentResponse]:
    # Return any uploaded documents linked to the candidate (jd, cv, portfolio)
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    file_ids = [fid for fid in [c.jd_file_id, c.cv_file_id, c.portfolio_file_id] if fid]
    if not file_ids:
        return []

    file_stmt = select(UploadedDocument).where(UploadedDocument.file_id.in_(file_ids))
    file_res = await db.execute(file_stmt)
    files = file_res.scalars().all()
    return [UploadedDocumentResponse.from_orm(f) for f in files]


@router.delete("/{candidate_id}")
async def deactivate_candidate(candidate_id: str, current_user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    # Only admins or owner can deactivate
    if current_user is None or getattr(current_user, 'role', '') not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required to deactivate candidate")

    c.is_active = False
    c.updated_at = datetime.utcnow()
    await db.commit()
    return {"message": "Candidate deactivated"}


@router.post("/{candidate_id}/reactivate")
async def reactivate_candidate(candidate_id: str, current_user: Optional[User] = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(stmt)
    c = result.scalars().first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    if current_user is None or getattr(current_user, 'role', '') not in ("admin", "superadmin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required to reactivate candidate")

    c.is_active = True
    c.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(c)
    return CandidateResponse(
        id=c.id,
        candidate_id=c.candidate_id,
        full_name=c.full_name,
        email=c.email,
        phone=c.phone,
        experience_level=c.experience_level,
        skills=c.skills,
        availability_percentage=c.availability_percentage,
        jd_file_id=c.jd_file_id,
        cv_file_id=c.cv_file_id,
        portfolio_file_id=c.portfolio_file_id,
        is_active=c.is_active,
        created_at=c.created_at,
        updated_at=c.updated_at,
    )


@router.post("/save-cv-data", response_model=dict, status_code=status.HTTP_201_CREATED)
async def save_cv_extracted_data(
    request: CVExtractedDataRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_user),
) -> dict:
    """
    Save candidate information extracted from CV.
    
    This endpoint is called after CV text extraction to persist the extracted data.
    If a candidate with the same email exists, it updates the existing record.
    
    Parameters:
    - full_name: Extracted candidate name
    - email: Candidate email (required)
    - phone: Candidate phone number
    - location: Candidate location
    - current_role: Current job title
    - current_company: Current company name
    - experience_years: Years of experience (e.g., "5 years")
    - education: Education details
    - linkedin_url: LinkedIn profile URL
    - github_url: GitHub profile URL
    - portfolio_url: Portfolio website URL
    - skills: List of extracted skills
    - experience_level: Proficiency level (junior, mid, senior, etc.)
    - availability_percentage: Availability percentage (0-100)
    
    Returns:
    - candidate_id: Unique identifier for the candidate
    - full_name, email, phone, etc.: All saved candidate information
    """
    try:
        # Check if candidate with this email already exists
        stmt = select(Candidate).where(Candidate.email == request.email)
        result = await db.execute(stmt)
        existing_candidate = result.scalars().first()
        
        if existing_candidate:
            # Update existing candidate
            existing_candidate.full_name = request.full_name or existing_candidate.full_name
            existing_candidate.phone = request.phone or existing_candidate.phone
            existing_candidate.location = request.location or existing_candidate.location
            existing_candidate.current_role = request.current_role or existing_candidate.current_role
            existing_candidate.education = request.education or existing_candidate.education
            existing_candidate.linkedin_url = request.linkedin_url or existing_candidate.linkedin_url
            existing_candidate.github_url = request.github_url or existing_candidate.github_url
            existing_candidate.portfolio_url = request.portfolio_url or existing_candidate.portfolio_url
            existing_candidate.experience_years = request.experience_years or existing_candidate.experience_years
            
            # Update skills
            if request.skills:
                skills_dict = {skill: "intermediate" for skill in request.skills}
                existing_candidate.skills = skills_dict
            
            candidate = existing_candidate
            action = "updated"
        else:
            # Create new candidate
            candidate = Candidate(
                full_name=request.full_name or "",
                email=request.email,
                phone=request.phone,
                location=request.location,
                current_role=request.current_role,
                education=request.education,
                linkedin_url=request.linkedin_url,
                github_url=request.github_url,
                portfolio_url=request.portfolio_url,
                experience_years=request.experience_years,
                experience_level=request.experience_level or "mid",
                availability_percentage=min(100, max(0, request.availability_percentage)),
                user_id=current_user.id if current_user else None,
                is_active=True,
            )
            
            # Add skills
            if request.skills:
                candidate.skills = {skill: "intermediate" for skill in request.skills}
            
            db.add(candidate)
            action = "created"
        
        candidate.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(candidate)
        
        return {
            "status": "success",
            "message": f"Candidate {action} successfully",
            "candidate_id": candidate.candidate_id,
            "data": {
                "candidate_id": candidate.candidate_id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "location": candidate.location,
                "current_role": candidate.current_role,
                "education": candidate.education,
                "linkedin_url": candidate.linkedin_url,
                "github_url": candidate.github_url,
                "portfolio_url": candidate.portfolio_url,
                "experience_years": candidate.experience_years,
                "experience_level": candidate.experience_level,
                "availability_percentage": candidate.availability_percentage,
                "skills": candidate.skills,
                "is_active": candidate.is_active,
                "created_at": candidate.created_at,
                "updated_at": candidate.updated_at,
            }
        }
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving candidate data: {str(e)}"
        )
