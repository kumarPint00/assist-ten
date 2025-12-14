"""Database models for the application."""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON, 
    Float, ForeignKey, Index, UniqueConstraint, Enum
)
import enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
import uuid


class User(Base, TimestampMixin):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(50), default="user", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Streak tracking
    login_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    login_streak_last_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    login_streak_max: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    quiz_streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quiz_streak_last_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    quiz_streak_max: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    test_sessions: Mapped[list["TestSession"]] = relationship(
        "TestSession", back_populates="user", cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )
    admin_settings: Mapped[Optional["AdminSettings"]] = relationship(
        "AdminSettings", back_populates="user", uselist=False
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"


class RefreshToken(Base, TimestampMixin):
    """Refresh token model for JWT authentication."""
    
    __tablename__ = "refresh_tokens"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
    
    __table_args__ = (
        Index("ix_refresh_tokens_user_id_expires_at", "user_id", "expires_at"),
    )
    
    def __repr__(self) -> str:
        return f"<RefreshToken(id={self.id}, user_id={self.user_id})>"


class JobDescription(Base, TimestampMixin):
    """Job description model for storing uploaded JDs."""
    
    __tablename__ = "job_descriptions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    jd_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"jd_{uuid.uuid4().hex[:12]}"
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    # S3 storage info
    s3_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Uploaded by
    uploaded_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="job_description", cascade="all, delete-orphan"
    )
    test_sessions: Mapped[list["TestSession"]] = relationship(
        "TestSession", back_populates="job_description", cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<JobDescription(id={self.id}, jd_id='{self.jd_id}', title='{self.title}')>"


class QuestionSet(Base, TimestampMixin):
    """Question set model for storing generated question sets."""
    
    __tablename__ = "question_sets"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_set_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"qs_{uuid.uuid4().hex[:12]}"
    )
    skill: Mapped[str] = mapped_column(String(255), nullable=False, index=True)  # Topic/skill name
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # beginner, intermediate, expert
    
    # Metadata
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    generation_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Relationships
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="question_set", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_question_sets_skill_level", "skill", "level"),
    )
    
    def __repr__(self) -> str:
        return f"<QuestionSet(id={self.id}, question_set_id='{self.question_set_id}', skill='{self.skill}', level='{self.level}')>"


