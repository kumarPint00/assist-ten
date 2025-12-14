# Assist-Ten Database Models Documentation

## Overview
Complete database model structure for the Assist-Ten recruitment and assessment platform, supporting recruiter, interviewer, candidate, and admin workflows.

---

## Core Authentication & User Management

### User
**Purpose**: Central user account for all roles (candidate, recruiter, interviewer, admin, super_admin)

**Key Fields**:
- `email`, `full_name`, `role`
- Streak tracking: `login_streak`, `quiz_streak` with max/last_date fields
- Status: `is_active`, `is_verified`

**Relationships**:
- test_sessions, refresh_tokens, admin_settings

---

### RefreshToken
**Purpose**: JWT refresh token management for secure authentication

**Key Fields**:
- `token` (unique), `user_id`, `expires_at`, `is_revoked`

---

## Assessment & Question Management

### JobDescription
**Purpose**: Store uploaded job descriptions for generating questions/assessments

**Key Fields**:
- `jd_id`, `title`, `description`, `extracted_text`
- S3 storage: `s3_key`, `file_name`, `file_size`
- `uploaded_by` (user_id)

**Relationships**:
- questions, test_sessions

---

### QuestionSet
**Purpose**: Pre-generated question collections by skill/level

**Key Fields**:
- `question_set_id`, `skill`, `level` (beginner/intermediate/expert)
- `total_questions`, `generation_model`

**Relationships**:
- questions

---

### Question
**Purpose**: MCQ questions for assessments

**Key Fields**:
- `question_text`, `options` (JSON), `correct_answer`
- Links to either `question_set_id` OR `jd_id`
- `difficulty`, `topic`, `generation_model`

**Relationships**:
- question_set, job_description, answers

---

### TestSession
**Purpose**: Track candidate test attempts

**Key Fields**:
- `session_id`, `user_id`, `candidate_name`, `candidate_email`
- Links to `question_set_id` OR `jd_id`
- Timing: `started_at`, `completed_at`, `duration_seconds`
- Results: `total_questions`, `correct_answers`, `score_percentage`
- Status: `is_completed`, `is_scored`, `score_released_at`

**Relationships**:
- question_set, job_description, user, answers

---

### Answer
**Purpose**: Store individual question responses

**Key Fields**:
- `session_id`, `question_id`, `selected_answer`
- `is_correct`, `time_taken_seconds`

**Unique Constraint**: (session_id, question_id)

---

## Candidate & Assessment Workflow

### Candidate
**Purpose**: Candidate profile for applications/assessments

**Key Fields**:
- `candidate_id`, `full_name`, `email`, `phone`
- Professional: `current_role`, `location`, `education`
- Links: `linkedin_url`, `github_url`, `portfolio_url`
- Skills: `experience_level`, `experience_years`, `skills` (JSON)
- Files: `jd_file_id`, `cv_file_id`, `portfolio_file_id`
- `availability_percentage`

**Relationships**:
- assessment_applications

---

### Assessment
**Purpose**: Admin-created assessment configurations

**Key Fields**:
- `assessment_id`, `title`, `description`, `job_title`
- `jd_id`, `required_skills`, `required_roles`
- `question_set_id`, `assessment_method`
- Settings: `duration_minutes`, `is_questionnaire_enabled`, `is_interview_enabled`
- Status: `is_active`, `is_published`, `expires_at`
- `created_by` (admin user_id)

**Relationships**:
- applications

**Property**: `is_expired` (computed from `expires_at`)

---

### AssessmentApplication
**Purpose**: Track candidate applications to assessments

**Key Fields**:
- `application_id`, `candidate_id`, `assessment_id`
- `test_session_id` (if test started)
- Status: `status` (pending/in_progress/completed/shortlisted/rejected)
- Timing: `applied_at`, `started_at`, `completed_at`
- `candidate_availability`, `submitted_skills`, `role_applied_for`

**Relationships**:
- candidate, assessment, test_session

**Unique Constraint**: (candidate_id, assessment_id)

---

### AssessmentToken
**Purpose**: Secure invitation tokens for candidate access

**Key Fields**:
- `token` (unique), `assessment_id`, `candidate_email`
- `expires_at`, `is_used`
- `created_by` (recruiter/admin)

---

## Recruiter Workflow Models

### JobRequisition
**Purpose**: Job postings managed by recruiters

