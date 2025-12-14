# Assist-Ten Database Models - Complete Index

## 📚 Documentation Overview

This directory contains comprehensive documentation for all database models in the Assist-Ten platform.

---

## 📖 Quick Navigation

### Getting Started
- **[MODELS_QUICK_START.md](./MODELS_QUICK_START.md)** ⭐ START HERE
  - Quick setup guide
  - Usage examples
  - Testing checklist
  - Next steps

### Complete Reference
  - **[DATABASE_MODELS.md](./DATABASE_MODELS.md)**
  - All 30 models documented
  - Field descriptions
  - Relationships
  - Migration history
  - Enums reference

### Visual Guide
- **[MODEL_RELATIONSHIPS.md](./MODEL_RELATIONSHIPS.md)**
  - ASCII relationship diagrams
  - Flow examples (recruiter, interviewer, candidate)
  - Index strategy
  - Data integrity rules

### Implementation Details
- **[MODEL_IMPLEMENTATION_COMPLETE.md](./MODEL_IMPLEMENTATION_COMPLETE.md)**
  - Full implementation summary
  - API endpoint suggestions
  - Performance considerations
  - Security notes

---

## 🗂️ Model Categories

### Core Authentication (2 models)
- User
- RefreshToken

### Assessment System (7 models)
- JobDescription
- QuestionSet
- Question
- TestSession
- Answer
- CeleryTask
- AssessmentToken

### Candidate Management (3 models)
- Candidate
- Assessment
- AssessmentApplication

### Recruiter Workflow (2 models)
- JobRequisition ⭐ NEW
- ApplicationNote ⭐ NEW

### Interviewer Workflow (2 models)
- InterviewSession ⭐ NEW
- InterviewFeedback ⭐ NEW

### Monitoring & System (4 models)
- ProctoringEvent ⭐ NEW
- Notification ⭐ NEW
- UploadedDocument
- ExtractionLog

### Master Data (3 models)
- Skill
- Role
- AdminSettings

### Audit (2 models)
- SkillMatch
- ExtractionLog

### Superadmin (5 models)
- AuditLog ⭐ NEW
- Tenant ⭐ NEW
- SystemIncident ⭐ NEW
- SystemMetric ⭐ NEW
- FeatureFlag ⭐ NEW

**Total: 30 Models** (11 new in this update)

---

## 🚀 Quick Start Commands

### Run Migration
```bash
cd BE
alembic upgrade head
```

### Verify Models
```bash
cd BE
source venv/bin/activate
python3 -c "from app.models import JobRequisition, InterviewSession; print('✓ OK')"
```

### Check Database
```sql
\dt  -- List all tables
SELECT COUNT(*) FROM job_requisitions;
SELECT COUNT(*) FROM interview_sessions;
```

---

## 📊 Model Statistics

### Tables
- **Existing**: 19 tables
- **New**: 11 tables (6 workflow + 5 superadmin)
- **Total**: 30 tables

### Indexes
- **New**: 72 indexes added (37 workflow + 35 superadmin)
- **Focus**: Status filters, time-based queries, foreign keys, audit trails

### Schemas (Pydantic)
- **Create**: 35+ request schemas
- **Update**: 20+ partial update schemas
- **Response**: 40+ response schemas
- **Total**: 95+ schemas

---

## 🔄 Model Relationships

### Key Flows

#### Recruiter Flow
```
JobRequisition → Assessment → AssessmentApplication → InterviewSession → InterviewFeedback
                                      ↓
                                 TestSession → ProctoringEvent
```

#### Interviewer Flow
```
InterviewSession (assigned) → InterviewSession (in progress) → InterviewFeedback (submitted)
                                                                         ↓
                                                                  Notification (sent)
```

#### Candidate Flow
```
AssessmentToken → AssessmentApplication → TestSession → Answer
                                                 ↓
                                          ProctoringEvent
```

---

## 📁 File Structure