class Question(Base, TimestampMixin):
    """MCQ question model."""
    
    __tablename__ = "questions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Link to either QuestionSet OR JobDescription
    question_set_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("question_sets.question_set_id"), nullable=True, index=True
    )
    jd_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("job_descriptions.jd_id"), nullable=True, index=True
    )
    
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[dict] = mapped_column(JSON, nullable=False)  # {"A": "text", "B": "text", ...}
    correct_answer: Mapped[str] = mapped_column(String(10), nullable=False)  # "A", "B", "C", "D"
    difficulty: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # easy, medium, hard
    topic: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Generation metadata
    generation_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    generation_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Relationships
    question_set: Mapped[Optional["QuestionSet"]] = relationship("QuestionSet", back_populates="questions")
    job_description: Mapped[Optional["JobDescription"]] = relationship("JobDescription", back_populates="questions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="question", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_questions_jd_id_created_at", "jd_id", "created_at"),
        Index("ix_questions_question_set_id", "question_set_id", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<Question(id={self.id}, question_set_id='{self.question_set_id}', jd_id='{self.jd_id}')>"


class TestSession(Base, TimestampMixin):
    """Test session model for tracking candidate tests."""
    
    __tablename__ = "test_sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"session_{uuid.uuid4().hex}"
    )
    
    # Link to either QuestionSet OR JobDescription
    question_set_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("question_sets.question_set_id"), nullable=True, index=True
    )
    jd_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("job_descriptions.jd_id"), nullable=True, index=True
    )
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Session details
    candidate_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    candidate_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_scored: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    score_released_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Results
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    correct_answers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    score_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Metadata
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    question_set: Mapped[Optional["QuestionSet"]] = relationship("QuestionSet")
    job_description: Mapped[Optional["JobDescription"]] = relationship("JobDescription", back_populates="test_sessions")
    user: Mapped[Optional["User"]] = relationship("User", back_populates="test_sessions")
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="test_session", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_test_sessions_jd_id_created_at", "jd_id", "created_at"),
        Index("ix_test_sessions_user_id_created_at", "user_id", "created_at"),
        Index("ix_test_sessions_question_set_id_created_at", "question_set_id", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<TestSession(id={self.id}, session_id='{self.session_id}')>"


class Answer(Base, TimestampMixin):
    """Answer model for storing candidate responses."""
    
    __tablename__ = "answers"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("test_sessions.session_id"), nullable=False, index=True
    )
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer: Mapped[str] = mapped_column(String(10), nullable=False)  # "A", "B", "C", "D"
    is_correct: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    time_taken_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Relationships
    test_session: Mapped["TestSession"] = relationship("TestSession", back_populates="answers")
    question: Mapped["Question"] = relationship("Question", back_populates="answers")
    
    __table_args__ = (
        UniqueConstraint("session_id", "question_id", name="uq_answer_session_question"),
        Index("ix_answers_session_id_created_at", "session_id", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<Answer(id={self.id}, session_id='{self.session_id}', question_id={self.question_id})>"


class CeleryTask(Base, TimestampMixin):
    """Track Celery async tasks."""
    
    __tablename__ = "celery_tasks"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    task_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    task_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # PENDING, STARTED, SUCCESS, FAILURE
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Related entity
    related_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # jd, session, etc.
    related_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # User who triggered
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    __table_args__ = (
        Index("ix_celery_tasks_status_created_at", "status", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<CeleryTask(id={self.id}, task_id='{self.task_id}', status='{self.status}')>"


class Candidate(Base, TimestampMixin):
    """Candidate profile model for assessment applicants."""
    
    __tablename__ = "candidates"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"cand_{uuid.uuid4().hex[:12]}"
    )
    
    # User link (optional - can be anonymous candidate)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Profile information
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    
    # Professional information
    current_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Current job title
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # City, Country
    education: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Highest education
    
    # Social/Professional links
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    github_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Experience and skills
    experience_years: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # e.g., "5 years"
    experience_level: Mapped[str] = mapped_column(String(50), nullable=False)  # junior, mid, senior, etc.
    skills: Mapped[dict] = mapped_column(JSON, nullable=False, default={})  # {skill_name: proficiency_level}
    availability_percentage: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # 0-100
    
    # File storage references
    jd_file_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Reference to uploaded JD
    cv_file_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Reference to uploaded CV
    portfolio_file_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Reference to portfolio
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    assessment_applications: Mapped[list["AssessmentApplication"]] = relationship(
        "AssessmentApplication", back_populates="candidate", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_candidates_email", "email"),
        Index("ix_candidates_user_id", "user_id"),
    )
    
    def __repr__(self) -> str:
        return f"<Candidate(id={self.id}, candidate_id='{self.candidate_id}', email='{self.email}')>"


class Assessment(Base, TimestampMixin):
    """Assessment configuration model for admin-created assessments."""
    
    __tablename__ = "assessments"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assessment_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"assess_{uuid.uuid4().hex[:12]}"
    )
    
    # Assessment metadata
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    job_title: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Extracted from JD or admin-defined
    jd_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("job_descriptions.jd_id"), nullable=True
    )
    required_skills: Mapped[dict] = mapped_column(JSON, nullable=False, default={})  # {skill: min_proficiency}
    required_roles: Mapped[list] = mapped_column(JSON, nullable=False, default=[])
    
    # Question set link
    question_set_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("question_sets.question_set_id"), nullable=True
    )
    
    # Assessment settings
    assessment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # questionnaire, interview
    duration_minutes: Mapped[int] = mapped_column(Integer, default=30, nullable=False)
    is_questionnaire_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_interview_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    @property
    def is_expired(self) -> bool:
        """Check if assessment has expired."""
        if self.expires_at is None:
            return False
        from datetime import timezone
        now = datetime.now(timezone.utc)
        expires = self.expires_at if self.expires_at.tzinfo else self.expires_at.replace(tzinfo=timezone.utc)
        return expires < now
    
    # Admin who created
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    applications: Mapped[list["AssessmentApplication"]] = relationship(
        "AssessmentApplication", back_populates="assessment", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_assessments_title", "title"),
        Index("ix_assessments_is_published", "is_published"),
    )
    
    def __repr__(self) -> str:
        return f"<Assessment(id={self.id}, assessment_id='{self.assessment_id}', title='{self.title}')>"


