# AI Learning Assessment Platform - Copilot Instructions

## 🏗️ Architecture Overview

This is a **full-stack AI-powered learning platform** with separate backend (FastAPI) and frontend (React+TypeScript) applications:

- **BE/** - FastAPI backend with SQLAlchemy 2.x (async), Alembic, PostgreSQL, Redis, Celery
- **FE/** - React 19 + TypeScript + Vite frontend with Material-UI components

**Key Integration**: Azure AD SSO authentication for production (Assist-ten emails), dual admin/candidate roles.

## 🔑 Authentication Architecture

**Multi-modal Auth System** - Handle both patterns:
1. **OTP Email Auth** (development): `POST /api/v1/auth/request-otp` → `POST /api/v1/auth/verify-otp`
2. **Azure AD SSO** (production): `GET /api/v1/auth/sso/azure/login` → callback → JWT tokens

**Token Management**: JWT access tokens + refresh tokens stored in `refresh_tokens` table. Frontend stores tokens in localStorage with auto-renewal via axios interceptors.

## 📊 Database Patterns

**Migration-First Development**: All schema changes via Alembic migrations in `BE/alembic/versions/`. Use descriptive prefixes like `001_add_questionset_model.py`.

**Key Models Hierarchy**:
```
User (auth + streaks)
├── TestSession (quiz attempts)
├── Assessment (admin-created)
│   ├── QuestionSet (generated questions)
│   └── CandidateAssessment (candidate results)
└── RefreshToken (JWT management)
```

**Async Patterns**: All database operations use `AsyncSession`. Models extend `Base, TimestampMixin` for auto-timestamps.

## 🎯 Business Logic Patterns

**Question Generation Flow**:
1. Admin uploads JD → `POST /api/v1/upload-jd`
2. Celery generates MCQs → `POST /api/v1/generate-questions` 
3. Questions stored in `QuestionSet` → linked to `Assessment`
4. Candidates take test via `TestSession`

**Streak System**: Login/quiz streaks tracked in User model with `streak_manager.py` utilities.

## 🚀 Development Workflows

**Backend Setup**:
```bash
cd BE/
make docker-up        # Start postgres, redis, minio
make migrate          # Run Alembic migrations
make dev             # Start FastAPI (uvicorn)
make celery          # Start background worker
```

**Frontend Setup**:
```bash
cd FE/
npm run dev          # Start Vite dev server
```

**Key Commands**:
- `make migration -m "description"` - Create new Alembic migration
- `docker-compose logs api` - View backend logs
- Check `BE/config.py` for environment variables

## 🎨 Frontend Architecture

**Container Pattern**: Each major feature has a Container (logic) + Components (UI):
```
containers/
├── AdminDashboard/           # RBAC admin panel
├── AssessmentSetupContainer/ # Create assessments
├── CandidateAssessmentContainer/ # Take assessments
└── DashboardContainer/       # User dashboard
```

**Route Protection**: 
- `ProtectedRoute` - Requires auth
- `AdminProtectedRoute` - Requires admin role
- `ProtectedAuthRoute` - Redirects if already authenticated

**API Layer**: Centralized in `src/API/services.ts` with axios interceptors for token management.

## 🔧 Component Conventions

**Backend API Endpoints**:
- Use FastAPI routers in `app/api/` with consistent patterns
- All endpoints return structured JSON responses
- Async/await patterns throughout (`async def`)
- Use Pydantic schemas in `app/models/schemas.py`

**Frontend Components**:
- TypeScript-first with proper interface definitions
- Material-UI for consistent styling
- Formik + Yup for form handling
- Toast notifications via custom Toast component

**Error Handling**:
- Backend: Structured logging with structlog, Sentry integration
- Frontend: Axios interceptors catch 401s, clear localStorage, redirect to login

## 🎭 Role-Based Access Control (RBAC)

**Admin Features** (check `User.is_admin` flag):
- Assessment creation and management
- Candidate invitation system
- Skills extraction from JDs
- Dashboard analytics

**Candidate Features**:
- Take assigned assessments
- View results and recommendations
- Profile management

## 📝 Key Integration Points

**Celery Tasks**: Background processing in `app/core/tasks/` for:
- Question generation (OpenAI integration)
- Email notifications 
- Score calculations

**Vector Search**: FAISS-based course recommendations using HuggingFace embeddings in `app/vector_db/`.

**File Processing**: Support for PDF/DOC job descriptions with text extraction in `app/utils/text_extract.py`.

**Monitoring**: Prometheus metrics at `/metrics`, structured logging, Sentry error tracking.

## 🔍 Testing & Debugging

**Environment Modes**:
- Set `ENVIRONMENT=development` for OTP auth mode
- Set `ENVIRONMENT=production` for Azure AD SSO mode
- Use `scripts/check_sso_config.py` to verify Azure AD setup

**Common Issues**:
- Redis connection errors → Check `docker-compose up redis`
- Migration conflicts → Use sequential numbering in filenames
- CORS issues → Verify `ALLOWED_ORIGINS` in backend config
- Azure AD callback failures → Check redirect URI configuration

## 💡 AI Agent Tips

- **Migration Strategy**: Always create migrations for schema changes, never edit models directly
- **Authentication Context**: Check both OTP and SSO auth flows when working on auth features
- **Admin vs Candidate**: Always consider role-based access when adding features
- **Async Patterns**: Use `await` for all database operations in backend
- **Container Structure**: Follow the established Container → Components pattern in frontend
- **Error Handling**: Use the established Toast notification system for user feedback