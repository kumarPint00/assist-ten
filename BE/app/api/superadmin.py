"""Superadmin endpoints for audit logs, tenants, incidents, metrics, and feature flags."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime

from app.db.session import get_db
from app.db.models import AuditLog, Tenant, SystemIncident, SystemMetric, FeatureFlag, Candidate
from app.db.models import InterviewSession
from app.models.schemas import (
    AuditLogCreate, AuditLogResponse,
    TenantCreate, TenantUpdate, TenantResponse,
    SystemIncidentCreate, SystemIncidentUpdate, SystemIncidentResponse,
    SystemMetricCreate, SystemMetricResponse,
    FeatureFlagCreate, FeatureFlagUpdate, FeatureFlagResponse,
    InterviewSessionResponse,
)
from app.core.dependencies import get_current_user
from app.core.security import check_superadmin

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


@router.post("/audit-logs", response_model=AuditLogResponse, status_code=201)
async def create_audit_log(payload: AuditLogCreate, db: AsyncSession = Depends(get_db)) -> AuditLogResponse:
    log = AuditLog(
        user_id=None,
        user_email=None,
        user_role=None,
        action=payload.action,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        description=payload.description,
        changes=payload.changes,
        severity=payload.severity,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return AuditLogResponse.from_orm(log)


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def list_audit_logs(limit: int = Query(100, le=1000), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_superadmin(current_user)
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    return [AuditLogResponse.from_orm(l) for l in logs]


@router.get("/audit-logs/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(log_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await check_superadmin(current_user)
    result = await db.execute(select(AuditLog).where(AuditLog.log_id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found")
    return AuditLogResponse.from_orm(log)


@router.post("/tenants", response_model=TenantResponse, status_code=201)
async def create_tenant(payload: TenantCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> TenantResponse:
    await check_superadmin(current_user)
    tenant = Tenant(
        name=payload.name,
        domain=payload.domain,
        settings=payload.settings,
        features_enabled=payload.features_enabled,
        max_users=payload.max_users,
        max_assessments=payload.max_assessments,
        max_candidates=payload.max_candidates,
        subscription_tier=payload.subscription_tier,
        owner_id=payload.owner_id,
    )
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    return TenantResponse.from_orm(tenant)


@router.get("/tenants", response_model=List[TenantResponse])
async def list_tenants(limit: int = Query(100, le=1000), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_superadmin(current_user)
    stmt = select(Tenant).order_by(desc(Tenant.created_at)).limit(limit)
    result = await db.execute(stmt)
    tenants = result.scalars().all()
    return [TenantResponse.from_orm(t) for t in tenants]


@router.get("/tenants/{tenant_id}", response_model=TenantResponse)
async def get_tenant(tenant_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> TenantResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(Tenant).where(Tenant.tenant_id == tenant_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return TenantResponse.from_orm(t)


@router.delete("/tenants/{tenant_id}")
async def delete_tenant(tenant_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await check_superadmin(current_user)
    result = await db.execute(select(Tenant).where(Tenant.tenant_id == tenant_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    # Soft-delete: deactivate tenant
    t.is_active = False
    await db.commit()
    return {"message": "Tenant deactivated"}


@router.patch("/tenants/{tenant_id}", response_model=TenantResponse)
async def update_tenant(tenant_id: str, payload: TenantUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> TenantResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(Tenant).where(Tenant.tenant_id == tenant_id))
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=404, detail="Tenant not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return TenantResponse.from_orm(t)


@router.post("/incidents", response_model=SystemIncidentResponse, status_code=201)
async def create_incident(payload: SystemIncidentCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SystemIncidentResponse:
    await check_superadmin(current_user)
    inc = SystemIncident(
        title=payload.title,
        description=payload.description,
        incident_type=payload.incident_type,
        severity=payload.severity,
        affected_users=payload.affected_users,
        affected_tenants=payload.affected_tenants,
        affected_services=payload.affected_services,
        detected_at=payload.detected_at,
        assigned_to=payload.assigned_to,
    )
    db.add(inc)
    await db.commit()
    await db.refresh(inc)
    return SystemIncidentResponse.from_orm(inc)


@router.get("/incidents", response_model=List[SystemIncidentResponse])
async def list_incidents(limit: int = Query(100, le=1000), status: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_superadmin(current_user)
    stmt = select(SystemIncident)
    if status:
        stmt = stmt.where(SystemIncident.status == status)
    stmt = stmt.order_by(desc(SystemIncident.detected_at)).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [SystemIncidentResponse.from_orm(r) for r in rows]


@router.get("/interviews", response_model=List[InterviewSessionResponse])
async def list_interviews(limit: int = Query(100, le=1000), status: Optional[str] = None, interview_type: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    """List interviews across the system (superadmin view)."""
    await check_superadmin(current_user)
    stmt = select(InterviewSession)
    if status:
        stmt = stmt.where(InterviewSession.status == status)
    if interview_type:
        stmt = stmt.where(InterviewSession.interview_type == interview_type)
    stmt = stmt.order_by(desc(InterviewSession.scheduled_at)).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    out = []
    for r in rows:
        dto = InterviewSessionResponse.from_orm(r).model_dump()
        # enrich with candidate name when possible
        cand = None
        try:
            cres = await db.execute(select(Candidate).where(Candidate.id == r.candidate_id))
            cand = cres.scalar_one_or_none()
        except Exception:
            cand = None
        if cand:
            dto["candidate_name"] = cand.full_name
        out.append(dto)
    return out


@router.get("/interviews/{interview_id}", response_model=InterviewSessionResponse)
async def get_interview(interview_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> InterviewSessionResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(InterviewSession).where(InterviewSession.interview_id == interview_id))
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=404, detail="Interview not found")
    return InterviewSessionResponse.from_orm(r)


@router.get("/incidents/{incident_id}", response_model=SystemIncidentResponse)
async def get_incident(incident_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SystemIncidentResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(SystemIncident).where(SystemIncident.incident_id == incident_id))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    return SystemIncidentResponse.from_orm(inc)


@router.patch("/incidents/{incident_id}", response_model=SystemIncidentResponse)
async def update_incident(incident_id: str, payload: SystemIncidentUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SystemIncidentResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(SystemIncident).where(SystemIncident.incident_id == incident_id))
    inc = result.scalar_one_or_none()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(inc, k, v)
    await db.commit()
    await db.refresh(inc)
    return SystemIncidentResponse.from_orm(inc)


@router.post("/metrics", response_model=SystemMetricResponse, status_code=201)
async def record_metric(payload: SystemMetricCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SystemMetricResponse:
    await check_superadmin(current_user)
    metric = SystemMetric(
        metric_name=payload.metric_name,
        metric_type=payload.metric_type,
        value=payload.value,
        unit=payload.unit,
        service=payload.service,
        tenant_id=payload.tenant_id,
        measured_at=payload.measured_at,
        tags=payload.tags,
    )
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return SystemMetricResponse.from_orm(metric)


@router.get("/metrics", response_model=List[SystemMetricResponse])
async def list_metrics(limit: int = Query(200, le=2000), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_superadmin(current_user)
    stmt = select(SystemMetric).order_by(desc(SystemMetric.measured_at)).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [SystemMetricResponse.from_orm(r) for r in rows]


@router.get("/metrics/{metric_id}", response_model=SystemMetricResponse)
async def get_metric(metric_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> SystemMetricResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(SystemMetric).where(SystemMetric.metric_id == metric_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Metric not found")
    return SystemMetricResponse.from_orm(m)


@router.post("/flags", response_model=FeatureFlagResponse, status_code=201)
async def create_flag(payload: FeatureFlagCreate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> FeatureFlagResponse:
    await check_superadmin(current_user)
    flag = FeatureFlag(
        name=payload.name,
        description=payload.description,
        is_enabled=payload.is_enabled,
        rollout_percentage=payload.rollout_percentage,
        allowed_tenants=payload.allowed_tenants,
        allowed_users=payload.allowed_users,
        config=payload.config,
        created_by=current_user.id,
    )
    db.add(flag)
    await db.commit()
    await db.refresh(flag)
    return FeatureFlagResponse.from_orm(flag)


@router.patch("/flags/{flag_id}", response_model=FeatureFlagResponse)
async def update_flag(flag_id: str, payload: FeatureFlagUpdate, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> FeatureFlagResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.flag_id == flag_id))
    flag = result.scalar_one_or_none()
    if not flag:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(flag, k, v)
    await db.commit()
    await db.refresh(flag)
    return FeatureFlagResponse.from_orm(flag)


@router.get("/flags", response_model=List[FeatureFlagResponse])
async def list_flags(limit: int = Query(200, le=2000), db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    await check_superadmin(current_user)
    stmt = select(FeatureFlag).order_by(desc(FeatureFlag.created_at)).limit(limit)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [FeatureFlagResponse.from_orm(r) for r in rows]


@router.get("/flags/{flag_id}", response_model=FeatureFlagResponse)
async def get_flag(flag_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> FeatureFlagResponse:
    await check_superadmin(current_user)
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.flag_id == flag_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    return FeatureFlagResponse.from_orm(f)


@router.delete("/flags/{flag_id}")
async def delete_flag(flag_id: str, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await check_superadmin(current_user)
    result = await db.execute(select(FeatureFlag).where(FeatureFlag.flag_id == flag_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="Feature flag not found")
    # Soft delete: disable
    f.is_enabled = False
    await db.commit()
    return {"message": "Feature flag disabled"}