class AssessmentApplication(Base, TimestampMixin):
    """Track candidate applications to assessments."""
    
    __tablename__ = "assessment_applications"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    application_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"app_{uuid.uuid4().hex[:12]}"
    )
    
    # Candidate and assessment link
    candidate_id: Mapped[int] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=False)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id"), nullable=False)
    
    # Test session link (if started)
    test_session_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("test_sessions.session_id"), nullable=True
    )
    
    # Application status
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # pending, in_progress, completed, shortlisted, rejected
    applied_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Submitted form data
    candidate_availability: Mapped[int] = mapped_column(Integer, nullable=False)  # 0-100
    submitted_skills: Mapped[dict] = mapped_column(JSON, nullable=False)  # candidate's self-assessed skills
    role_applied_for: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="assessment_applications")
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="applications")
    test_session: Mapped[Optional["TestSession"]] = relationship("TestSession")
    
    __table_args__ = (
        UniqueConstraint("candidate_id", "assessment_id", name="uq_candidate_assessment"),
        Index("ix_assessment_applications_status", "status"),
        Index("ix_assessment_applications_created_at", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<AssessmentApplication(id={self.id}, application_id='{self.application_id}', status='{self.status}')>"


class UploadedDocument(Base, TimestampMixin):
    """Track all uploaded documents from candidates."""
    
    __tablename__ = "uploaded_documents"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    file_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"file_{uuid.uuid4().hex[:12]}"
    )
    
    # Uploader info
    candidate_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # File information
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)  # jd, cv, portfolio, requirements, specifications
    document_category: Mapped[str] = mapped_column(String(50), nullable=False)  # jd, cv, portfolio, requirements, specifications
    
    # S3 storage
    s3_key: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Extracted content
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extraction_preview: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Metadata
    is_encrypted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    encryption_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # AES-256, etc.
    
    # Relationships
    candidate: Mapped[Optional["Candidate"]] = relationship("Candidate")
    user: Mapped[Optional["User"]] = relationship("User")
    
    __table_args__ = (
        Index("ix_uploaded_documents_candidate_id", "candidate_id"),
        Index("ix_uploaded_documents_document_type", "document_category"),
    )
    
    def __repr__(self) -> str:
        return f"<UploadedDocument(id={self.id}, file_id='{self.file_id}', doc_type='{self.document_category}')>"


class SkillMatch(Base, TimestampMixin):
    """Store skill match runs performed by admins for auditing and history."""

    __tablename__ = "skill_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    match_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False, default=lambda: f"skillmatch_{uuid.uuid4().hex[:12]}")
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    jd_file_id: Mapped[int] = mapped_column(Integer, ForeignKey("uploaded_documents.id"), nullable=True)
    cv_file_id: Mapped[int] = mapped_column(Integer, ForeignKey("uploaded_documents.id"), nullable=True)
    match_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    matched_skills: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    missing_skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    extra_skills: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    summary: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    llm_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    jd_file: Mapped[Optional["UploadedDocument"]] = relationship("UploadedDocument", foreign_keys=[jd_file_id])
    cv_file: Mapped[Optional["UploadedDocument"]] = relationship("UploadedDocument", foreign_keys=[cv_file_id])

    __table_args__ = (
        Index("ix_skill_matches_user_id", "user_id"),
        Index("ix_skill_matches_created_at", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<SkillMatch(id={self.id}, match_id='{self.match_id}', score={self.match_score})>"


class AssessmentToken(Base, TimestampMixin):
    """Assessment access token for candidate invitation links."""

    __tablename__ = "assessment_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    token: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id"), nullable=False)
    candidate_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    assessment: Mapped["Assessment"] = relationship("Assessment")
    created_by_user: Mapped[Optional["User"]] = relationship("User")

    __table_args__ = (
        Index("ix_assessment_tokens_token", "token"),
        Index("ix_assessment_tokens_email", "candidate_email"),
    )

    def __repr__(self) -> str:
        return f"<AssessmentToken(id={self.id}, token='{self.token[:10]}...', assessment_id={self.assessment_id}, candidate_email='{self.candidate_email}')>"