**Key Fields**:
- `requisition_id`, `title`, `description`
- Details: `department`, `location`, `employment_type`
- Requirements: `required_skills`, `experience_level`, `min/max_experience_years`
- Salary: `min/max_salary`, `currency`
- Hiring: `positions_available`, `positions_filled`
- Status: `status` (draft/open/paused/closed/filled/cancelled)
- Visibility: `is_published`, `published_at`, `closes_at`
- Links: `jd_id`, `assessment_id`
- Owners: `created_by`, `hiring_manager_id`
- Metrics: `total_applicants`, `total_interviewed`, `total_hired`

**Relationships**:
- creator (User), hiring_manager (User), interviews

**Status Enum**: draft, open, paused, closed, filled, cancelled

---

### ApplicationNote
**Purpose**: Internal notes/comments on candidate applications

**Key Fields**:
- `note_id`, `application_id`, `author_id`
- `note_text`, `note_type` (general/follow_up/red_flag)
- `is_private`

---

## Interviewer Workflow Models

### InterviewSession
**Purpose**: Schedule and track interviews

**Key Fields**:
- `interview_id`, `interview_type` (technical/behavioral/cultural/panel)
- `interview_mode` (video/phone/in-person/ai)
- Links: `candidate_id`, `requisition_id`, `assessment_application_id`
- Scheduling: `scheduled_at`, `duration_minutes`, `timezone`
- Participants: `interviewer_id`, `additional_interviewers` (JSON array)
- Status: `status` (scheduled/in_progress/completed/cancelled/no_show)
- Timing: `started_at`, `ended_at`, `actual_duration_minutes`
- Content: `preparation_notes`, `question_guide`
- Meeting: `meeting_link`, `meeting_room`, `meeting_notes`
- `cancellation_reason`, `reminder_sent`

**Relationships**:
- candidate, interviewer (User), job_requisition, feedback

**Status Enum**: scheduled, in_progress, completed, cancelled, no_show

---

### InterviewFeedback
**Purpose**: Post-interview evaluation and notes

**Key Fields**:
- `feedback_id`, `interview_id` (unique), `interviewer_id`
- Overall: `overall_rating`, `recommendation` (strong_hire/hire/maybe/no_hire)
- Ratings: `technical_skills_rating`, `communication_rating`, `problem_solving_rating`, `culture_fit_rating`
- `skills_evaluated` (JSON)
- Textual: `strengths`, `weaknesses`, `detailed_notes`
- `questions_asked` (JSON array)
- Follow-up: `requires_second_round`, `follow_up_notes`
- `submitted_at`, `is_final`

**Relationships**:
- interview, interviewer (User)

**Unique Constraint**: One feedback per interview_id

---

## Proctoring & Monitoring

### ProctoringEvent
**Purpose**: Log proctoring incidents during tests

**Key Fields**:
- `event_id`, `test_session_id`
- `event_type` (multiple_faces/no_face/tab_switch/window_blur/etc.)
- `severity` (low/medium/high/critical)
- `detected_at`, `duration_seconds`
- Context: `question_id`, `snapshot_url`, `metadata` (JSON)
- Review: `reviewed`, `reviewed_by`, `reviewed_at`, `reviewer_notes`
- `flagged`

**Relationships**:
- test_session, reviewer (User)

**Severity Enum**: low, medium, high, critical

---

## System & Admin Models

### Notification
**Purpose**: User notifications across all roles

**Key Fields**:
- `notification_id`, `user_id`
- `notification_type` (system/assessment/interview/application/proctoring)
- `title`, `message`
- Context: `related_entity_type`, `related_entity_id`, `action_url`
- Status: `is_read`, `read_at`, `is_archived`
- `priority` (low/normal/high/urgent)

**Relationships**:
- user

**Type Enum**: system, assessment, interview, application, proctoring

---

### UploadedDocument
**Purpose**: Track all file uploads (CV, JD, portfolio, etc.)

**Key Fields**:
- `file_id`, `candidate_id`, `user_id`
- `original_filename`, `file_type`, `document_category`
- S3: `s3_key`, `file_size`, `mime_type`
- Extraction: `extracted_text`, `extraction_preview`
- Security: `is_encrypted`, `encryption_method`

---

### Skill
**Purpose**: Master skill catalog

**Key Fields**:
- `skill_id`, `name` (unique), `description`
- `category` (technical/soft/language/etc.)
- `is_active`

---

### Role
**Purpose**: Master role/job title catalog

**Key Fields**:
- `role_id`, `name` (unique), `description`
- `department`, `required_skills` (JSON)
- `is_active`

---

### SkillMatch
**Purpose**: Audit trail of JD-CV skill matching runs

**Key Fields**:
- `match_id`, `user_id`
- `jd_file_id`, `cv_file_id`
- `match_score`, `matched_skills`, `missing_skills`, `extra_skills`
- `summary` (JSON)
- `llm_used`, `provider`

---