```
BE/
├── app/
│   ├── db/
│   │   ├── models.py              # Core 19 models
│   │   └── extended_models.py     # Removed - models merged into `models.py` ⭐
│   ├── models/
│   │   ├── __init__.py            # Centralized exports ⭐
│   │   └── schemas.py             # 95+ Pydantic schemas ⭐
├── alembic/
│   └── versions/
│       └── 009_add_extended_workflow_models.py  # New migration ⭐
├── DATABASE_MODELS.md             # Complete reference ⭐
├── MODEL_RELATIONSHIPS.md         # Diagrams & flows ⭐
├── MODEL_IMPLEMENTATION_COMPLETE.md  # Full summary ⭐
├── MODELS_QUICK_START.md          # Quick start guide ⭐
└── MODELS_INDEX.md                # This file ⭐
```

---

## 🎯 Use Cases by Role

### For Backend Developers
1. Read **MODELS_QUICK_START.md** for setup
2. Reference **DATABASE_MODELS.md** for field details
3. Check **MODEL_RELATIONSHIPS.md** for joins
4. Implement endpoints from **MODEL_IMPLEMENTATION_COMPLETE.md**

### For Frontend Developers
1. Review **DATABASE_MODELS.md** for data structure
2. Use Pydantic schemas from `app/models/schemas.py` to generate TypeScript types
3. Follow API endpoint suggestions in **MODEL_IMPLEMENTATION_COMPLETE.md**

### For DevOps
1. Run migration: `alembic upgrade head`
2. Monitor indexes from **MODEL_RELATIONSHIPS.md**
3. Check performance tips in **MODEL_IMPLEMENTATION_COMPLETE.md**

### For Product/QA
1. Understand flows in **MODEL_RELATIONSHIPS.md**
2. Review model purposes in **DATABASE_MODELS.md**
3. Test workflows from **MODELS_QUICK_START.md** checklist

---

## 🔍 Finding Specific Information

### "How do I create a job requisition?"
→ **MODELS_QUICK_START.md** (Usage Examples section)

### "What fields does InterviewSession have?"
→ **DATABASE_MODELS.md** (InterviewSession section)

### "How are interviews linked to candidates?"
→ **MODEL_RELATIONSHIPS.md** (Relationships diagram)

### "What indexes should I add?"
→ **MODEL_RELATIONSHIPS.md** (Indexes & Performance section)

### "What API endpoints do I need?"
→ **MODEL_IMPLEMENTATION_COMPLETE.md** (API Endpoint Suggestions section)

### "What's the migration history?"
→ **DATABASE_MODELS.md** (Migration History section)

---

## 🛠️ Development Workflow

1. **Planning Phase**
   - Review **MODEL_RELATIONSHIPS.md** for data flows
   - Check **DATABASE_MODELS.md** for existing models

2. **Implementation Phase**
   - Use **MODELS_QUICK_START.md** for code examples
   - Reference **app/models/schemas.py** for request/response schemas

3. **Testing Phase**
   - Follow checklist in **MODELS_QUICK_START.md**
   - Verify relationships from **MODEL_RELATIONSHIPS.md**

4. **Deployment Phase**
   - Run migration from **MODELS_QUICK_START.md**
   - Monitor performance using tips from **MODEL_IMPLEMENTATION_COMPLETE.md**

---

## 📝 Schema Generation

### Generate TypeScript Types
```bash
# From Pydantic schemas
cd BE
python3 scripts/generate_typescript_types.py
```

### Generate GraphQL Schema
```bash
# If using GraphQL
python3 scripts/generate_graphql_schema.py
```

---

## 🔐 Security Considerations

### Sensitive Fields
- `AssessmentToken.token` - Hash before storage
- `Candidate.email` - PII, encrypt at rest
- `UploadedDocument.s3_key` - Generate signed URLs with expiration

### Access Control
- JobRequisition: Only creator/hiring_manager can edit
- InterviewFeedback: Only interviewer can submit
- ProctoringEvent: Only admins can review
- Notification: User can only see their own

See **MODEL_IMPLEMENTATION_COMPLETE.md** (Security Notes section) for details.

---

## 📊 Analytics Queries