class Skill(Base, TimestampMixin):
    """Master list of available skills for the platform."""
    
    __tablename__ = "skills"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    skill_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"skill_{uuid.uuid4().hex[:12]}"
    )
    
    # Skill info
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # technical, soft, language, etc.
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index("ix_skills_category", "category"),
    )
    
    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}', category='{self.category}')>"


class Role(Base, TimestampMixin):
    """Master list of available job roles."""
    
    __tablename__ = "roles"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    role_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"role_{uuid.uuid4().hex[:12]}"
    )
    
    # Role info
    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Associated skills (as JSON for flexibility)
    required_skills: Mapped[dict] = mapped_column(JSON, nullable=False, default={})  # {skill_name: required_level}
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}', department='{self.department}')>"


class ExtractionLog(Base, TimestampMixin):
    """Log of LLM extractions for auditing and debugging."""
    
    __tablename__ = "extraction_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True, nullable=True)
    
    # Extraction details
    extraction_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)  # "cv_llm", "jd_llm"
    input_length: Mapped[int] = mapped_column(Integer, nullable=False)
    output_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # "success", "failed"
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Provider info
    provider: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "openai", "anthropic"
    
    __table_args__ = (
        Index("ix_extraction_logs_user", "user_id"),
        Index("ix_extraction_logs_type", "extraction_type"),
        Index("ix_extraction_logs_created", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<ExtractionLog(id={self.id}, type='{self.extraction_type}', status='{self.status}')>"


class AdminSettings(Base, TimestampMixin):
    """Admin settings model for storing user-specific admin configurations."""
    
    __tablename__ = "admin_settings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Store settings as JSON for flexibility
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="admin_settings")
    
    def __repr__(self) -> str:
        return f"<AdminSettings(id={self.id}, user_id={self.user_id})>"


# ============ EXTENDED / RECRUITER / INTERVIEWER / SUPERADMIN MODELS ==========


class JobRequisitionStatus(str, enum.Enum):
    """Job requisition status enum."""
    DRAFT = "draft"
    OPEN = "open"
    PAUSED = "paused"
    CLOSED = "closed"
    FILLED = "filled"
    CANCELLED = "cancelled"


class InterviewStatus(str, enum.Enum):
    """Interview session status enum."""
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"


class ProctoringIncidentSeverity(str, enum.Enum):
    """Proctoring incident severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class NotificationType(str, enum.Enum):
    """Notification type enum."""
    SYSTEM = "system"
    ASSESSMENT = "assessment"
    INTERVIEW = "interview"
    APPLICATION = "application"
    PROCTORING = "proctoring"


class JobRequisition(Base, TimestampMixin):
    """Job requisition/posting model for recruiter workflow."""
    
    __tablename__ = "job_requisitions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    requisition_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"req_{uuid.uuid4().hex[:12]}"
    )
    
    # Job details
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # full-time, part-time, contract
    
    # Requirements
    required_skills: Mapped[dict] = mapped_column(JSON, nullable=False, default={})
    experience_level: Mapped[str] = mapped_column(String(50), nullable=False)  # junior, mid, senior, lead
    min_experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_experience_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Salary range (optional)
    min_salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    max_salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String(10), nullable=True, default="USD")
    
    # Hiring details
    positions_available: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    positions_filled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Status and visibility
    status: Mapped[JobRequisitionStatus] = mapped_column(
        Enum(JobRequisitionStatus, native_enum=False, length=50),
        default=JobRequisitionStatus.DRAFT,
        nullable=False,
        index=True
    )
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    closes_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Links
    jd_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("job_descriptions.jd_id"), nullable=True
    )
    assessment_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("assessments.assessment_id"), nullable=True
    )
    
    # Owner
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    hiring_manager_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata
    total_applicants: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_interviewed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_hired: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Relationships
    creator: Mapped["User"] = relationship("User", foreign_keys=[created_by])
    hiring_manager: Mapped[Optional["User"]] = relationship("User", foreign_keys=[hiring_manager_id])
    interviews: Mapped[list["InterviewSession"]] = relationship(
        "InterviewSession", back_populates="job_requisition", cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_job_requisitions_status_published", "status", "is_published"),
        Index("ix_job_requisitions_created_by", "created_by"),
    )
    
    def __repr__(self) -> str:
        return f"<JobRequisition(id={self.id}, requisition_id='{self.requisition_id}', title='{self.title}')>"


class InterviewSession(Base, TimestampMixin):
    """Interview session model for interviewer workflow."""
    
    __tablename__ = "interview_sessions"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    interview_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"int_{uuid.uuid4().hex[:12]}"
    )
    
    # Interview details
    interview_type: Mapped[str] = mapped_column(String(50), nullable=False)  # technical, behavioral, cultural, panel
    interview_mode: Mapped[str] = mapped_column(String(50), nullable=False)  # video, phone, in-person, ai
    
    # Links
    candidate_id: Mapped[int] = mapped_column(Integer, ForeignKey("candidates.id"), nullable=False)
    requisition_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("job_requisitions.requisition_id"), nullable=True
    )
    assessment_application_id: Mapped[Optional[str]] = mapped_column(
        String(100), ForeignKey("assessment_applications.application_id"), nullable=True
    )
    
    # Scheduling
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    
    # Participants
    interviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    additional_interviewers: Mapped[list] = mapped_column(JSON, default=[], nullable=False)  # [user_ids]
    
    # Session tracking
    status: Mapped[InterviewStatus] = mapped_column(
        Enum(InterviewStatus, native_enum=False, length=50),
        default=InterviewStatus.SCHEDULED,
        nullable=False,
        index=True
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Interview content
    preparation_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # Pre-interview notes
    question_guide: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)  # Suggested questions
    
    # Meeting info
    meeting_link: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    meeting_room: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    meeting_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    cancellation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    candidate: Mapped["Candidate"] = relationship("Candidate")
    interviewer: Mapped["User"] = relationship("User", foreign_keys=[interviewer_id])
    job_requisition: Mapped[Optional["JobRequisition"]] = relationship("JobRequisition", back_populates="interviews")
    feedback: Mapped[Optional["InterviewFeedback"]] = relationship(
        "InterviewFeedback", back_populates="interview", uselist=False, cascade="all, delete-orphan"
    )
    
    __table_args__ = (
        Index("ix_interview_sessions_candidate_id", "candidate_id"),
        Index("ix_interview_sessions_interviewer_id", "interviewer_id"),
        Index("ix_interview_sessions_scheduled_at", "scheduled_at"),
        Index("ix_interview_sessions_status", "status"),
    )
    
    def __repr__(self) -> str:
        return f"<InterviewSession(id={self.id}, interview_id='{self.interview_id}', status='{self.status}')>"


class InterviewFeedback(Base, TimestampMixin):
    """Interview feedback and evaluation model."""
    
    __tablename__ = "interview_feedback"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    feedback_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"fb_{uuid.uuid4().hex[:12]}"
    )
    
    # Links
    interview_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("interview_sessions.interview_id"), unique=True, nullable=False
    )
    interviewer_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Overall evaluation
    overall_rating: Mapped[float] = mapped_column(Float, nullable=False)  # 1-5 or 1-10 scale
    recommendation: Mapped[str] = mapped_column(String(50), nullable=False)  # strong_hire, hire, maybe, no_hire
    
    # Detailed ratings
    technical_skills_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    communication_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    problem_solving_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    culture_fit_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Skill assessments
    skills_evaluated: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)  # {skill: rating}
    
    # Textual feedback
    strengths: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    weaknesses: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detailed_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    questions_asked: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    
    # Follow-up
    requires_second_round: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    follow_up_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Relationships
    interview: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="feedback")
    interviewer: Mapped["User"] = relationship("User")
    
    __table_args__ = (
        Index("ix_interview_feedback_interview_id", "interview_id"),
        Index("ix_interview_feedback_recommendation", "recommendation"),
    )
    
    def __repr__(self) -> str:
        return f"<InterviewFeedback(id={self.id}, interview_id='{self.interview_id}', rating={self.overall_rating})>"


class ProctoringEvent(Base, TimestampMixin):
    """Detailed proctoring incident tracking."""
    
    __tablename__ = "proctoring_events"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"proc_{uuid.uuid4().hex[:12]}"
    )
    
    # Session link
    test_session_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("test_sessions.session_id"), nullable=False, index=True
    )
    
    # Event details
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # multiple_faces, no_face, tab_switch, window_blur, etc.
    severity: Mapped[ProctoringIncidentSeverity] = mapped_column(
        Enum(ProctoringIncidentSeverity, native_enum=False, length=50),
        default=ProctoringIncidentSeverity.MEDIUM,
        nullable=False,
        index=True
    )
    
    # Timestamp
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Context
    question_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    snapshot_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # S3 URL for captured image
    metadata: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)  # Additional context
    
    # Review
    reviewed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    test_session: Mapped["TestSession"] = relationship("TestSession")
    reviewer: Mapped[Optional["User"]] = relationship("User")
    
    __table_args__ = (
        Index("ix_proctoring_events_session_severity", "test_session_id", "severity"),
        Index("ix_proctoring_events_detected_at", "detected_at"),
        Index("ix_proctoring_events_reviewed", "reviewed"),
    )
    
    def __repr__(self) -> str:
        return f"<ProctoringEvent(id={self.id}, event_type='{self.event_type}', severity='{self.severity}')>"


class Notification(Base, TimestampMixin):
    """System notifications for all user roles."""
    
    __tablename__ = "notifications"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    notification_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"notif_{uuid.uuid4().hex[:12]}"
    )
    
    # Recipient
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification content
    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, native_enum=False, length=50),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Context
    related_entity_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # interview, assessment, etc.
    related_entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    action_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # Deep link
    
    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Priority
    priority: Mapped[str] = mapped_column(String(20), default="normal", nullable=False)  # low, normal, high, urgent
    
    # Relationships
    user: Mapped["User"] = relationship("User")
    
    __table_args__ = (
        Index("ix_notifications_user_read", "user_id", "is_read"),
        Index("ix_notifications_created_at", "created_at"),
    )
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, user_id={self.user_id}, type='{self.notification_type}')>"


class ApplicationNote(Base, TimestampMixin):
    """Notes/comments on candidate applications for recruiter workflow."""
    
    __tablename__ = "application_notes"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    note_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"note_{uuid.uuid4().hex[:12]}"
    )
    
    # Links
    application_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("assessment_applications.application_id"), nullable=False, index=True
    )
    
    # Note details
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    note_type: Mapped[str] = mapped_column(String(50), default="general", nullable=False)  # general, follow_up, red_flag
    
    # Visibility
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Relationships
    author: Mapped["User"] = relationship("User")
    application: Mapped["AssessmentApplication"] = relationship("AssessmentApplication")
    
    __table_args__ = (
        Index("ix_application_notes_application_id", "application_id"),
        Index("ix_application_notes_author_id", "author_id"),
    )
    
    def __repr__(self) -> str:
        return f"<ApplicationNote(id={self.id}, application_id='{self.application_id}')>"


# ============ SUPERADMIN MODELS ===========


class AuditLogAction(str, enum.Enum):
    """Audit log action types."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    ROLE_CHANGE = "role_change"
    SETTINGS_CHANGE = "settings_change"
    PUBLISH = "publish"
    INVITE = "invite"


class AuditLog(Base, TimestampMixin):
    """Comprehensive audit log for superadmin monitoring."""
    
    __tablename__ = "audit_logs"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    log_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"audit_{uuid.uuid4().hex[:12]}"
    )
    
    # Actor (who performed the action)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Denormalized for deleted users
    user_role: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Action details
    action: Mapped[AuditLogAction] = mapped_column(
        Enum(AuditLogAction, native_enum=False, length=50),
        nullable=False,
        index=True
    )
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # user, assessment, requisition, etc.
    entity_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    # Change details
    description: Mapped[str] = mapped_column(Text, nullable=False)
    changes: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)  # {"field": {"old": "...", "new": "..."}}
    
    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    
    # Severity
    severity: Mapped[str] = mapped_column(String(20), default="info", nullable=False)  # info, warning, critical
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship("User")
    
    __table_args__ = (
        Index("ix_audit_logs_created_at", "created_at"),
        Index("ix_audit_logs_user_action", "user_id", "action"),
        Index("ix_audit_logs_entity", "entity_type", "entity_id"),
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action='{self.action}', entity='{self.entity_type}')>"


