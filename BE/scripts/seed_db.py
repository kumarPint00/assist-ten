"""Seed database with a default superadmin and optional admin users.

This script is meant for development use only. It will create a `superadmin` user
if it doesn't already exist, and optionally create admin users listed in
`settings.ADMIN_EMAILS`.

Usage:
  python scripts/seed_db.py --email superadmin@assist10.com --full-name "Super Admin" --create-admins

By default it reads `SUPERADMIN_EMAIL` and `SUPERADMIN_NAME` from env vars and will
create admin users listed in `settings.ADMIN_EMAILS` when `--create-admins` is passed.
"""
import asyncio
import os
import sys
from pathlib import Path
import argparse

# Ensure project root is on path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from config import get_settings
from app.db.session import async_session_maker
from app.db.models import User
from sqlalchemy import select, desc
from app.db.models import Tenant, SystemIncident, SystemMetric, FeatureFlag, Candidate, InterviewSession, Assessment, AssessmentApplication, JobRequisition, TestSession, ProctoringEvent
from datetime import datetime, timedelta
import uuid
from sqlalchemy import insert

settings = get_settings()


async def _create_user_if_not_exists(session, email: str, full_name: str | None, role: str = "admin"):
    result = await session.execute(select(User).where(User.email == email))
    existing = result.scalar_one_or_none()
    if existing:
        print(f"User {email} already exists (role={existing.role})")
        return existing

    user = User(
        email=email,
        full_name=full_name or email.split("@")[0].title(),
        is_active=True,
        is_verified=True,
        role=role,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    print(f"Created user {email} (role={role}, id={user.id})")
    return user


async def main():
    parser = argparse.ArgumentParser(description="Seed DB with superadmin and admin users")
    parser.add_argument("--email", type=str, help="Superadmin email or use SUPERADMIN_EMAIL env var")
    parser.add_argument("--full-name", type=str, help="Superadmin full name or use SUPERADMIN_NAME env var")
    parser.add_argument("--create-admins", action="store_true", help="Create admin users from settings.ADMIN_EMAILS")
    parser.add_argument("--with-tenants", action="store_true", help="Create sample tenants")
    parser.add_argument("--with-incidents", action="store_true", help="Create sample system incidents")
    parser.add_argument("--with-metrics", action="store_true", help="Create sample system metrics")
    parser.add_argument("--with-flags", action="store_true", help="Create sample feature flags")
    parser.add_argument("--with-candidates", action="store_true", help="Create sample candidates")
    parser.add_argument("--with-interviews", action="store_true", help="Create sample interview sessions (requires candidates and users)")
    parser.add_argument("--with-assessments", action="store_true", help="Create sample assessments and applications")
    parser.add_argument("--with-requisitions", action="store_true", help="Create sample job requisitions")
    parser.add_argument("--with-proctoring", action="store_true", help="Create sample proctoring events")

    args = parser.parse_args()

    email = args.email or os.environ.get("SUPERADMIN_EMAIL") or "superadmin@assist10.com"
    full_name = args.full_name or os.environ.get("SUPERADMIN_NAME") or "Super Admin"
    create_admins = args.create_admins or False

    print("Connecting to DB to seed data...")

    async with async_session_maker() as session:
        await _create_user_if_not_exists(session, email, full_name, role="superadmin")

        if create_admins:
            print("Creating admin users from settings.ADMIN_EMAILS...")
            for admin_email in settings.ADMIN_EMAILS:
                if not admin_email:
                    continue
                await _create_user_if_not_exists(session, admin_email, None, role="admin")

        # Optional richer data
        # Optional richer data (wrap in try/except to handle missing migrations)
        if args.with_tenants:
            try:
                print("Creating sample tenants...")
                await _create_sample_tenants(session)
            except Exception as e:
                await session.rollback()
                print("Could not create tenants — check migrations: ", e)

        if args.with_flags:
            try:
                print("Creating sample feature flags...")
                await _create_sample_flags(session, email)
            except Exception as e:
                await session.rollback()
                print("Could not create feature flags — check migrations: ", e)

        if args.with_metrics:
            try:
                print("Creating sample metrics...")
                await _create_sample_metrics(session)
            except Exception as e:
                await session.rollback()
                print("Could not create metrics — check migrations: ", e)

        if args.with_incidents:
            try:
                print("Creating sample incidents...")
                await _create_sample_incidents(session, email)
            except Exception as e:
                await session.rollback()
                print("Could not create incidents — check migrations: ", e)

        if args.with_candidates:
            try:
                print("Creating sample candidates...")
                await _create_sample_candidates(session)
            except Exception as e:
                await session.rollback()
                print("Could not create candidates — check migrations: ", e)

        if args.with_interviews:
            try:
                print("Creating sample interviews...")
                await _create_sample_interviews(session)
            except Exception as e:
                await session.rollback()
                print("Could not create interviews — check migrations: ", e)

        if args.with_assessments:
            try:
                print("Creating sample assessments and applications...")
                await _create_sample_assessments_and_applications(session)
            except Exception as e:
                await session.rollback()
                print("Could not create assessments/applications — check migrations: ", e)

        if args.with_requisitions:
            try:
                print("Creating sample requisitions...")
                await _create_sample_requisitions(session)
            except Exception as e:
                await session.rollback()
                print("Could not create requisitions — check migrations: ", e)

        if args.with_proctoring:
            try:
                print("Creating sample proctoring events...")
                await _create_sample_proctoring_events(session)
            except Exception as e:
                await session.rollback()
                print("Could not create proctoring events — check migrations: ", e)

    print("Seeding complete.")


async def _create_sample_tenants(session):
    # create a couple of sample tenants if missing
    tnames = ["Acme Corp", "North Star Labs"]
    for name in tnames:
        result = await session.execute(select(Tenant).where(Tenant.name == name))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Tenant {name} already exists")
            continue
        tenant = Tenant(name=name, domain=(name.lower().replace(' ', '') + '.example.com'), subscription_tier='pro', is_trial=False, max_users=100)
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant)
        print(f"Created tenant {tenant.name} ({tenant.tenant_id})")


