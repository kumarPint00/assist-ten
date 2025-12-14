"""Candidates API endpoints for managing candidate profiles."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import Candidate, User
from app.core.dependencies import get_current_user
from app.models.schemas import (
    CandidateCreateRequest,
    CandidateResponse,
    CandidateUpdateRequest
)

router = APIRouter(prefix="/api/v1/candidates", tags=["candidates"])


class CandidateCreateRequest:
    """Schema for creating/updating candidate information."""
    full_name: str
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
    experience_level: Optional[str] = "mid"
    skills: Optional[dict] = None
    availability_percentage: Optional[int] = 100


@router.post("/create", response_model=dict)
async def create_candidate(
    request_data: dict,
    current_user: Optional[User] = Depends(lambda: None),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Create or update a candidate profile from CV data.
    
    Args:
        request_data: Candidate information extracted from CV
        current_user: Optional current user
        db: Database session
    
    Returns:
        Created/updated candidate information
    """
    
    # Check if candidate with this email already exists
    query = select(Candidate).where(Candidate.email == request_data.get("email"))
    result = await db.execute(query)
    existing_candidate = result.scalar_one_or_none()
    
    try:
        if existing_candidate:
            # Update existing candidate
            existing_candidate.full_name = request_data.get("full_name", existing_candidate.full_name)
            existing_candidate.phone = request_data.get("phone", existing_candidate.phone)
            existing_candidate.location = request_data.get("location", existing_candidate.location)
            existing_candidate.current_role = request_data.get("current_role", existing_candidate.current_role)
            existing_candidate.education = request_data.get("education", existing_candidate.education)
            existing_candidate.linkedin_url = request_data.get("linkedin_url", existing_candidate.linkedin_url)
            existing_candidate.github_url = request_data.get("github_url", existing_candidate.github_url)
            existing_candidate.portfolio_url = request_data.get("portfolio_url", existing_candidate.portfolio_url)
            existing_candidate.experience_years = request_data.get("experience_years", existing_candidate.experience_years)
            
            # Add skills
            skills_list = request_data.get("skills", [])
            if skills_list:
                skills_dict = {skill: "intermediate" for skill in skills_list}
                existing_candidate.skills = skills_dict
            
            candidate = existing_candidate
            action = "updated"
        else:
            # Create new candidate
            candidate = Candidate(
                full_name=request_data.get("full_name", ""),
                email=request_data.get("email", ""),
                phone=request_data.get("phone"),
                location=request_data.get("location"),
                current_role=request_data.get("current_role"),
                education=request_data.get("education"),
                linkedin_url=request_data.get("linkedin_url"),
                github_url=request_data.get("github_url"),
                portfolio_url=request_data.get("portfolio_url"),
                experience_years=request_data.get("experience_years"),
                experience_level=request_data.get("experience_level", "mid"),
                availability_percentage=request_data.get("availability_percentage", 100),
                user_id=current_user.id if current_user else None,
                is_active=True,
            )
            
            # Add skills
            skills_list = request_data.get("skills", [])
            if skills_list:
                candidate.skills = {skill: "intermediate" for skill in skills_list}
            
            db.add(candidate)
            action = "created"
        
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
            }
        }
    
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating candidate: {str(e)}"
        )


@router.get("/{candidate_id}", response_model=dict)
async def get_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Get candidate information by ID."""
    query = select(Candidate).where(Candidate.candidate_id == candidate_id)
    result = await db.execute(query)
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    return {
        "status": "success",
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
        }
    }


@router.get("", response_model=dict)
async def list_candidates(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
) -> dict:
    """List all candidates with pagination."""
    # If current user is admin, only show their candidates; superadmin sees all
    if current_user and getattr(current_user, 'role', '') == 'admin':
        query = select(Candidate).where(Candidate.user_id == current_user.id).offset(skip).limit(limit)
    else:
        query = select(Candidate).offset(skip).limit(limit)
    result = await db.execute(query)
    candidates = result.scalars().all()
    
    if current_user and getattr(current_user, 'role', '') == 'admin':
        total_query = select(Candidate).where(Candidate.user_id == current_user.id)
    else:
        total_query = select(Candidate)
    total_result = await db.execute(total_query)
    total = len(total_result.scalars().all())
    
    return {
        "status": "success",
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [
            {
                "candidate_id": c.candidate_id,
                "full_name": c.full_name,
                "email": c.email,
                "phone": c.phone,
                "location": c.location,
                "current_role": c.current_role,
                "experience_level": c.experience_level,
                "availability_percentage": c.availability_percentage,
            }
            for c in candidates
        ]
    }