class Tenant(Base, TimestampMixin):
    """Multi-tenant organization support for superadmin."""
    
    __tablename__ = "tenants"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tenant_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"tenant_{uuid.uuid4().hex[:12]}"
    )
    
    # Organization details
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    
    # Settings
    settings: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    features_enabled: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)  # Feature flags
    
    # Limits
    max_users: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_assessments: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_candidates: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Billing
    subscription_tier: Mapped[str] = mapped_column(String(50), default="free", nullable=False)  # free, basic, pro, enterprise
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_trial: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Admin
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    owner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[owner_id])
    
    __table_args__ = (
        Index("ix_tenants_name", "name"),
        Index("ix_tenants_is_active", "is_active"),
    )
    
    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}', tier='{self.subscription_tier}')>"


class SystemIncident(Base, TimestampMixin):
    """System incidents and issues tracking for superadmin."""
    
    __tablename__ = "system_incidents"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"incident_{uuid.uuid4().hex[:12]}"
    )
    
    # Incident details
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    incident_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # outage, bug, security, performance
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # low, medium, high, critical
    
    # Status
    status: Mapped[str] = mapped_column(String(50), default="open", nullable=False, index=True)  # open, investigating, resolved, closed
    
    # Affected entities
    affected_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    affected_tenants: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    affected_services: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    
    # Timeline
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Assignment
    assigned_to: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    reported_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Resolution
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    root_cause: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    error_logs: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    metrics: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    
    # Relationships
    assignee: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_to])
    reporter: Mapped[Optional["User"]] = relationship("User", foreign_keys=[reported_by])
    
    __table_args__ = (
        Index("ix_system_incidents_severity_status", "severity", "status"),
        Index("ix_system_incidents_detected_at", "detected_at"),
    )
    
    def __repr__(self) -> str:
        return f"<SystemIncident(id={self.id}, title='{self.title}', severity='{self.severity}')>"


