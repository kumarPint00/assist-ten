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
from app.db.models import ProctoringEvent
from app.models.schemas import ProctoringEventAdminResponse, ProctoringEventResponse
from app.db.models import JobRequisition, Notification
from app.models.schemas import ApplicationStatusUpdate, RequisitionStatusUpdate, BulkNotificationCreate
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


@router.get("/admin/requisitions", response_model=List[dict])
async def admin_list_requisitions(
    status: Optional[str] = None,
    is_published: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_admin(current_user)
    stmt = select(JobRequisition)
    if status:
        stmt = stmt.where(JobRequisition.status == status)
    if is_published is not None:
        stmt = stmt.where(JobRequisition.is_published == is_published)
    stmt = stmt.order_by(desc(JobRequisition.created_at)).limit(200)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [r.__dict__ for r in rows]


@router.patch("/admin/requisitions/{requisition_id}/status")
async def admin_update_requisition_status(
    requisition_id: str,
    payload: RequisitionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_admin(current_user)
    result = await db.execute(select(JobRequisition).where(JobRequisition.requisition_id == requisition_id))
    req = result.scalar_one_or_none()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")
    if payload.status:
        req.status = payload.status
    if payload.is_published is not None:
        req.is_published = payload.is_published
        req.published_at = datetime.utcnow() if payload.is_published else None
    await db.commit()
    return {"message": "Updated"}


@router.get("/admin/applications", response_model=List[dict])
async def admin_list_applications(status: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    await check_admin(current_user)
    stmt = select(AssessmentApplication)
    if status:
        stmt = stmt.where(AssessmentApplication.status == status)
    stmt = stmt.order_by(desc(AssessmentApplication.applied_at)).limit(200)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [r.__dict__ for r in rows]



@router.get("/admin/proctoring/events", response_model=List[ProctoringEventAdminResponse])
async def admin_list_proctoring_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-scoped listing of proctoring events, enriched with test session info."""
    await check_admin(current_user)
    # Join TestSession to provide context for admins
    from sqlalchemy import select, desc
    from app.db.models import TestSession

    stmt = select(ProctoringEvent, TestSession).outerjoin(TestSession, TestSession.session_id == ProctoringEvent.test_session_id).order_by(desc(ProctoringEvent.detected_at)).limit(200)
    result = await db.execute(stmt)
    rows = result.all()
    out = []
    for evt, session in rows:
        # Build response safely to avoid Pydantic validation errors if DB fields are unexpected
        try:
            base = ProctoringEventResponse.from_orm(evt).dict(by_alias=True)
        except Exception:
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
                "metadata": getattr(evt, 'event_metadata', {}) if isinstance(getattr(evt, 'event_metadata', {}), dict) else {},
                "reviewed": getattr(evt, 'reviewed', False),
                "reviewed_by": getattr(evt, 'reviewed_by', None),
                "reviewed_at": getattr(evt, 'reviewed_at', None),
                "reviewer_notes": getattr(evt, 'reviewer_notes', None),
                "flagged": getattr(evt, 'flagged', False),
                "created_at": getattr(evt, 'created_at', None),
            }

        base.update({
            "test_session_id": base.get('test_session_id') or evt.test_session_id,
            "test_session_candidate_name": getattr(session, 'candidate_name', None) if session else None,
            "test_session_candidate_email": getattr(session, 'candidate_email', None) if session else None,
            "test_session_job_title": getattr(session, 'job_title', None) if session else None,
            "test_session_score_percentage": getattr(session, 'score_percentage', None) if session else None,
        })
        out.append(base)
    return out


@router.patch("/admin/applications/{application_id}/status")
async def admin_update_application_status(
    application_id: str,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_admin(current_user)
    result = await db.execute(select(AssessmentApplication).where(AssessmentApplication.application_id == application_id))
    app_obj = result.scalar_one_or_none()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")
    app_obj.status = payload.status
    # Optionally add a note as ApplicationNote
    if payload.note:
        note = ApplicationNote(
            application_id=application_id,
            author_id=current_user.id,
            note_text=payload.note,
            note_type="admin",
            is_private=True,
        )
        db.add(note)
    await db.commit()
    return {"message": "Application updated"}


@router.post("/admin/notifications/bulk")
async def admin_bulk_notifications(
    payload: BulkNotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await check_admin(current_user)
    created = []
    if payload.user_ids:
        for uid in payload.user_ids:
            notif = Notification(
                user_id=uid,
                notification_type=payload.notification_type,
                title=payload.title,
                message=payload.message,
                priority=payload.priority,
            )
            db.add(notif)
            created.append(uid)
    elif payload.tenant_id:
        # Create a notification for all users in a tenant (simple implementation)
        users_stmt = select(User).where(User.role == "user")
        res = await db.execute(users_stmt)
        users = res.scalars().all()
        for u in users:
            notif = Notification(
                user_id=u.id,
                notification_type=payload.notification_type,
                title=payload.title,
                message=payload.message,
                priority=payload.priority,
            )
            db.add(notif)
            created.append(u.id)
    else:
        raise HTTPException(status_code=400, detail="Provide user_ids or tenant_id")

    await db.commit()
    return {"created_for": created}


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
