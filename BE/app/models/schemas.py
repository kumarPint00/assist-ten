from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# ============ VALIDATION ERROR SCHEMAS ============

class FieldError(BaseModel):
    """Validation error for a specific field."""
    field: str
    error_code: str
    message: str
    value: Optional[str] = None

class ValidationErrorResponse(BaseModel):
    """Standard validation error response for frontend."""
    success: bool = False
    error_type: str = "VALIDATION_ERROR"
    message: str
    field_errors: List[FieldError]
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class OperationResponse(BaseModel):
    """Generic operation response with status."""
    success: bool
    message: str
    data: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ============ MCQ & TEST SCHEMAS ============

class MCQOption(BaseModel):
    option_id: str  # e.g., "A", "B", "C", "D"
    text: str

class MCQQuestion(BaseModel):
    question_id: int
    question_text: str
    options: List[MCQOption]
    correct_answer: str  # e.g., "A", "B", "C", "D"

class MCQResponse(BaseModel):
    jd_id: str
    message: str
    questions: List[MCQQuestion]

class QuestionSetResponse(BaseModel):
    """Response schema for generated question sets."""
    question_set_id: str
    skill: str
    level: str
    total_questions: int
    created_at: datetime
    message: str
    questions: List[MCQQuestion]

# QuestionSet Test Schemas
class StartQuestionSetTestRequest(BaseModel):
    """Request to start a test from a question set."""
    question_set_id: str

class StartQuestionSetTestResponse(BaseModel):
    """Response when starting a QuestionSet test."""
    session_id: str
    question_set_id: str
    skill: str
    level: str
    total_questions: int
    started_at: datetime
    questions: List[MCQQuestion]  # Return questions without correct answers

class AnswerSubmit(BaseModel):
    """Single answer submission."""
    question_id: int
    selected_answer: str  # e.g., "A", "B", "C", "D"

class SubmitAllAnswersRequest(BaseModel):
    """Submit all answers at once."""
    session_id: str
    answers: List[AnswerSubmit]

class QuestionResultDetailed(BaseModel):
    """Detailed result for a single question."""
    question_id: int
    question_text: str
    options: List[MCQOption]
    your_answer: str
    correct_answer: str
    is_correct: bool

class TestResultResponse(BaseModel):
    """Complete test results."""
    session_id: str
    question_set_id: str
    skill: str
    level: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    completed_at: datetime
    time_taken_seconds: int
    detailed_results: List[QuestionResultDetailed]

class AnswerSubmission(BaseModel):
    session_id: str
    question_id: int
    selected_answer: str  # e.g., "A", "B", "C", "D"

class TestSession(BaseModel):
    session_id: str
    jd_id: str
    candidate_name: Optional[str] = None
    started_at: datetime
    answers: dict  # {question_id: selected_answer}
    is_completed: bool = False

class QuestionResult(BaseModel):
    question_id: int
    question_text: str
    selected_answer: str
    correct_answer: str
    is_correct: bool

class TestResult(BaseModel):
    session_id: str
    jd_id: str
    candidate_name: Optional[str] = None
    total_questions: int
    correct_answers: int
    score_percentage: float
    detailed_results: List[QuestionResult]
    completed_at: datetime

class TestSessionResponse(BaseModel):
    """Basic test session information."""
    session_id: str
    question_set_id: Optional[str] = None
    jd_id: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool
    total_questions: int
    correct_answers: int
    score_percentage: Optional[float] = None

class TestSessionDetailResponse(BaseModel):
    """Detailed test session information."""
    session_id: str
    question_set_id: Optional[str] = None
    jd_id: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    is_completed: bool
    is_scored: bool
    score_released_at: Optional[datetime] = None
    total_questions: int
    correct_answers: int
    score_percentage: Optional[float] = None