### ExtractionLog
**Purpose**: LLM extraction audit log

**Key Fields**:
- `user_id`, `extraction_type` (cv_llm/jd_llm)
- `input_length`, `output_data`, `confidence_score`
- `status` (success/failed), `error_message`
- `provider` (openai/anthropic/etc.)

---

### AdminSettings
**Purpose**: User-specific admin configurations

**Key Fields**:
- `user_id` (unique), `settings` (JSON)

---

### CeleryTask
**Purpose**: Async task tracking

**Key Fields**:
- `task_id`, `task_name`, `status`, `result`, `error`
- `related_type`, `related_id`, `user_id`

---

## Relationships Summary

### User → Many
- test_sessions, refresh_tokens, admin_settings
- job_requisitions (as creator or hiring_manager)
- interview_sessions (as interviewer)
- notifications

### Candidate → Many
- assessment_applications
- interview_sessions

### Assessment → Many
- applications, tokens

### JobRequisition → Many
- interviews

### InterviewSession → One
- feedback (unique)

### TestSession → Many
- answers, proctoring_events

---

## Indexes & Performance

### Key Indexes
- Email lookups: `users.email`, `candidates.email`
- Status filters: `assessments.is_published`, `job_requisitions.status`
- Time-based: `test_sessions.created_at`, `interview_sessions.scheduled_at`
- Composite: `(user_id, created_at)` on sessions, `(test_session_id, severity)` on proctoring
- Read status: `(user_id, is_read)` on notifications

### Unique Constraints
- One application per (candidate, assessment)
- One answer per (session, question)
- One feedback per interview

---

## Migration History

1. **001_add_questionset_model** - Base schema (users, JD, questions, sessions)
2. **002_add_questionset_to_test_session** - QuestionSet integration
3. **003_add_user_streaks** - Login/quiz streak tracking
4. **004_add_candidate_assessment_models** - Candidate/Assessment workflow
5. **005_add_assessment_tokens** - Invitation tokens
6. **006_add_extraction_log_model** - LLM extraction audit
7. **007_add_admin_settings_model** - Admin config storage
8. **008_add_skillmatch_model** - Skill matching audit
9. **009_extended_workflows** - Recruiter/interviewer models (JobRequisition, InterviewSession, Feedback, Proctoring, Notifications, Notes)

---

## Enums Reference

### JobRequisitionStatus
- draft, open, paused, closed, filled, cancelled

### InterviewStatus
- scheduled, in_progress, completed, cancelled, no_show

### ProctoringIncidentSeverity
- low, medium, high, critical

### NotificationType
- system, assessment, interview, application, proctoring

---

## Usage Examples

### Creating a Job Requisition
```python
requisition = JobRequisition(
    title="Senior Python Engineer",
    description="...",
    employment_type="full-time",
    experience_level="senior",
    required_skills={"Python": "expert", "FastAPI": "intermediate"},
    positions_available=2,
    created_by=recruiter_user_id,
    status=JobRequisitionStatus.DRAFT
)
```

### Scheduling an Interview
```python
interview = InterviewSession(
    candidate_id=candidate.id,
    requisition_id=requisition.requisition_id,
    interview_type="technical",
    interview_mode="video",
    scheduled_at=datetime(...),
    interviewer_id=interviewer_user_id,
    duration_minutes=60
)
```

### Logging Proctoring Event
```python
event = ProctoringEvent(
    test_session_id=session.session_id,
    event_type="multiple_faces",
    severity=ProctoringIncidentSeverity.HIGH,
    detected_at=datetime.utcnow(),
    snapshot_url="s3://..."
)
```

### Submitting Interview Feedback
```python
feedback = InterviewFeedback(
    interview_id=interview.interview_id,
    interviewer_id=interviewer_user_id,
    overall_rating=4.5,
    recommendation="hire",
    technical_skills_rating=4.0,
    strengths="Strong problem-solving...",
    submitted_at=datetime.utcnow()
)
```

---

## Schema Validation (Pydantic)

All models have corresponding Pydantic schemas in `app/models/schemas.py`:
- **Create** schemas (request bodies)
- **Update** schemas (partial updates)
- **Response** schemas (API responses with `from_attributes=True`)

---

## Future Considerations

1. **Candidate Pipeline Stages**: Explicit pipeline tracking (applied → screening → interview → offer)
2. **Team Collaboration**: Shared notes, mentions, task assignments
3. **Analytics**: Aggregated metrics tables for dashboard performance
4. **Audit Trails**: Generic audit log for all entity changes
5. **Multi-tenant**: Organization/tenant isolation if expanding to B2B SaaS

---

Generated: 2025-12-14
