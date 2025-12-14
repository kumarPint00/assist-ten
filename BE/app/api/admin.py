"""Admin API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc
from datetime import datetime, timedelta

from app.db.session import get_db
from app.db.models import (
    User,
    TestSession,
    JobDescription,
    Question,
    AdminSettings,
    AssessmentApplication,
    Assessment,
    Candidate,
)
from app.core.dependencies import get_current_user
from app.core.security import check_admin

router = APIRouter()


# Response models
class StatsResponse(BaseModel):
    """System statistics."""
    total_users: int
    total_job_descriptions: int
    total_questions: int
    total_test_sessions: int
    completed_tests: int
    average_score: float


class DashboardActivityItem(BaseModel):
    """Recent admin dashboard activity entry."""
    application_id: str
    candidate_name: str
    candidate_email: str
    assessment_title: str
    job_title: str
    status: str
    score_percentage: float | None
    updated_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None


class AdminSettingsResponse(BaseModel):
    """Admin settings response."""
    settings: dict


@router.get("/admin/stats", response_model=StatsResponse)
async def get_system_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> StatsResponse:
    """Get system statistics (admin only)."""
    from app.core.security import check_superadmin
    # require superadmin to view system stats
    await check_superadmin(current_user)

    user_count = await db.execute(select(func.count(User.id)))
    total_users = user_count.scalar() or 0
    
    jd_count = await db.execute(select(func.count(JobDescription.id)))
    total_jds = jd_count.scalar() or 0
    
    q_count = await db.execute(select(func.count(Question.id)))
    total_questions = q_count.scalar() or 0
    
    ts_count = await db.execute(select(func.count(TestSession.id)))
    total_sessions = ts_count.scalar() or 0
    
    completed_count = await db.execute(
        select(func.count(TestSession.id)).where(TestSession.is_completed == True)
    )
    completed_tests = completed_count.scalar() or 0
    
    avg_score = await db.execute(
        select(func.avg(TestSession.score_percentage)).where(
            and_(
                TestSession.is_completed == True,
                TestSession.score_percentage.isnot(None)
            )
        )
    )
    average_score = avg_score.scalar() or 0.0
    
    return StatsResponse(
        total_users=total_users,
        total_job_descriptions=total_jds,
        total_questions=total_questions,
        total_test_sessions=total_sessions,
        completed_tests=completed_tests,
        average_score=float(average_score)
    )


@router.get("/admin/dashboard/activity", response_model=List[DashboardActivityItem])
async def get_admin_dashboard_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> List[DashboardActivityItem]:
    """Get the latest candidate/interview activity for the admin dashboard."""
    await check_admin(current_user)

    stmt = (
        select(AssessmentApplication, Candidate, Assessment, TestSession)
        .join(Candidate, AssessmentApplication.candidate)
        .join(Assessment, AssessmentApplication.assessment)
        .outerjoin(TestSession, AssessmentApplication.test_session_id == TestSession.session_id)
        .order_by(desc(AssessmentApplication.updated_at))
        .limit(15)
    )

    result = await db.execute(stmt)
    rows = result.all()

    activity: List[DashboardActivityItem] = []
    for application, candidate, assessment, session in rows:
        activity.append(DashboardActivityItem(
            application_id=application.application_id,
            candidate_name=candidate.full_name or candidate.email,
            candidate_email=candidate.email,
            assessment_title=assessment.title,
            job_title=assessment.job_title or assessment.title,
            status=application.status,
            score_percentage=session.score_percentage if session else None,
            updated_at=application.updated_at,
            started_at=session.started_at if session else None,
            completed_at=session.completed_at if session else None,
        ))

    return activity


@router.get("/admin/settings", response_model=AdminSettingsResponse)
async def get_admin_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> AdminSettingsResponse:
    """Get admin settings for the current user."""
    # Check if user has admin role
    await check_admin(current_user)
    
    # Get or create settings
    result = await db.execute(
        select(AdminSettings).where(AdminSettings.user_id == current_user.id)
    )
    admin_settings = result.scalar_one_or_none()
    
    if admin_settings:
        settings = admin_settings.settings
    else:
        # Default settings
        settings = {
            "notificationsEmail": True,
            "notificationsSms": False,
            "darkMode": False,
            "autoSaveInterval": "30",
            "useLLMDefault": True,
            "llmProvider": "groq",
            "llmApiKey": "",
        }
    
    return AdminSettingsResponse(settings=settings)


@router.put("/admin/settings", response_model=AdminSettingsResponse)
async def update_admin_settings(
    settings: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> AdminSettingsResponse:
    """Update admin settings for the current user."""
    await check_admin(current_user)
    
    # Get or create settings
    result = await db.execute(
        select(AdminSettings).where(AdminSettings.user_id == current_user.id)
    )
    admin_settings = result.scalar_one_or_none()
    
    if admin_settings:
        admin_settings.settings = settings
    else:
        admin_settings = AdminSettings(user_id=current_user.id, settings=settings)
        db.add(admin_settings)
    
    await db.commit()
    await db.refresh(admin_settings)
    
    return AdminSettingsResponse(settings=admin_settings.settings)


class AdminCreateRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: str = 'admin'


@router.post("/admin/users", status_code=201)
async def create_admin_user(
    req: AdminCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Create new admin user (superadmin only)."""
    # Only superadmin can create admin users
    if getattr(current_user, 'role', '') != 'superadmin':
        raise HTTPException(status_code=403, detail="Superadmin privileges required")

    # Create user if not exists
    result = await db.execute(select(User).where(User.email == req.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    user = User(
        email=req.email,
        full_name=req.full_name or req.email.split('@')[0].title(),
        is_active=True,
        is_verified=False,
        role=req.role,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return {"message": "Admin user created successfully", "user_id": user.id, "role": user.role}


@router.get('/admin/users', response_model=List[dict])
async def list_admin_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List admin users (superadmin only)."""
    if getattr(current_user, 'role', '') != 'superadmin':
        raise HTTPException(status_code=403, detail="Superadmin privileges required")
    result = await db.execute(select(User).where(User.role.in_(['admin','superadmin'])))
    users = result.scalars().all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role} for u in users]


class AdminRoleUpdateRequest(BaseModel):
    role: str = "admin"


@router.put('/admin/users/{user_id}/role')
async def update_user_role(
    user_id: int,
    req: AdminRoleUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role (superadmin only)."""
    if getattr(current_user, 'role', '') != 'superadmin':
        raise HTTPException(status_code=403, detail="Superadmin privileges required")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = req.role
    await db.commit()
    await db.refresh(user)
    return {"message": "User role updated", "user_id": user.id, "role": user.role}