class CourseRecommendation(BaseModel):
    name: str = Field(..., description="Course pathway display name")
    topic: str = Field(..., description="Skill/Topic Pathways")
    collection: str = Field(..., description="Collection Name")
    category: str = Field(..., description="Category")
    description: str = Field(..., description="Description")
    url: str = Field(..., description="Pathway URL")
    score: Optional[float] = Field(None, description="Similarity score")
    course_level: Optional[str] = Field(None, description="Course Level")

class RecommendedCoursesResponse(BaseModel):
    topic: str
    recommended_courses: list[CourseRecommendation]
66

# ============ CANDIDATE & ASSESSMENT SCHEMAS ============

class CandidateInfoSchema(BaseModel):
    """Candidate information extracted from resume or entered manually."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    experience: Optional[str] = None  # e.g., "5 years"
    current_role: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    education: Optional[str] = None

class CandidateCreate(BaseModel):
    """Request to create a new candidate."""
    full_name: str
    email: str
    phone: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_years: Optional[str] = None  # e.g., "5 years"
    experience_level: str  # junior, mid, senior, etc.
    skills: dict = {}  # {skill_name: proficiency_level}
    availability_percentage: int = 100

class CandidateUpdate(BaseModel):
    """Request to update candidate profile."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    current_role: Optional[str] = None
    location: Optional[str] = None
    education: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_years: Optional[str] = None
    experience_level: Optional[str] = None
    skills: Optional[dict] = None
    availability_percentage: Optional[int] = None

class CandidateResponse(BaseModel):
    """Response with candidate details."""
    id: int
    candidate_id: str
    full_name: str
    email: str
    phone: Optional[str]
    current_role: Optional[str]
    location: Optional[str]
    education: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    portfolio_url: Optional[str]
    experience_years: Optional[str]
    experience_level: str
    skills: dict
    availability_percentage: int
    jd_file_id: Optional[str]
    cv_file_id: Optional[str]
    portfolio_file_id: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SkillResponse(BaseModel):
    """Response with skill details."""
    id: int
    skill_id: str
    name: str
    description: Optional[str]
    category: str
    is_active: bool


class RoleResponse(BaseModel):
    """Response with role details."""
    id: int
    role_id: str
    name: str
    description: Optional[str]
    department: Optional[str]
    required_skills: dict
    is_active: bool


class AssessmentCreate(BaseModel):
    """Request to create a new assessment."""
    title: str
    description: Optional[str] = None
    job_title: str
    jd_id: Optional[str] = None
    required_skills: dict = {}
    required_roles: list = []
    question_set_id: Optional[str] = None
    duration_minutes: int = 30
    is_questionnaire_enabled: bool = True
    is_interview_enabled: bool = False
    expires_at: Optional[datetime] = None
    candidate_info: Optional[CandidateInfoSchema] = None


class AssessmentInviteRequest(BaseModel):
    """Request schema to invite candidates to an assessment by email."""
    emails: List[str]
    expires_in_hours: Optional[int] = 24
    message: Optional[str] = None


class AssessmentInviteResponse(BaseModel):
    """Response schema for invite endpoint."""
    success: bool
    invites_sent: List[dict] = []  # [{'email': str, 'token': str, 'expires_at': datetime}]
    message: Optional[str] = None


class AssessmentUpdate(BaseModel):
    """Request to update assessment."""
    title: Optional[str] = None
    description: Optional[str] = None
    job_title: Optional[str] = None
    required_skills: Optional[dict] = None
    required_roles: Optional[list] = None
    duration_minutes: Optional[int] = None
    is_questionnaire_enabled: Optional[bool] = None
    is_interview_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    is_published: Optional[bool] = None
    expires_at: Optional[datetime] = None


