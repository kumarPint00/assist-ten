# Assist-Ten Model Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION & USER                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ┌──────┐
                                    │ User │
                                    └───┬──┘
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
              ┌─────▼──────┐     ┌─────▼──────┐     ┌─────▼──────┐
              │RefreshToken│     │AdminSettings│    │Notification│
              └────────────┘     └────────────┘     └────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ASSESSMENT & QUESTION GENERATION                          │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌─────────────────┐                    ┌─────────────┐
    │JobDescription   │                    │QuestionSet  │
    └────┬────────────┘                    └──────┬──────┘
         │                                        │
         │         ┌───────────────────────────────┘
         │         │
         └────┬────▼──────┐
              │ Question  │
              └─────┬─────┘
                    │
                    │
              ┌─────▼─────┐
              │TestSession│◄──────────── User
              └─────┬─────┘
                    │
              ┌─────▼─────┐
              │  Answer   │
              └───────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    CANDIDATE & ASSESSMENT WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────┐
    │  Candidate   │
    └───────┬──────┘
            │
            │         ┌────────────────┐
            └────────►│  Assessment    │
                      │  Application   │◄────┐
                      └────┬───────────┘     │
                           │                 │
                      ┌────▼──────────┐      │
                      │  Assessment   │──────┘
                      └────┬──────────┘
                           │
                      ┌────▼──────────┐
                      │AssessmentToken│
                      └───────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         RECRUITER WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────┐
    │ JobRequisition   │◄─────── User (created_by, hiring_manager)
    └────────┬─────────┘
             │
             │
        ┌────▼────────────┐
        │InterviewSession │◄─────── Candidate
        └────┬────────────┘◄─────── User (interviewer)
             │
        ┌────▼─────────────┐
        │InterviewFeedback │◄─────── User (interviewer)
        └──────────────────┘

    ┌─────────────────┐
    │AssessmentApp.   │◄─────── Candidate + Assessment
    └────────┬────────┘
             │
        ┌────▼───────────┐
        │ApplicationNote │◄─────── User (author)
        └────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      PROCTORING & MONITORING                                 │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────┐
    │ TestSession  │
    └───────┬──────┘
            │
            │
       ┌────▼─────────────┐
       │ProctoringEvent   │◄─────── User (reviewer)
       └──────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                      DOCUMENT & FILE MANAGEMENT                              │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌──────────────────┐
    │UploadedDocument  │◄─────── Candidate / User
    └────────┬─────────┘
             │
             │
        ┌────▼────────┐
        │ SkillMatch  │◄─────── User
        └─────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         MASTER DATA                                          │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌───────┐         ┌──────┐
    │ Skill │         │ Role │
    └───────┘         └──────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUDIT & SYSTEM                                       │
└─────────────────────────────────────────────────────────────────────────────┘
    ┌───────────────┐         ┌─────────────┐
    │ExtractionLog  │         │ CeleryTask  │
    └───────────────┘         └─────────────┘
```

## Key Relationships

### One-to-Many
- User → TestSession, RefreshToken, Notification, JobRequisition, InterviewSession
- Candidate → AssessmentApplication, InterviewSession
- JobRequisition → InterviewSession
- TestSession → Answer, ProctoringEvent
- Assessment → AssessmentApplication, AssessmentToken

### One-to-One
- InterviewSession ↔ InterviewFeedback (unique constraint)
- User ↔ AdminSettings

### Many-to-One
- Question → QuestionSet OR JobDescription
- TestSession → QuestionSet OR JobDescription
- AssessmentApplication → Candidate + Assessment
- InterviewSession → Candidate + JobRequisition

### Polymorphic/Optional Links
- Question can link to either QuestionSet OR JobDescription (not both)
- TestSession can link to either QuestionSet OR JobDescription (not both)

## Flow Examples

### Recruiter Hiring Flow
```
JobRequisition (created)
    ↓
Assessment (linked)
    ↓
AssessmentToken (invite sent)
    ↓
Candidate (applies) → AssessmentApplication
    ↓
TestSession (candidate takes test)
    ↓
InterviewSession (scheduled)
    ↓
InterviewFeedback (submitted)
    ↓
ApplicationNote (internal notes)
```

### Interviewer Flow
```
InterviewSession (assigned to interviewer)
    ↓
(Interview happens - status updates)
    ↓
InterviewFeedback (submitted with ratings)
    ↓
Notification (sent to recruiter/hiring manager)
```

### Candidate Assessment Flow
```
Candidate (receives token)
    ↓
AssessmentApplication (applies)
    ↓
TestSession (starts test)
    ↓
Answer (submits responses)
    ↓
ProctoringEvent (if flagged)
    ↓
TestSession (completed with score)
```

## Database Indexes Strategy

### High-Traffic Queries
- User lookups by email (auth): `users.email` (unique)
- Session lookups: `test_sessions.session_id` (unique)
- Candidate searches: `candidates.email`, `candidates.user_id`

### Filtering & Sorting
- Assessment status: `assessments.is_published`, `assessments.status`
- Interview scheduling: `interview_sessions.scheduled_at`, `interview_sessions.status`
- Notification inbox: `(user_id, is_read)` composite

### Analytics Queries
- Time-based aggregations: `created_at` on most tables
- Proctoring severity: `(test_session_id, severity)` composite
- Interview outcomes: `interview_feedback.recommendation`

### Foreign Key Performance
- Most foreign keys have indexes for JOIN performance
- Composite indexes for common query patterns (e.g., user_id + created_at)

## Data Integrity

### Unique Constraints
- One application per candidate per assessment
- One answer per question per session
- One feedback per interview
- Unique tokens, IDs, emails where needed

### Cascade Behavior
- DELETE CASCADE on dependent entities (answers, applications, etc.)
- Preserve audit trails (ExtractionLog, SkillMatch) even if source deleted

### Soft Deletes
- Most entities use `is_active` flag rather than hard deletes
- Preserves historical data for analytics