class SystemMetric(Base, TimestampMixin):
    """System performance and usage metrics for superadmin monitoring."""
    
    __tablename__ = "system_metrics"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    metric_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"metric_{uuid.uuid4().hex[:12]}"
    )
    
    # Metric details
    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # cpu_usage, memory_usage, api_latency, etc.
    metric_type: Mapped[str] = mapped_column(String(50), nullable=False)  # gauge, counter, histogram
    
    # Value
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # percent, ms, count, bytes, etc.
    
    # Context
    service: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)  # api, db, redis, etc.
    tenant_id: Mapped[Optional[str]] = mapped_column(String(100), ForeignKey("tenants.tenant_id"), nullable=True, index=True)
    
    # Timestamp (separate from created_at for precise metric time)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    
    # Tags/Labels
    tags: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    
    # Relationships
    tenant: Mapped[Optional["Tenant"]] = relationship("Tenant")
    
    __table_args__ = (
        Index("ix_system_metrics_name_measured", "metric_name", "measured_at"),
        Index("ix_system_metrics_service_measured", "service", "measured_at"),
    )
    
    def __repr__(self) -> str:
        return f"<SystemMetric(id={self.id}, name='{self.metric_name}', value={self.value})>"


class FeatureFlag(Base, TimestampMixin):
    """Feature flags for A/B testing and gradual rollouts."""
    
    __tablename__ = "feature_flags"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    flag_id: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False,
        default=lambda: f"flag_{uuid.uuid4().hex[:12]}"
    )
    
    # Flag details
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Status
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    
    # Targeting
    rollout_percentage: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100
    allowed_tenants: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    allowed_users: Mapped[list] = mapped_column(JSON, default=[], nullable=False)
    
    # Configuration
    config: Mapped[dict] = mapped_column(JSON, default={}, nullable=False)
    
    # Management
    created_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    creator: Mapped[Optional["User"]] = relationship("User")
    
    def __repr__(self) -> str:
        return f"<FeatureFlag(id={self.id}, name='{self.name}', enabled={self.is_enabled})>"
