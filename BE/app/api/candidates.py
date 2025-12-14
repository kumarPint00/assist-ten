"""Candidates API endpoints."""
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re

from app.core.dependencies import get_db, get_current_user, optional_user
from app.db.models import Candidate, User, UploadedDocument
from app.models.schemas import CandidateCreate, CandidateUpdate, CandidateResponse, FieldError, ValidationErrorResponse


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
