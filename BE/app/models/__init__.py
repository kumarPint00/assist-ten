"""Models module - export all models for easy imports."""

# Import all ORM models
from app.db.models import (
    User,
    RefreshToken,
    JobDescription,
    QuestionSet,
    Question,
    TestSession,
    Answer,
    CeleryTask,
    Candidate,
    Assessment,
    AssessmentApplication,
    UploadedDocument,
    SkillMatch,
    AssessmentToken,
    Skill,
    Role,
    ExtractionLog,
    AdminSettings,
)

# Import extended models for recruiter/interviewer and superadmin workflows (merged into models.py)
from app.db.models import (
    JobRequisition,
    JobRequisitionStatus,
    InterviewSession,
    InterviewStatus,
    InterviewFeedback,
    ProctoringEvent,
    ProctoringIncidentSeverity,
    Notification,
    NotificationType,
    ApplicationNote,
    # Superadmin models
    AuditLog,
    AuditLogAction,
    Tenant,
    SystemIncident,
    SystemMetric,
    FeatureFlag,
)

# Import Pydantic schemas
from app.models.schemas import (
    # Validation schemas
    FieldError,
    ValidationErrorResponse,
    OperationResponse,
    
    # MCQ & Test schemas
    MCQOption,
    MCQQuestion,
    MCQResponse,
    QuestionSetResponse,
    StartQuestionSetTestRequest,
    StartQuestionSetTestResponse,
    AnswerSubmit,
    SubmitAllAnswersRequest,
    QuestionResultDetailed,
    TestResultResponse,
    AnswerSubmission,
    TestSession as TestSessionSchema,
    QuestionResult,
    TestResult,
    TestSessionResponse,
    TestSessionDetailResponse,
    CourseRecommendation,
    RecommendedCoursesResponse,
    
    # Candidate & Assessment schemas
    CandidateInfoSchema,
    CandidateCreate,
    CandidateUpdate,
    CandidateResponse,
    SkillResponse,
    RoleResponse,
    AssessmentCreate,
    AssessmentInviteRequest,
    AssessmentInviteResponse,
    AssessmentUpdate,
    AssessmentResponse,
    AssessmentApplicationRequest,
    AssessmentApplicationResponse,
    UploadedDocumentResponse,
    
    # Skill extraction schemas
    ExtractedSkill,
    DocumentSkillExtractionResponse,
    AdminBulkSkillExtractionResponse,
    MatchedSkill,
    SkillMatchResponse,
    SkillMatchRecord,
    
    # Job Requisition schemas
    JobRequisitionCreate,
    JobRequisitionUpdate,
    JobRequisitionResponse,
    
    # Interview Session schemas
    InterviewSessionCreate,
    InterviewSessionUpdate,
    InterviewSessionResponse,
    
    # Interview Feedback schemas
    InterviewFeedbackCreate,
    InterviewFeedbackResponse,
    
    # Proctoring Event schemas
    ProctoringEventCreate,
    ProctoringEventResponse,
    ProctoringEventReview,
    
    # Notification schemas
    NotificationCreate,
    NotificationResponse,
    NotificationMarkRead,
    
    # Application Note schemas
    ApplicationNoteCreate,
    ApplicationNoteResponse,
    
    # Superadmin schemas
    AuditLogCreate,
    AuditLogResponse,
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    SystemIncidentCreate,
    SystemIncidentUpdate,
    SystemIncidentResponse,
    SystemMetricCreate,
    SystemMetricResponse,
    FeatureFlagCreate,
    FeatureFlagUpdate,
    FeatureFlagResponse,
)

__all__ = [
    # ORM Models
    "User",
    "RefreshToken",
    "JobDescription",
    "QuestionSet",
    "Question",
    "TestSession",
    "Answer",
    "CeleryTask",
    "Candidate",
    "Assessment",
    "AssessmentApplication",
    "UploadedDocument",
    "SkillMatch",
    "AssessmentToken",
    "Skill",
    "Role",
    "ExtractionLog",
    "AdminSettings",
    
    # Extended Models
    "JobRequisition",
    "JobRequisitionStatus",
    "InterviewSession",
    "InterviewStatus",
    "InterviewFeedback",
    "ProctoringEvent",
    "ProctoringIncidentSeverity",
    "Notification",
    "NotificationType",
    "ApplicationNote",
    
    # Superadmin Models
    "AuditLog",
    "AuditLogAction",
    "Tenant",
    "SystemIncident",
    "SystemMetric",
    "FeatureFlag",
    
    # Pydantic Schemas
    "FieldError",
    "ValidationErrorResponse",
    "OperationResponse",
    "MCQOption",
    "MCQQuestion",
    "MCQResponse",
    "QuestionSetResponse",
    "StartQuestionSetTestRequest",
    "StartQuestionSetTestResponse",
    "AnswerSubmit",
    "SubmitAllAnswersRequest",
    "QuestionResultDetailed",
    "TestResultResponse",
    "AnswerSubmission",
    "TestSessionSchema",
    "QuestionResult",
    "TestResult",
    "TestSessionResponse",
    "TestSessionDetailResponse",
    "CourseRecommendation",
    "RecommendedCoursesResponse",
    "CandidateInfoSchema",
    "CandidateCreate",
    "CandidateUpdate",
    "CandidateResponse",
    "SkillResponse",
    "RoleResponse",
    "AssessmentCreate",
    "AssessmentInviteRequest",
    "AssessmentInviteResponse",
    "AssessmentUpdate",
    "AssessmentResponse",
    "AssessmentApplicationRequest",
    "AssessmentApplicationResponse",
    "UploadedDocumentResponse",
    "ExtractedSkill",
    "DocumentSkillExtractionResponse",
    "AdminBulkSkillExtractionResponse",
    "MatchedSkill",
    "SkillMatchResponse",
    "SkillMatchRecord",
    
    # Job Requisition schemas
    "JobRequisitionCreate",
    "JobRequisitionUpdate",
    "JobRequisitionResponse",
    
    # Interview Session schemas
    "InterviewSessionCreate",
    "InterviewSessionUpdate",
    "InterviewSessionResponse",
    
    # Interview Feedback schemas
    "InterviewFeedbackCreate",
    "InterviewFeedbackResponse",
    
    # Proctoring Event schemas
    "ProctoringEventCreate",
    "ProctoringEventResponse",
    "ProctoringEventReview",
    
    # Notification schemas
    "NotificationCreate",
    "NotificationResponse",
    "NotificationMarkRead",
    
    # Application Note schemas
    "ApplicationNoteCreate",
    "ApplicationNoteResponse",
    
    # Superadmin schemas
    "AuditLogCreate",
    "AuditLogResponse",
    "TenantCreate",
    "TenantUpdate",
    "TenantResponse",
    "SystemIncidentCreate",
    "SystemIncidentUpdate",
    "SystemIncidentResponse",
    "SystemMetricCreate",
    "SystemMetricResponse",
    "FeatureFlagCreate",
    "FeatureFlagUpdate",
    "FeatureFlagResponse",
]
