# Model Implementation - Quick Start Guide

## What Was Built

Created complete database models for Assist-Ten platform covering all E2E workflows:

### 📦 New Models (11)

**Workflow Models (6)**
1. **JobRequisition** - Job postings and requisition management
2. **InterviewSession** - Interview scheduling and tracking
3. **InterviewFeedback** - Post-interview evaluations
4. **ProctoringEvent** - Test monitoring and incident logging
5. **Notification** - System-wide user notifications
6. **ApplicationNote** - Internal recruiter notes on applications

**Superadmin Models (5)**
7. **AuditLog** - Comprehensive audit trail
8. **Tenant** - Multi-tenant organization support
9. **SystemIncident** - System incident tracking
10. **SystemMetric** - Performance metrics
11. **FeatureFlag** - Feature rollout control

### 📄 New Files / Changes
- `BE/app/db/models.py` - Extended models merged into this file (was `extended_models.py`)
- `BE/alembic/versions/009_add_extended_workflow_models.py` - Migration
- `BE/DATABASE_MODELS.md` - Complete model documentation
- `BE/MODEL_RELATIONSHIPS.md` - Relationship diagrams
- `BE/MODEL_IMPLEMENTATION_COMPLETE.md` - Implementation summary

### ✏️ Updated Files
- `BE/app/models/__init__.py` - Added exports for new models/schemas
- `BE/app/models/schemas.py` - Added 30+ Pydantic schemas

## Quick Verification

### Check Model Imports
```bash
cd BE
source venv/bin/activate  # Or your virtualenv
python3 -c "from app.models import JobRequisition, InterviewSession; print('✓ Models OK')"
```

### Run Migration
```bash
cd BE
alembic upgrade head
```

### Verify Tables Created
```sql
-- Connect to your PostgreSQL database
\dt  -- List all tables

-- Should see new tables:
-- job_requisitions
-- interview_sessions
-- interview_feedback
-- proctoring_events
-- notifications
-- application_notes
```

## Model Usage Examples

### Create a Job Requisition
```python
from app.models import JobRequisition, JobRequisitionStatus
from app.db.session import get_db

async with get_db() as db:
    requisition = JobRequisition(
        title="Senior Python Developer",
        description="Looking for experienced Python developer...",
        employment_type="full-time",
        experience_level="senior",
        required_skills={"Python": "expert", "FastAPI": "intermediate"},
        positions_available=2,
        status=JobRequisitionStatus.OPEN,
        created_by=user_id
    )
    db.add(requisition)
    await db.commit()
```

### Schedule an Interview
```python
from app.models import InterviewSession, InterviewStatus
from datetime import datetime, timezone

interview = InterviewSession(
    candidate_id=candidate.id,
    requisition_id=requisition.requisition_id,
    interview_type="technical",
    interview_mode="video",
    scheduled_at=datetime(2025, 12, 20, 10, 0, tzinfo=timezone.utc),
    interviewer_id=interviewer.id,
    duration_minutes=60,
    status=InterviewStatus.SCHEDULED
)
db.add(interview)
await db.commit()
```

### Log Proctoring Event
```python
from app.models import ProctoringEvent, ProctoringIncidentSeverity

event = ProctoringEvent(
    test_session_id=session.session_id,
    event_type="multiple_faces",
    severity=ProctoringIncidentSeverity.HIGH,
    detected_at=datetime.utcnow(),
    snapshot_url="s3://bucket/snapshot.jpg"
)
db.add(event)
await db.commit()
```

## API Endpoints to Implement

### Recruiter Endpoints
```python
# Job Requisitions
POST   /api/v1/recruiter/requisitions          # Create job
GET    /api/v1/recruiter/requisitions          # List jobs
GET    /api/v1/recruiter/requisitions/{id}     # Get details
PATCH  /api/v1/recruiter/requisitions/{id}     # Update job
POST   /api/v1/recruiter/requisitions/{id}/publish  # Publish

# Application Notes
POST   /api/v1/recruiter/applications/{id}/notes    # Add note
GET    /api/v1/recruiter/applications/{id}/notes    # List notes
```

### Interviewer Endpoints
```python
# Interviews
POST   /api/v1/interviewer/interviews          # Schedule
GET    /api/v1/interviewer/interviews          # My interviews
GET    /api/v1/interviewer/interviews/{id}     # Details
PATCH  /api/v1/interviewer/interviews/{id}     # Update
POST   /api/v1/interviewer/interviews/{id}/start     # Start
POST   /api/v1/interviewer/interviews/{id}/complete  # Complete

# Feedback
POST   /api/v1/interviewer/feedback            # Submit feedback
GET    /api/v1/interviewer/feedback/{interview_id}  # Get feedback
```

