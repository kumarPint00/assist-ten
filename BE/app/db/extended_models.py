"""Extended database models for recruiter/interviewer workflows."""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Integer, Boolean, DateTime, Text, JSON, 
    Float, ForeignKey, Index, UniqueConstraint, Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin
import uuid
import enum


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