### Popular Queries
```sql
-- Active job openings
SELECT * FROM job_requisitions 
WHERE status = 'open' AND is_published = true;

-- Upcoming interviews
SELECT * FROM interview_sessions 
WHERE scheduled_at > NOW() AND status = 'scheduled';

-- High-severity proctoring events
SELECT * FROM proctoring_events 
WHERE severity IN ('high', 'critical') AND reviewed = false;

-- Unread notifications
SELECT * FROM notifications 
WHERE user_id = ? AND is_read = false 
ORDER BY created_at DESC;
```

More examples in **MODEL_RELATIONSHIPS.md**.

---

## 🐛 Troubleshooting

### Migration Fails
```bash
# Check current version
alembic current

# View migration SQL without applying
alembic upgrade head --sql

# Rollback to previous version
alembic downgrade -1
```

### Import Guidance
```python
# Ensure all imports from app.models
from app.models import JobRequisition, InterviewSession

# Note: `extended_models.py` has been removed; import the models from `app.db.models` or `app.models`
```

### Query Performance Issues
- Check **MODEL_RELATIONSHIPS.md** (Indexes Strategy)
- Use `EXPLAIN ANALYZE` in PostgreSQL
- Add suggested indexes from documentation

---

## 📦 Dependencies

### Required Packages
```txt
sqlalchemy>=2.0.0
alembic>=1.12.0
pydantic>=2.0.0
python-dateutil>=2.8.2
```

### Database
- PostgreSQL 14+
- Extensions: uuid-ossp, pg_trgm

---

## 🔄 Migration Management

### Migration Files
1. `001_add_questionset_model` - Base schema
2. `002_add_questionset_to_test_session` - QuestionSet integration
3. `003_add_user_streaks` - Streak tracking
4. `004_add_candidate_assessment_models` - Candidate workflow
5. `005_add_assessment_tokens` - Invitation tokens
6. `006_add_extraction_log_model` - LLM audit
7. `007_add_admin_settings_model` - Admin config
8. `008_add_skillmatch_model` - Skill matching
9. **`009_add_extended_workflow_models`** - Recruiter/Interviewer ⭐ NEW

### Apply All Migrations
```bash
alembic upgrade head
```

### View Migration History
```bash
alembic history --verbose
```

---

## 📞 Support

### Questions About Models
- Structure/Fields → **DATABASE_MODELS.md**
- Relationships → **MODEL_RELATIONSHIPS.md**
- Usage → **MODELS_QUICK_START.md**

### Implementation Questions
- API Design → **MODEL_IMPLEMENTATION_COMPLETE.md**
- Performance → **MODEL_RELATIONSHIPS.md** (Indexes section)
- Security → **MODEL_IMPLEMENTATION_COMPLETE.md** (Security Notes)

---

## ✅ Status

- **Models**: ✅ Complete (25 models)
 - **Models**: ✅ Complete (30 models)
- **Schemas**: ✅ Complete (95+ Pydantic schemas)
- **Migration**: ✅ Ready (`009_add_extended_workflow_models.py`)
- **Documentation**: ✅ Complete (4 comprehensive docs)
- **API**: ⏳ Ready for implementation
- **Frontend**: ⏳ Ready for integration

---

## 🎉 What's New (Latest Update)

### New Models (6)
1. ✨ **JobRequisition** - Job posting management
2. ✨ **InterviewSession** - Interview scheduling
3. ✨ **InterviewFeedback** - Post-interview evaluation
4. ✨ **ProctoringEvent** - Test monitoring
5. ✨ **Notification** - System notifications
6. ✨ **ApplicationNote** - Recruiter notes

### Superadmin Models (5)
7. ✨ **AuditLog** - Audit trail
8. ✨ **Tenant** - Multi-tenant support
9. ✨ **SystemIncident** - Incident tracking
10. ✨ **SystemMetric** - Metrics collection
11. ✨ **FeatureFlag** - Feature flagging

### New Features
- Status enums for type safety
 - Comprehensive indexes (72 new)
- Full Pydantic schema coverage
- Ready-to-use API endpoint suggestions
- Complete documentation suite

---

**Last Updated**: December 14, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