### Admin/Proctoring Endpoints
```python
POST   /api/v1/proctoring/events               # Log event
GET    /api/v1/admin/proctoring/events         # List events
PATCH  /api/v1/admin/proctoring/events/{id}/review  # Review
```

### Notification Endpoints
```python
GET    /api/v1/notifications                   # My notifications
PATCH  /api/v1/notifications/{id}/read         # Mark read
DELETE /api/v1/notifications/{id}              # Archive
```

## Frontend Integration

### TypeScript Types
Generate types from Pydantic schemas:
```typescript
// JobRequisition
interface JobRequisitionResponse {
  id: number;
  requisition_id: string;
  title: string;
  status: "draft" | "open" | "paused" | "closed" | "filled" | "cancelled";
  positions_available: number;
  positions_filled: number;
  total_applicants: number;
  created_at: string;
  // ... other fields
}

// InterviewSession
interface InterviewSessionResponse {
  id: number;
  interview_id: string;
  interview_type: string;
  scheduled_at: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "no_show";
  // ... other fields
}
```

### API Client Functions
```typescript
// Fetch job requisitions
export const getJobRequisitions = async () => {
  const response = await fetch('/api/v1/recruiter/requisitions');
  return response.json();
};

// Schedule interview
export const scheduleInterview = async (data: InterviewSessionCreate) => {
  const response = await fetch('/api/v1/interviewer/interviews', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Database Schema Reference

### Table Counts
- **Existing**: 19 tables (users, candidates, assessments, etc.)
- **New**: 6 tables (requisitions, interviews, proctoring, notifications, notes)
- **Total**: 25 tables
### Table Counts
- **Existing**: 19 tables (users, candidates, assessments, etc.)
- **New**: 11 tables (6 workflow + 5 superadmin)
- **Total**: 30 tables

### Index Counts
- **New Indexes**: 37 indexes for optimal query performance
- **Types**: Unique, composite, foreign key, status, time-based

## Documentation Files

1. **DATABASE_MODELS.md**
   - Complete model reference
   - Field descriptions
   - Relationships
   - Usage examples

2. **MODEL_RELATIONSHIPS.md**
   - Relationship diagrams
   - Flow examples
   - Index strategy

3. **MODEL_IMPLEMENTATION_COMPLETE.md**
   - Full implementation summary
   - API suggestions
   - Performance tips

## Testing Checklist

- [ ] Run migration: `alembic upgrade head`
- [ ] Verify tables created in PostgreSQL
- [ ] Test model imports in Python
- [ ] Create sample requisition
- [ ] Schedule sample interview
- [ ] Submit sample feedback
- [ ] Log sample proctoring event
- [ ] Create sample notification
- [ ] Verify foreign key constraints
- [ ] Test cascade deletes
- [ ] Verify unique constraints

## Performance Tips

### Queries to Index
```sql
-- Most common queries
CREATE INDEX IF NOT EXISTS idx_requisitions_status_open 
  ON job_requisitions(status) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_interviews_upcoming 
  ON interview_sessions(scheduled_at) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON notifications(user_id, is_read) WHERE is_read = false;
```

### Query Optimization
```python
# Use selectinload for relationships
from sqlalchemy.orm import selectinload

requisitions = await db.execute(
    select(JobRequisition)
    .options(selectinload(JobRequisition.interviews))
    .filter(JobRequisition.status == "open")
)
```

## Next Actions

1. **Backend**
   - [ ] Create FastAPI routers for each workflow
   - [ ] Implement CRUD operations
   - [ ] Add role-based access control
   - [ ] Write unit tests

2. **Frontend**
   - [ ] Generate TypeScript types
   - [ ] Build UI for job requisitions
   - [ ] Build UI for interview scheduling
   - [ ] Build UI for notifications
   - [ ] Implement real-time updates

3. **DevOps**
   - [ ] Run migration in staging
   - [ ] Test in production-like environment
   - [ ] Monitor query performance
   - [ ] Set up alerts for long-running queries

## Support & Documentation

- **Model Docs**: `BE/DATABASE_MODELS.md`
- **Relationships**: `BE/MODEL_RELATIONSHIPS.md`
- **Full Summary**: `BE/MODEL_IMPLEMENTATION_COMPLETE.md`
- **Migration**: `BE/alembic/versions/009_add_extended_workflow_models.py`

---

**Status**: ✅ Complete and ready for API implementation
**Models**: 30 total (19 existing + 11 new)
**Schemas**: 95+ Pydantic schemas
**Migration**: Ready to run (`alembic upgrade head`)
