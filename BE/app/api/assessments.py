"""Assessments API endpoints."""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

from app.core.dependencies import get_db, get_current_user, optional_auth, validate_assessment_token
from app.core.security import check_admin, is_admin_user
from app.core.email import send_email
from config import get_settings
import secrets
from datetime import timedelta
from app.db.models import AssessmentToken
from app.models.schemas import AssessmentInviteRequest, AssessmentInviteResponse
from app.db.models import Assessment, AssessmentApplication, Candidate, User, JobDescription, TestSession, Question
from app.models.schemas import (
    AssessmentCreate, AssessmentUpdate, AssessmentResponse,
    AssessmentApplicationRequest, AssessmentApplicationResponse,
    StartQuestionSetTestResponse
)

router = APIRouter(prefix="/api/v1/assessments", tags=["assessments"])


@router.get("", response_model=List[AssessmentResponse])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_auth),
    is_published: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    show_all: bool = Query(False, description="Show all assessments including unpublished (admin only)"),
) -> List[AssessmentResponse]:
    """
    List all assessments.
    
    Query Parameters:
    - is_published: Filter by published status
    - skip: Number of records to skip
    - limit: Number of records to return
    - show_all: If true, shows all assessments (for admin dashboard)
    """
    query = select(Assessment).where(Assessment.is_active == True)
    
    if show_all:
        # show_all only allowed for superadmin
        if not (current_user and getattr(current_user, 'role', '') == 'superadmin'):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only superadmin can view all resources")
        if is_published is not None:
            query = query.where(Assessment.is_published == is_published)
    elif is_published is not None:
        query = query.where(Assessment.is_published == is_published)
    else:
        query = query.where(Assessment.is_published == True)
    
    # If current user is admin (non-superadmin), only show their created assessments
    if current_user and getattr(current_user, 'role', '') == 'admin':
        query = query.where(Assessment.created_by == current_user.id)
    query = query.order_by(desc(Assessment.created_at))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    assessments = result.scalars().all()
    
    return [
        AssessmentResponse(
            id=a.id,
            assessment_id=a.assessment_id,
            title=a.title,
            description=a.description,
            job_title=a.job_title,
            jd_id=a.jd_id,
            required_skills=a.required_skills,
            required_roles=a.required_roles,
            question_set_id=a.question_set_id,
            assessment_method=a.assessment_method,
            duration_minutes=a.duration_minutes,
            is_questionnaire_enabled=a.is_questionnaire_enabled,
            is_interview_enabled=a.is_interview_enabled,
            is_active=a.is_active,
            is_published=a.is_published,
            is_expired=a.is_expired,
            expires_at=a.expires_at,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in assessments
    ]


@router.get("/{assessment_id}", response_model=dict)
async def get_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(optional_auth),
) -> dict:
    """
    Get assessment details by ID with enriched data.
    
    Access Control:
    - Admins can access all assessments (published and drafts)
    - Candidates can only access published assessments
    - Returns appropriate error for draft/expired assessments
    
    Returns:
    - Assessment metadata
    - Extracted skills from linked JD
    - Extracted roles from linked JD
    - Assessment method configuration
    - Required qualifications
    """
    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )

    # Determine admin role
    is_admin_role = False
    if current_user and hasattr(current_user, 'role'):
        is_admin_role = current_user.role in ("admin", "superadmin")

    # Non-admin users can only access published assessments
    if not is_admin_role and not assessment.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This assessment is not available yet. Please contact the administrator."
        )

    if not assessment.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This assessment is no longer active."
        )

    # If admin role and not superadmin, only allow access to assessments created by this admin
    if current_user and getattr(current_user, 'role', '') == "admin" and assessment.created_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")
    
    response = {
        "id": assessment.id,
        "assessment_id": assessment.assessment_id,
        "title": assessment.title,
        "description": assessment.description,
        "job_title": assessment.job_title,
        "jd_id": assessment.jd_id,
        "required_skills": assessment.required_skills,
        "required_roles": assessment.required_roles,
        "question_set_id": assessment.question_set_id,
        "assessment_method": assessment.assessment_method,
        "duration_minutes": assessment.duration_minutes,
        "is_questionnaire_enabled": assessment.is_questionnaire_enabled,
        "is_interview_enabled": assessment.is_interview_enabled,
        "is_active": assessment.is_active,
        "is_published": assessment.is_published,
        "is_expired": assessment.is_expired,
        "expires_at": assessment.expires_at,
        "created_at": assessment.created_at,
        "updated_at": assessment.updated_at,
    }
    
    if assessment.jd_id:
        jd_stmt = select(JobDescription).where(JobDescription.jd_id == assessment.jd_id)
        jd_result = await db.execute(jd_stmt)
        jd = jd_result.scalars().first()
        
        if jd:
            from app.api.skills import extract_skills_from_text, extract_roles_from_text
            
            extracted_text = jd.extracted_text or jd.description or ""
            extracted_skills = extract_skills_from_text(extracted_text)
            extracted_roles = extract_roles_from_text(jd.title or "", extracted_text)
            
            response["extracted_skills"] = extracted_skills
            response["extracted_roles"] = extracted_roles
            response["jd_details"] = {
                "jd_id": jd.jd_id,
                "title": jd.title,
                "description": jd.description,
                "file_name": jd.file_name,
                "file_size": jd.file_size,
                "created_at": jd.created_at,
            }
    
    return response