class AssessmentResponse(BaseModel):
    """Response with assessment details."""
    model_config = {"from_attributes": True}
    
    id: int
    assessment_id: str
    title: str
    description: Optional[str]
    job_title: str
    jd_id: Optional[str]
    required_skills: dict
    required_roles: list
    question_set_id: Optional[str]
    assessment_method: str
    duration_minutes: int
    is_questionnaire_enabled: bool
    is_interview_enabled: bool
    is_active: bool
    is_published: bool
    is_expired: bool = False
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class AssessmentApplicationRequest(BaseModel):
    """Request to apply for an assessment."""
    candidate_availability: int  # 0-100
    submitted_skills: dict  # {skill_name: proficiency_level}
    role_applied_for: Optional[str] = None


class AssessmentApplicationResponse(BaseModel):
    """Response with application details."""
    id: int
    application_id: str
    candidate_id: int
    assessment_id: int
    status: str  # pending, in_progress, completed, shortlisted, rejected
    candidate_availability: int
    submitted_skills: dict
    role_applied_for: Optional[str]
    applied_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class UploadedDocumentResponse(BaseModel):
    """Response with uploaded document details."""
    id: int
    file_id: str
    original_filename: str
    file_type: str
    document_category: str
    file_size: int
    mime_type: str
    extraction_preview: Optional[str]
    is_encrypted: bool
    created_at: datetime
    updated_at: datetime


# ============ ADMIN SKILL EXTRACTION SCHEMAS ============

class ExtractedSkill(BaseModel):
    """Extracted skill with proficiency level."""
    skill_name: str
    proficiency_level: str  # e.g., "beginner", "intermediate", "advanced", "expert"
    category: str  # e.g., "technical", "soft", "language"
    frequency: int = 1  # How many times mentioned in documents
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)  # Confidence score 0-1


class DocumentSkillExtractionResponse(BaseModel):
    """Skills extracted from a single document."""
    file_id: str
    original_filename: str
    document_category: str
    extracted_skills: List[ExtractedSkill]
    total_skills_found: int
    extraction_preview: str  # First 500 chars of extracted text