async def _create_sample_flags(session, creator_email):
    # create a few feature flags
    creator = await _get_user_by_email(session, creator_email)
    flags = [
        {"name": "new-dashboard", "description": "Enable new superadmin dashboard", "is_enabled": True},
        {"name": "ai-enhanced-review", "description": "Enable AI automatic review", "is_enabled": False},
    ]
    for f in flags:
        result = await session.execute(select(FeatureFlag).where(FeatureFlag.name == f["name"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"FeatureFlag {f['name']} already exists")
            continue
        ff = FeatureFlag(name=f["name"], description=f["description"], is_enabled=f["is_enabled"], created_by=(creator.id if creator else None))
        session.add(ff)
        await session.commit()
        await session.refresh(ff)
        print(f"Created feature flag {ff.name}")


async def _create_sample_metrics(session):
    now = datetime.utcnow()
    metrics = [
        {"metric_name": "llm_latency", "metric_type": "gauge", "value": 230.0, "unit": "ms", "service": "llm"},
        {"metric_name": "queue_depth", "metric_type": "gauge", "value": 12, "unit": "count", "service": "celery"},
    ]
    for m in metrics:
        metric = SystemMetric(metric_name=m["metric_name"], metric_type=m["metric_type"], value=m["value"], unit=m["unit"], service=m["service"], measured_at=now)
        session.add(metric)
    await session.commit()
    print("Inserted sample metrics")


async def _create_sample_incidents(session, reporter_email):
    reporter = await _get_user_by_email(session, reporter_email)
    now = datetime.utcnow()
    incidents = [
        {"title": "LLM timeout on skill extraction", "description": "Observed repeated timeouts when calling LLM", "incident_type": "performance", "severity": "critical", "detected_at": now},
        {"title": "Proctoring camera disconnects", "description": "Multiple camera disconnects observed in candidate sessions", "incident_type": "outage", "severity": "warning", "detected_at": now - timedelta(hours=2)},
    ]
    for inc in incidents:
        result = await session.execute(select(SystemIncident).where(SystemIncident.title == inc["title"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Incident '{inc['title']}' already exists")
            continue
        i = SystemIncident(title=inc["title"], description=inc["description"], incident_type=inc["incident_type"], severity=inc["severity"], detected_at=inc["detected_at"], reported_by=(reporter.id if reporter else None))
        session.add(i)
        await session.commit()
        await session.refresh(i)
        print(f"Created incident {i.incident_id}: {i.title}")


async def _create_sample_candidates(session):
    sample = [
        {"full_name": "Nisha Rao", "email": "nisha@example.com", "experience_level": "senior"},
        {"full_name": "Sanjay M.", "email": "sanjay@example.com", "experience_level": "mid"},
        {"full_name": "Aria James", "email": "aria@example.com", "experience_level": "junior"},
    ]
    for c in sample:
        result = await session.execute(select(Candidate).where(Candidate.email == c["email"]))
        existing = result.scalar_one_or_none()
        if existing:
            print(f"Candidate {c['email']} already exists")
            continue
        cand = Candidate(full_name=c["full_name"], email=c["email"], experience_level=c["experience_level"], skills={}, availability_percentage=100)
        session.add(cand)
        await session.commit()
        await session.refresh(cand)
        print(f"Created candidate {cand.full_name} ({cand.candidate_id})")


async def _create_sample_interviews(session):
    # Requires at least one candidate and one user
    res = await session.execute(select(Candidate).limit(1))
    candidate = res.scalar_one_or_none()
    if not candidate:
        print("No candidate found; create candidates first (--with-candidates)")
        return
    # pick an interviewer user (any existing user)
    res = await session.execute(select(User).limit(1))
    interviewer = res.scalar_one_or_none()
    if not interviewer:
        print("No users found; create users first")
        return
    now = datetime.utcnow()
    sessions = [
        {"interview_type": "technical", "interview_mode": "video", "scheduled_at": now + timedelta(days=1), "candidate_id": candidate.id, "interviewer_id": interviewer.id, "preparation_notes": "Technical interview focused on architecture"},
        {"interview_type": "human", "interview_mode": "video", "scheduled_at": now - timedelta(days=2), "candidate_id": candidate.id, "interviewer_id": interviewer.id, "preparation_notes": "Customer success role"},
    ]
    for s in sessions:
        isession = InterviewSession(interview_type=s["interview_type"], interview_mode=s["interview_mode"], scheduled_at=s["scheduled_at"], candidate_id=s["candidate_id"], interviewer_id=s["interviewer_id"], preparation_notes=s["preparation_notes"], duration_minutes=60)
        session.add(isession)
        await session.commit()
        await session.refresh(isession)
        print(f"Created interview {isession.interview_id} for candidate {candidate.email}")


async def _create_sample_proctoring_events(session):
    # find some recent test sessions
    res = await session.execute(select(TestSession).order_by(desc(TestSession.started_at)).limit(5))
    sessions = res.scalars().all()
    if not sessions:
        print("No test sessions found; create test sessions first")
        return
    events = [
        {"event_type": "camera_disconnect", "severity": "high", "flagged": True},
        {"event_type": "multiple_faces", "severity": "medium", "flagged": True},
        {"event_type": "tab_switch", "severity": "low", "flagged": False},
    ]
    for i, ts in enumerate(sessions):
        e = events[i % len(events)]
        pe = ProctoringEvent(test_session_id=ts.session_id, event_type=e["event_type"], severity=e["severity"], detected_at=datetime.utcnow() - timedelta(minutes=i*10), duration_seconds=30, event_metadata={"note":"Synthetic seed event"}, flagged=e["flagged"])
        session.add(pe)
    # Ensure at least one high-severity flagged event exists for demo purposes
    if not any((e.flagged for e in await _fetch_all_proctoring_events(session))):
        high = ProctoringEvent(test_session_id=sessions[0].session_id, event_type='camera_disconnect', severity='high', detected_at=datetime.utcnow(), duration_seconds=45, event_metadata={'note':'Seeded high severity event'}, flagged=True)
        session.add(high)
    await session.commit()
    print("Inserted sample proctoring events")

async def _fetch_all_proctoring_events(session):
    result = await session.execute(select(ProctoringEvent))
    return result.scalars().all()


async def _create_sample_assessments_and_applications(session):
    # Create a couple of assessments and link sample candidates
    res = await session.execute(select(Candidate).limit(5))
    candidates = res.scalars().all()
    if not candidates:
        print("No candidates available; create candidates first")
        return
    # Create assessments
    assessments = [
        {"title": "Backend Engineer Test", "job_title": "Backend Engineer", "description": "Server-side test", "assessment_method": "questionnaire", "required_skills": {"Python": "expert", "SQL": "advanced"}},
        {"title": "Product Designer Test", "job_title": "Product Designer", "description": "Design evaluation", "assessment_method": "questionnaire", "required_skills": {"Design": "expert", "Figma": "advanced"}},
    ]
    created = []
    for a in assessments:
        ass = Assessment(title=a["title"], description=a["description"], job_title=a["job_title"], assessment_method=a["assessment_method"], required_skills=a["required_skills"], created_by=None, is_published=True, is_active=True)
        session.add(ass)
        await session.commit()
        await session.refresh(ass)
        created.append(ass)
        print(f"Created assessment {ass.title} ({ass.assessment_id})")

    # Create applications for first few candidates
    for i, cand in enumerate(candidates[:4]):
        ass = created[i % len(created)]
        app = AssessmentApplication(candidate_id=cand.id, assessment_id=ass.id, status="completed" if i % 2 == 0 else "pending", applied_at=datetime.utcnow(), candidate_availability=100, submitted_skills=cand.skills or {}, role_applied_for=ass.job_title)
        session.add(app)
        await session.commit()
        await session.refresh(app)
        print(f"Created application {app.application_id} for candidate {cand.email} to assessment {ass.title}")

        # Create a test session for some applications to provide demo scores
        if app.status == "completed":
            ts = TestSession(session_id=f"ts_{uuid.uuid4().hex[:12]}", candidate_name=cand.full_name, candidate_email=cand.email, score_percentage=70 + (i * 5), is_completed=True, started_at=datetime.utcnow() - timedelta(hours=2), completed_at=datetime.utcnow() - timedelta(hours=1))
            session.add(ts)
            await session.commit()
            await session.refresh(ts)
            # Link to application
            app.test_session_id = ts.session_id
            await session.commit()


async def _create_sample_requisitions(session):
    # Create sample job requisitions
    sample_reqs = [
        {"title": "Backend Engineer", "description": "Build scalable services", "department": "Engineering", "location": "Remote", "employment_type": "Full-time", "experience_level": "mid"},
        {"title": "Product Designer", "description": "Design delightful experiences", "department": "Design", "location": "Remote", "employment_type": "Full-time", "experience_level": "senior"},
    ]
    # pick a creator user (admin if available)
    admin_res = await session.execute(select(User).where(User.role == 'admin').limit(1))
    admin_user = admin_res.scalar_one_or_none()
    creator_id = admin_user.id if admin_user else None
    for r in sample_reqs:
        req = JobRequisition(title=r["title"], description=r["description"], department=r["department"], location=r["location"], employment_type=r["employment_type"], experience_level=r["experience_level"], created_by=creator_id)
        session.add(req)
        await session.commit()
        await session.refresh(req)
        print(f"Created requisition {req.requisition_id} - {req.title}")


async def _get_user_by_email(session, email: str):
    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


if __name__ == "__main__":
    asyncio.run(main())