@router.post("", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    request: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentResponse:
    """
    Create a new assessment (Admin only).
    
    Requirements:
    - Admin role required
    - Title must be unique
    - If jd_id provided, verify JD exists
    - Questionnaire method must be enabled
    - If candidate_info provided, creates or updates candidate record
    """
    await check_admin(current_user)
    
    if request.jd_id:
        jd_stmt = select(JobDescription).where(JobDescription.jd_id == request.jd_id)
        jd_result = await db.execute(jd_stmt)
        if not jd_result.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job description {request.jd_id} not found"
            )
    
    candidate_db = None
    if request.candidate_info and request.candidate_info.email:
        cand_stmt = select(Candidate).where(Candidate.email == request.candidate_info.email)
        cand_result = await db.execute(cand_stmt)
        candidate_db = cand_result.scalars().first()
        
        experience_level = "mid"
        if request.candidate_info.experience:
            try:
                years = int(''.join(filter(str.isdigit, request.candidate_info.experience)) or 0)
                if years < 2:
                    experience_level = "junior"
                elif years < 5:
                    experience_level = "mid"
                elif years < 8:
                    experience_level = "senior"
                else:
                    experience_level = "lead"
            except:
                pass
        
        if candidate_db:
            if request.candidate_info.name:
                candidate_db.full_name = request.candidate_info.name
            if request.candidate_info.phone:
                candidate_db.phone = request.candidate_info.phone
            if request.candidate_info.current_role:
                candidate_db.current_role = request.candidate_info.current_role
            if request.candidate_info.location:
                candidate_db.location = request.candidate_info.location
            if request.candidate_info.education:
                candidate_db.education = request.candidate_info.education
            if request.candidate_info.linkedin:
                candidate_db.linkedin_url = request.candidate_info.linkedin
            if request.candidate_info.github:
                candidate_db.github_url = request.candidate_info.github
            if request.candidate_info.portfolio:
                candidate_db.portfolio_url = request.candidate_info.portfolio
            if request.candidate_info.experience:
                candidate_db.experience_years = request.candidate_info.experience
                candidate_db.experience_level = experience_level
        else:
            candidate_db = Candidate(
                full_name=request.candidate_info.name or "Unknown",
                email=request.candidate_info.email,
                phone=request.candidate_info.phone,
                current_role=request.candidate_info.current_role,
                location=request.candidate_info.location,
                education=request.candidate_info.education,
                linkedin_url=request.candidate_info.linkedin,
                github_url=request.candidate_info.github,
                portfolio_url=request.candidate_info.portfolio,
                experience_years=request.candidate_info.experience,
                experience_level=experience_level,
                skills=request.required_skills or {},
            )
            db.add(candidate_db)
            await db.flush()
    
    assessment = Assessment(
        title=request.title,
        description=request.description,
        job_title=request.job_title,
        jd_id=request.jd_id,
        required_skills=request.required_skills or {},
        required_roles=request.required_roles or [],
        question_set_id=request.question_set_id,
        assessment_method="questionnaire" if request.is_questionnaire_enabled else "interview",
        duration_minutes=request.duration_minutes,
        is_questionnaire_enabled=request.is_questionnaire_enabled,
        is_interview_enabled=request.is_interview_enabled,
        is_published=True,
        expires_at=request.expires_at,
        created_by=current_user.id,
    )
    
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)
    
    return AssessmentResponse(
        id=assessment.id,
        assessment_id=assessment.assessment_id,
        title=assessment.title,
        description=assessment.description,
        job_title=assessment.job_title,
        jd_id=assessment.jd_id,
        required_skills=assessment.required_skills,
        required_roles=assessment.required_roles,
        question_set_id=assessment.question_set_id,
        assessment_method=assessment.assessment_method,
        duration_minutes=assessment.duration_minutes,
        is_questionnaire_enabled=assessment.is_questionnaire_enabled,
        is_interview_enabled=assessment.is_interview_enabled,
        is_active=assessment.is_active,
        is_published=assessment.is_published,
        is_expired=assessment.is_expired,
        expires_at=assessment.expires_at,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete assessment (Admin only). Soft delete by setting is_active to False."""
    await check_admin(current_user)
    
    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    assessment.is_active = False
    assessment.updated_at = datetime.utcnow()
    await db.commit()
    
    return None


@router.post("/{assessment_id}/publish", response_model=AssessmentResponse)
async def publish_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Publish or unpublish an assessment (Admin only). Toggles is_published status."""
    await check_admin(current_user)
    
    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    assessment.is_published = not assessment.is_published
    assessment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(assessment)
    
    return AssessmentResponse(
        id=assessment.id,
        assessment_id=assessment.assessment_id,
        title=assessment.title,
        description=assessment.description,
        job_title=assessment.job_title,
        jd_id=assessment.jd_id,
        required_skills=assessment.required_skills,
        required_roles=assessment.required_roles,
        question_set_id=assessment.question_set_id,
        assessment_method=assessment.assessment_method,
        duration_minutes=assessment.duration_minutes,
        is_questionnaire_enabled=assessment.is_questionnaire_enabled,
        is_interview_enabled=assessment.is_interview_enabled,
        is_active=assessment.is_active,
        is_published=assessment.is_published,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )


@router.put("/{assessment_id}", response_model=AssessmentResponse)
async def update_assessment(
    assessment_id: str,
    request: AssessmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AssessmentResponse:
    """Update assessment (Admin only)."""
    await check_admin(current_user)
    
    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found"
        )
    
    if request.title is not None:
        assessment.title = request.title
    if request.description is not None:
        assessment.description = request.description
    if request.job_title is not None:
        assessment.job_title = request.job_title
    if request.required_skills is not None:
        assessment.required_skills = request.required_skills
    if request.required_roles is not None:
        assessment.required_roles = request.required_roles
    if request.duration_minutes is not None:
        assessment.duration_minutes = request.duration_minutes
    if request.is_questionnaire_enabled is not None:
        assessment.is_questionnaire_enabled = request.is_questionnaire_enabled
    if request.is_interview_enabled is not None:
        assessment.is_interview_enabled = request.is_interview_enabled
    if request.is_active is not None:
        assessment.is_active = request.is_active
    if request.is_published is not None:
        assessment.is_published = request.is_published
    if request.expires_at is not None:
        assessment.expires_at = request.expires_at
    
    assessment.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(assessment)
    
    return AssessmentResponse(
        id=assessment.id,
        assessment_id=assessment.assessment_id,
        title=assessment.title,
        description=assessment.description,
        job_title=assessment.job_title,
        jd_id=assessment.jd_id,
        required_skills=assessment.required_skills,
        required_roles=assessment.required_roles,
        question_set_id=assessment.question_set_id,
        assessment_method=assessment.assessment_method,
        duration_minutes=assessment.duration_minutes,
        is_questionnaire_enabled=assessment.is_questionnaire_enabled,
        is_interview_enabled=assessment.is_interview_enabled,
        is_active=assessment.is_active,
        is_published=assessment.is_published,
        is_expired=assessment.is_expired,
        expires_at=assessment.expires_at,
        created_at=assessment.created_at,
        updated_at=assessment.updated_at,
    )



@router.post("/{assessment_id}/invite", response_model=AssessmentInviteResponse)
async def invite_candidates(
    assessment_id: str,
    request: AssessmentInviteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite candidates by generating single-use tokens and emailing them the assessment link. Admin only."""
    await check_admin(current_user)
    settings = get_settings()

    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()

    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    invites = []
    for email in request.emails:
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=request.expires_in_hours or 24)

        token_record = AssessmentToken(
            token=token,
            assessment_id=assessment.id,
            candidate_email=email,
            expires_at=expires_at,
            is_used=False,
            created_by=current_user.id,
        )
        db.add(token_record)
        await db.flush()

        # Build invite URL (frontend route expected to handle token)
        host = getattr(settings, 'HOST', 'localhost')
        port = getattr(settings, 'PORT', 8000)
        scheme = 'https' if getattr(settings, 'S3_USE_SSL', False) else 'http'
        invite_url = f"{scheme}://{host}:{port}/candidate-assessment/token/{token}"

        # Send email (use send_email; using synchronous call is okay for MVP)
        subject = f"You're invited to take the assessment: {assessment.title}"
        html_body = f"<p>Hello,</p><p>You have been invited to take the assessment '<strong>{assessment.title}</strong>'. Click the link below to start:</p><p><a href='{invite_url}'>Start Assessment</a></p>"
        if request.message:
            html_body += f"<p>{request.message}</p>"
        html_body += f"<p>This link expires on {expires_at} UTC and is single-use.</p>"

        try:
            await send_email(to_email=email, subject=subject, html_body=html_body)
        except Exception:
            # For deliverability errors, continue but record failure
            pass

        invites.append({
            'email': email,
            'token': token,
            'expires_at': expires_at,
        })

    await db.commit()
    return AssessmentInviteResponse(success=True, invites_sent=invites, message="Invites generated and emails sent if configured.")



@router.get("/access/{token}", response_model=dict)
async def get_assessment_by_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    token_rec = Depends(validate_assessment_token),
    current_user: Optional[User] = Depends(optional_auth),
) -> dict:
    """Validate token and return assessment details with prefilled candidate email (non-editable on frontend)."""
    stmt = select(Assessment).where(Assessment.id == token_rec.assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()

    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    # If assessment not published and user isn't admin, hide
    is_admin_role = False
    if current_user and hasattr(current_user, 'role'):
        is_admin_role = current_user.role in ("admin", "superadmin")

    if not is_admin_role:
        if not assessment.is_published or not assessment.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment is not available")

    response = {
        "id": assessment.id,
        "assessment_id": assessment.assessment_id,
        "title": assessment.title,
        "description": assessment.description,
        "job_title": assessment.job_title,
        "jd_id": assessment.jd_id,
        "question_set_id": assessment.question_set_id,
        "duration_minutes": assessment.duration_minutes,
        "is_published": assessment.is_published,
        "expires_at": assessment.expires_at,
        "candidate_email": token_rec.candidate_email,
        "token": token_rec.token,
    }

    return response



@router.post("/{assessment_id}/start-session", response_model=StartQuestionSetTestResponse)
async def start_assessment_session(
    assessment_id: str,
    token: str = Query(..., description="Single-use assessment token"),
    db: AsyncSession = Depends(get_db),
    token_rec = Depends(validate_assessment_token),
):
    """Start assessment session for candidate using a single-use token.

    Validates token, ensures assessment matches, creates candidate if necessary,
    creates TestSession with question set, and marks token as used.
    """
    # Ensure token belongs to this assessment
    if not token_rec:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    # Load assessment
    stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    result = await db.execute(stmt)
    assessment = result.scalars().first()

    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found")

    if token_rec.assessment_id != assessment.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Token mismatch for this assessment")

    # Create or find candidate
    cand_stmt = select(Candidate).where(Candidate.email == token_rec.candidate_email)
    cand_result = await db.execute(cand_stmt)
    candidate = cand_result.scalars().first()

    if not candidate:
        candidate = Candidate(
            full_name=token_rec.candidate_email.split('@')[0].title(),
            email=token_rec.candidate_email,
            experience_level='mid',
            skills={},
            availability_percentage=100,
        )
        db.add(candidate)
        await db.flush()

    # Ensure assessment has a question_set_id or JD
    if not assessment.question_set_id and not assessment.jd_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No question set or JD configured for this assessment")

    # Create application record
    application = AssessmentApplication(
        candidate_id=candidate.id,
        assessment_id=assessment.id,
        status='in_progress',
        applied_at=datetime.utcnow(),
        started_at=datetime.utcnow(),
        candidate_availability=candidate.availability_percentage,
        submitted_skills=candidate.skills or {},
        role_applied_for=None,
    )
    db.add(application)
    await db.flush()

    # Create test session (QuestionSet preferred)
    started_at = datetime.utcnow()
    test_session = TestSession(
        question_set_id=assessment.question_set_id,
        jd_id=assessment.jd_id,
        user_id=None,
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        started_at=started_at,
        total_questions=0,  # We will set after loading questions
        is_completed=False,
        is_scored=False,
    )
    db.add(test_session)
    await db.flush()

    # Mark token used
    token_rec.is_used = True

    # If question_set_id is present, fetch questions and set total_questions
    question_list = []
    if assessment.question_set_id:
        # Reuse existing logic from question set flow
        qs_stmt = select(Question).where(Question.question_set_id == assessment.question_set_id).order_by(Question.id)
        qs_result = await db.execute(qs_stmt)
        questions = qs_result.scalars().all()
        test_session.total_questions = len(questions)
        # Format questions for response (without correct answers)
        for q in questions:
            options = [
                {'option_id': opt_id, 'text': opt_text}
                for opt_id, opt_text in sorted(q.options.items())
            ]
            question_list.append({
                'question_id': q.id,
                'question_text': q.question_text,
                'options': options,
                'correct_answer': '',
            })
    else:
        # JD-based assessments handled later
        pass

    # Link test_session to application
    application.test_session_id = test_session.session_id

    await db.commit()
    await db.refresh(test_session)
    await db.refresh(application)

    # Build response similar to StartQuestionSetTestResponse
    # Note: skill and level fields repurposed for compatibility
    return StartQuestionSetTestResponse(
        session_id=test_session.session_id,
        question_set_id=assessment.question_set_id or "",
        skill=list(assessment.required_skills.keys())[0] if assessment.required_skills else "",
        level=assessment.assessment_method or 'questionnaire',
        total_questions=test_session.total_questions,
        started_at=started_at,
        questions=question_list,
    )


@router.post("/{assessment_id}/apply", response_model=AssessmentApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_assessment(
    assessment_id: str,
    candidate_id: str,
    request: AssessmentApplicationRequest,
    db: AsyncSession = Depends(get_db),
) -> AssessmentApplicationResponse:
    """
    Candidate applies for an assessment.
    
    - Validates assessment exists and is published
    - Validates candidate exists
    - Prevents duplicate applications
    - Stores form data (availability, skills, role preference)
    """
    assess_stmt = select(Assessment).where(Assessment.assessment_id == assessment_id)
    assess_result = await db.execute(assess_stmt)
    assessment = assess_result.scalars().first()
    
    if not assessment or not assessment.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found or not published"
        )
    
    cand_stmt = select(Candidate).where(Candidate.candidate_id == candidate_id)
    cand_result = await db.execute(cand_stmt)
    candidate = cand_result.scalars().first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    exist_stmt = select(AssessmentApplication).where(
        (AssessmentApplication.candidate_id == candidate.id) &
        (AssessmentApplication.assessment_id == assessment.id)
    )
    exist_result = await db.execute(exist_stmt)
    if exist_result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Candidate has already applied for this assessment"
        )
    
    application = AssessmentApplication(
        candidate_id=candidate.id,
        assessment_id=assessment.id,
        status="pending",
        applied_at=datetime.utcnow(),
        candidate_availability=min(100, max(0, request.candidate_availability)),
        submitted_skills=request.submitted_skills,
        role_applied_for=request.role_applied_for,
    )
    
    db.add(application)
    await db.commit()
    await db.refresh(application)
    
    return AssessmentApplicationResponse(
        id=application.id,
        application_id=application.application_id,
        candidate_id=application.candidate_id,
        assessment_id=application.assessment_id,
        status=application.status,
        candidate_availability=application.candidate_availability,
        submitted_skills=application.submitted_skills,
        role_applied_for=application.role_applied_for,
        applied_at=application.applied_at,
        started_at=application.started_at,
        completed_at=application.completed_at,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@router.get("/{assessment_id}/applications", response_model=List[AssessmentApplicationResponse])
async def list_assessment_applications(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
) -> List[AssessmentApplicationResponse]:
    """
    List all applications for an assessment (Admin only).
    
    Query Parameters:
    - status: Filter by application status
    - skip, limit: Pagination
    """
    await check_admin(current_user)
    
    query = select(AssessmentApplication).where(AssessmentApplication.assessment_id == assessment_id)
    
    if status:
        query = query.where(AssessmentApplication.status == status)
    
    query = query.order_by(desc(AssessmentApplication.applied_at))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    applications = result.scalars().all()
    
    return [
        AssessmentApplicationResponse(
            id=app.id,
            application_id=app.application_id,
            candidate_id=app.candidate_id,
            assessment_id=app.assessment_id,
            status=app.status,
            candidate_availability=app.candidate_availability,
            submitted_skills=app.submitted_skills,
            role_applied_for=app.role_applied_for,
            applied_at=app.applied_at,
            started_at=app.started_at,
            completed_at=app.completed_at,
            created_at=app.created_at,
            updated_at=app.updated_at,
        )
        for app in applications
    ]