class AdminBulkSkillExtractionResponse(BaseModel):
    """Response for bulk skill extraction from multiple documents."""
    success: bool = True
    message: str
    documents_processed: int
    total_unique_skills: int
    extracted_skills: List[ExtractedSkill]  # Aggregated unique skills across all documents
    documents: List[DocumentSkillExtractionResponse]  # Skills per document
    extraction_summary: dict = Field(
        default_factory=dict,
        description="Summary stats: skills_by_category, proficiency_distribution"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class MatchedSkill(BaseModel):
    skill_name: str
    jd_proficiency: Optional[str] = None
    cv_proficiency: Optional[str] = None
    confidence: Optional[float] = Field(default=0.0, ge=0.0, le=1.0)


class SkillMatchResponse(BaseModel):
    success: bool = True
    match_score: float = 0.0
    matched_skills: List[MatchedSkill] = []
    missing_skills: List[str] = []
    extra_skills: List[str] = []
    details: Dict[str, Any] = Field(default_factory=dict)


class SkillMatchRecord(BaseModel):
    id: int
    match_id: str
    user_id: int
    jd_file_id: Optional[int]
    cv_file_id: Optional[int]
    match_score: float
    matched_skills: List[MatchedSkill]
    missing_skills: List[str]
    extra_skills: List[str]
    summary: Dict[str, Any]
    llm_used: bool
    provider: Optional[str]
    created_at: datetime


# ============ JOB REQUISITION SCHEMAS ============

class JobRequisitionCreate(BaseModel):
    """Request to create a new job requisition."""
    title: str
    description: str
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: str  # full-time, part-time, contract
    required_skills: dict = {}
    experience_level: str
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    currency: str = "USD"
    positions_available: int = 1
    jd_id: Optional[str] = None
    assessment_id: Optional[str] = None
    hiring_manager_id: Optional[int] = None


class JobRequisitionUpdate(BaseModel):
    """Request to update job requisition."""
    title: Optional[str] = None
    description: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    required_skills: Optional[dict] = None
    experience_level: Optional[str] = None
    min_experience_years: Optional[int] = None
    max_experience_years: Optional[int] = None
    min_salary: Optional[float] = None
    max_salary: Optional[float] = None
    status: Optional[str] = None
    is_published: Optional[bool] = None
    closes_at: Optional[datetime] = None


class JobRequisitionResponse(BaseModel):
    """Response with job requisition details."""
    model_config = {"from_attributes": True}
    
    id: int
    requisition_id: str
    title: str
    description: str
    department: Optional[str]
    location: Optional[str]
    employment_type: str
    required_skills: dict
    experience_level: str
    min_experience_years: Optional[int]
    max_experience_years: Optional[int]
    min_salary: Optional[float]
    max_salary: Optional[float]
    currency: str
    positions_available: int
    positions_filled: int
    status: str
    is_published: bool
    published_at: Optional[datetime]
    closes_at: Optional[datetime]
    total_applicants: int
    total_interviewed: int
    total_hired: int
    created_at: datetime
    updated_at: datetime


# ============ INTERVIEW SESSION SCHEMAS ============

class InterviewSessionCreate(BaseModel):
    """Request to create/schedule an interview."""
    candidate_id: int
    requisition_id: Optional[str] = None
    assessment_application_id: Optional[str] = None
    interview_type: str  # technical, behavioral, cultural, panel
    interview_mode: str  # video, phone, in-person, ai
    scheduled_at: datetime
    duration_minutes: int = 60
    timezone: str = "UTC"
    additional_interviewers: List[int] = []
    preparation_notes: Optional[str] = None
    question_guide: dict = {}
    meeting_link: Optional[str] = None
    meeting_room: Optional[str] = None


class InterviewSessionUpdate(BaseModel):
    """Request to update interview session."""
    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    preparation_notes: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_room: Optional[str] = None
    meeting_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class InterviewSessionResponse(BaseModel):
    """Response with interview session details."""
    model_config = {"from_attributes": True}
    
    id: int
    interview_id: str
    interview_type: str
    interview_mode: str
    candidate_id: int
    requisition_id: Optional[str]
    assessment_application_id: Optional[str]
    scheduled_at: datetime
    duration_minutes: int
    timezone: str
    interviewer_id: int
    additional_interviewers: List[int]
    status: str
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    actual_duration_minutes: Optional[int]
    preparation_notes: Optional[str]
    question_guide: dict
    meeting_link: Optional[str]
    meeting_room: Optional[str]
    meeting_notes: Optional[str]
    cancellation_reason: Optional[str]
    reminder_sent: bool
    created_at: datetime
    updated_at: datetime


# ============ INTERVIEW FEEDBACK SCHEMAS ============

class InterviewFeedbackCreate(BaseModel):
    """Request to submit interview feedback."""
    interview_id: str
    overall_rating: float
    recommendation: str  # strong_hire, hire, maybe, no_hire
    technical_skills_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    problem_solving_rating: Optional[float] = None
    culture_fit_rating: Optional[float] = None
    skills_evaluated: dict = {}
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    detailed_notes: Optional[str] = None
    questions_asked: List[str] = []
    requires_second_round: bool = False
    follow_up_notes: Optional[str] = None


class InterviewFeedbackResponse(BaseModel):
    """Response with interview feedback details."""
    model_config = {"from_attributes": True}
    
    id: int
    feedback_id: str
    interview_id: str
    interviewer_id: int
    overall_rating: float
    recommendation: str
    technical_skills_rating: Optional[float]
    communication_rating: Optional[float]
    problem_solving_rating: Optional[float]
    culture_fit_rating: Optional[float]
    skills_evaluated: dict
    strengths: Optional[str]
    weaknesses: Optional[str]
    detailed_notes: Optional[str]
    questions_asked: List[str]
    requires_second_round: bool
    follow_up_notes: Optional[str]
    submitted_at: datetime
    is_final: bool
    created_at: datetime


# ============ PROCTORING EVENT SCHEMAS ============

class ProctoringEventCreate(BaseModel):
    """Request to log a proctoring event."""
    test_session_id: str
    event_type: str
    severity: str  # low, medium, high, critical
    duration_seconds: Optional[int] = None
    question_id: Optional[int] = None
    snapshot_url: Optional[str] = None
    metadata: dict = {}


class ProctoringEventResponse(BaseModel):
    """Response with proctoring event details."""
    model_config = {"from_attributes": True}
    
    id: int
    event_id: str
    test_session_id: str
    event_type: str
    severity: str
    detected_at: datetime
    duration_seconds: Optional[int]
    question_id: Optional[int]
    snapshot_url: Optional[str]
    metadata: dict
    reviewed: bool
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    reviewer_notes: Optional[str]
    flagged: bool
    created_at: datetime


class ProctoringEventReview(BaseModel):
    """Request to review a proctoring event."""
    reviewer_notes: Optional[str] = None
    flagged: bool = False


# ============ NOTIFICATION SCHEMAS ============

class NotificationCreate(BaseModel):
    """Request to create a notification."""
    user_id: int
    notification_type: str  # system, assessment, interview, application, proctoring
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    action_url: Optional[str] = None
    priority: str = "normal"


class NotificationResponse(BaseModel):
    """Response with notification details."""
    model_config = {"from_attributes": True}
    
    id: int
    notification_id: str
    user_id: int
    notification_type: str
    title: str
    message: str
    related_entity_type: Optional[str]
    related_entity_id: Optional[str]
    action_url: Optional[str]
    is_read: bool
    read_at: Optional[datetime]
    is_archived: bool
    priority: str
    created_at: datetime


class NotificationMarkRead(BaseModel):
    """Request to mark notification as read."""
    is_read: bool = True


# ============ APPLICATION NOTE SCHEMAS ============

class ApplicationNoteCreate(BaseModel):
    """Request to add a note to an application."""
    application_id: str
    note_text: str
    note_type: str = "general"  # general, follow_up, red_flag
    is_private: bool = False


class ApplicationNoteResponse(BaseModel):
    """Response with application note details."""
    model_config = {"from_attributes": True}
    
    id: int
    note_id: str
    application_id: str
    author_id: int
    note_text: str
    note_type: str
    is_private: bool
    created_at: datetime
    updated_at: datetime


# ============ ADMIN ACTION SCHEMAS ============


class ApplicationStatusUpdate(BaseModel):
    status: str  # pending, in_progress, completed, shortlisted, rejected
    note: Optional[str] = None


class RequisitionStatusUpdate(BaseModel):
    status: str  # draft, open, paused, closed, filled, cancelled
    is_published: Optional[bool] = None


class BulkNotificationCreate(BaseModel):
    user_ids: Optional[List[int]] = None
    tenant_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    priority: str = "normal"


# ============ SUPERADMIN SCHEMAS ============

class AuditLogCreate(BaseModel):
    """Request to create audit log entry."""
    action: str  # create, update, delete, login, etc.
    entity_type: str
    entity_id: Optional[str] = None
    description: str
    changes: dict = {}
    severity: str = "info"


class AuditLogResponse(BaseModel):
    """Response with audit log details."""
    model_config = {"from_attributes": True}
    
    id: int
    log_id: str
    user_id: Optional[int]
    user_email: Optional[str]
    user_role: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    description: str
    changes: dict
    ip_address: Optional[str]
    user_agent: Optional[str]
    request_id: Optional[str]
    severity: str
    created_at: datetime


class TenantCreate(BaseModel):
    """Request to create a new tenant."""
    name: str
    domain: Optional[str] = None
    settings: dict = {}
    features_enabled: dict = {}
    max_users: Optional[int] = None
    max_assessments: Optional[int] = None
    max_candidates: Optional[int] = None
    subscription_tier: str = "free"
    owner_id: Optional[int] = None


class TenantUpdate(BaseModel):
    """Request to update tenant."""
    name: Optional[str] = None
    domain: Optional[str] = None
    settings: Optional[dict] = None
    features_enabled: Optional[dict] = None
    max_users: Optional[int] = None
    max_assessments: Optional[int] = None
    max_candidates: Optional[int] = None
    subscription_tier: Optional[str] = None
    is_active: Optional[bool] = None
    is_trial: Optional[bool] = None


class TenantResponse(BaseModel):
    """Response with tenant details."""
    model_config = {"from_attributes": True}
    
    id: int
    tenant_id: str
    name: str
    domain: Optional[str]
    settings: dict
    features_enabled: dict
    max_users: Optional[int]
    max_assessments: Optional[int]
    max_candidates: Optional[int]
    subscription_tier: str
    subscription_expires_at: Optional[datetime]
    is_active: bool
    is_trial: bool
    owner_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class SystemIncidentCreate(BaseModel):
    """Request to create system incident."""
    title: str
    description: str
    incident_type: str  # outage, bug, security, performance
    severity: str  # low, medium, high, critical
    affected_users: int = 0
    affected_tenants: List[str] = []
    affected_services: List[str] = []
    detected_at: datetime
    assigned_to: Optional[int] = None


class SystemIncidentUpdate(BaseModel):
    """Request to update system incident."""
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # open, investigating, resolved, closed
    assigned_to: Optional[int] = None
    resolution_notes: Optional[str] = None
    root_cause: Optional[str] = None
    resolved_at: Optional[datetime] = None


class SystemIncidentResponse(BaseModel):
    """Response with system incident details."""
    model_config = {"from_attributes": True}
    
    id: int
    incident_id: str
    title: str
    description: str
    incident_type: str
    severity: str
    status: str
    affected_users: int
    affected_tenants: List[str]
    affected_services: List[str]
    detected_at: datetime
    resolved_at: Optional[datetime]
    assigned_to: Optional[int]
    reported_by: Optional[int]
    resolution_notes: Optional[str]
    root_cause: Optional[str]
    error_logs: dict
    metrics: dict
    created_at: datetime
    updated_at: datetime


class SystemMetricCreate(BaseModel):
    """Request to record system metric."""
    metric_name: str
    metric_type: str  # gauge, counter, histogram
    value: float
    unit: str  # percent, ms, count, bytes
    service: Optional[str] = None
    tenant_id: Optional[str] = None
    measured_at: datetime
    tags: dict = {}


class SystemMetricResponse(BaseModel):
    """Response with system metric details."""
    model_config = {"from_attributes": True}
    
    id: int
    metric_id: str
    metric_name: str
    metric_type: str
    value: float
    unit: str
    service: Optional[str]
    tenant_id: Optional[str]
    measured_at: datetime
    tags: dict
    created_at: datetime


class FeatureFlagCreate(BaseModel):
    """Request to create feature flag."""
    name: str
    description: str
    is_enabled: bool = False
    rollout_percentage: int = 0
    allowed_tenants: List[str] = []
    allowed_users: List[int] = []
    config: dict = {}


class FeatureFlagUpdate(BaseModel):
    """Request to update feature flag."""
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    rollout_percentage: Optional[int] = None
    allowed_tenants: Optional[List[str]] = None
    allowed_users: Optional[List[int]] = None
    config: Optional[dict] = None


class FeatureFlagResponse(BaseModel):
    """Response with feature flag details."""
    model_config = {"from_attributes": True}
    
    id: int
    flag_id: str
    name: str
    description: str
    is_enabled: bool
    rollout_percentage: int
    allowed_tenants: List[str]
    allowed_users: List[int]
    config: dict
    created_by: Optional[int]
    created_at: datetime
    updated_at: datetime

