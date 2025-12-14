"""Add extended workflow models for recruiter/interviewer

Revision ID: 009_extended_workflows
Revises: 008_add_skillmatch_model
Create Date: 2025-12-14

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '009_extended_workflows'
down_revision = '008_add_skillmatch_model'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create new tables for extended workflow models."""
    
    # Create job_requisitions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS job_requisitions (
            id SERIAL PRIMARY KEY,
            requisition_id VARCHAR(100) NOT NULL UNIQUE,
            title VARCHAR(500) NOT NULL,
            description TEXT NOT NULL,
            department VARCHAR(100),
            location VARCHAR(255),
            employment_type VARCHAR(50) NOT NULL,
            required_skills JSON DEFAULT '{}',
            experience_level VARCHAR(50) NOT NULL,
            min_experience_years INTEGER,
            max_experience_years INTEGER,
            min_salary FLOAT,
            max_salary FLOAT,
            currency VARCHAR(10) DEFAULT 'USD',
            positions_available INTEGER DEFAULT 1 NOT NULL,
            positions_filled INTEGER DEFAULT 0 NOT NULL,
            status VARCHAR(50) DEFAULT 'draft' NOT NULL,
            is_published BOOLEAN DEFAULT false NOT NULL,
            published_at TIMESTAMP WITH TIME ZONE,
            closes_at TIMESTAMP WITH TIME ZONE,
            jd_id VARCHAR(100) REFERENCES job_descriptions(jd_id),
            assessment_id VARCHAR(100),
            created_by INTEGER NOT NULL REFERENCES users(id),
            hiring_manager_id INTEGER REFERENCES users(id),
            total_applicants INTEGER DEFAULT 0 NOT NULL,
            total_interviewed INTEGER DEFAULT 0 NOT NULL,
            total_hired INTEGER DEFAULT 0 NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_requisitions_requisition_id ON job_requisitions(requisition_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_requisitions_title ON job_requisitions(title)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_requisitions_status_published ON job_requisitions(status, is_published)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_job_requisitions_created_by ON job_requisitions(created_by)")
    
    # Create interview_sessions table
    op.execute("""
        CREATE TABLE IF NOT EXISTS interview_sessions (
            id SERIAL PRIMARY KEY,
            interview_id VARCHAR(100) NOT NULL UNIQUE,
            interview_type VARCHAR(50) NOT NULL,
            interview_mode VARCHAR(50) NOT NULL,
            candidate_id INTEGER NOT NULL REFERENCES candidates(id),
            requisition_id VARCHAR(100) REFERENCES job_requisitions(requisition_id),
            assessment_application_id VARCHAR(100) REFERENCES assessment_applications(application_id),
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            duration_minutes INTEGER DEFAULT 60 NOT NULL,
            timezone VARCHAR(50) DEFAULT 'UTC' NOT NULL,
            interviewer_id INTEGER NOT NULL REFERENCES users(id),
            additional_interviewers JSON DEFAULT '[]',
            status VARCHAR(50) DEFAULT 'scheduled' NOT NULL,
            started_at TIMESTAMP WITH TIME ZONE,
            ended_at TIMESTAMP WITH TIME ZONE,
            actual_duration_minutes INTEGER,
            preparation_notes TEXT,
            question_guide JSON DEFAULT '{}',
            meeting_link VARCHAR(500),
            meeting_room VARCHAR(100),
            meeting_notes TEXT,
            cancellation_reason TEXT,
            reminder_sent BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_sessions_interview_id ON interview_sessions(interview_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_sessions_candidate_id ON interview_sessions(candidate_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_sessions_interviewer_id ON interview_sessions(interviewer_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_sessions_scheduled_at ON interview_sessions(scheduled_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_sessions_status ON interview_sessions(status)")
    
    # Create interview_feedback table
    op.execute("""
        CREATE TABLE IF NOT EXISTS interview_feedback (
            id SERIAL PRIMARY KEY,
            feedback_id VARCHAR(100) NOT NULL UNIQUE,
            interview_id VARCHAR(100) NOT NULL UNIQUE REFERENCES interview_sessions(interview_id),
            interviewer_id INTEGER NOT NULL REFERENCES users(id),
            overall_rating FLOAT NOT NULL,
            recommendation VARCHAR(50) NOT NULL,
            technical_skills_rating FLOAT,
            communication_rating FLOAT,
            problem_solving_rating FLOAT,
            culture_fit_rating FLOAT,
            skills_evaluated JSON DEFAULT '{}',
            strengths TEXT,
            weaknesses TEXT,
            detailed_notes TEXT,
            questions_asked JSON DEFAULT '[]',
            requires_second_round BOOLEAN DEFAULT false NOT NULL,
            follow_up_notes TEXT,
            submitted_at TIMESTAMP WITH TIME ZONE NOT NULL,
            is_final BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_feedback_feedback_id ON interview_feedback(feedback_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_feedback_interview_id ON interview_feedback(interview_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_interview_feedback_recommendation ON interview_feedback(recommendation)")
    
    # Create proctoring_events table
    op.execute("""
        CREATE TABLE IF NOT EXISTS proctoring_events (
            id SERIAL PRIMARY KEY,
            event_id VARCHAR(100) NOT NULL UNIQUE,
            test_session_id VARCHAR(100) NOT NULL REFERENCES test_sessions(session_id),
            event_type VARCHAR(100) NOT NULL,
            severity VARCHAR(50) DEFAULT 'medium' NOT NULL,
            detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
            duration_seconds INTEGER,
            question_id INTEGER,
            snapshot_url VARCHAR(500),
            metadata JSON DEFAULT '{}',
            reviewed BOOLEAN DEFAULT false NOT NULL,
            reviewed_by INTEGER REFERENCES users(id),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            reviewer_notes TEXT,
            flagged BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_event_id ON proctoring_events(event_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_test_session_id ON proctoring_events(test_session_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_event_type ON proctoring_events(event_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_session_severity ON proctoring_events(test_session_id, severity)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_detected_at ON proctoring_events(detected_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_proctoring_events_reviewed ON proctoring_events(reviewed)")
    
    # Create notifications table
    op.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            notification_id VARCHAR(100) NOT NULL UNIQUE,
            user_id INTEGER NOT NULL REFERENCES users(id),
            notification_type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            related_entity_type VARCHAR(50),
            related_entity_id VARCHAR(100),
            action_url VARCHAR(500),
            is_read BOOLEAN DEFAULT false NOT NULL,
            read_at TIMESTAMP WITH TIME ZONE,
            is_archived BOOLEAN DEFAULT false NOT NULL,
            priority VARCHAR(20) DEFAULT 'normal' NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_notification_id ON notifications(notification_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_notification_type ON notifications(notification_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_read ON notifications(user_id, is_read)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications(created_at)")
    
    # Create application_notes table
    op.execute("""
        CREATE TABLE IF NOT EXISTS application_notes (
            id SERIAL PRIMARY KEY,
            note_id VARCHAR(100) NOT NULL UNIQUE,
            application_id VARCHAR(100) NOT NULL REFERENCES assessment_applications(application_id),
            author_id INTEGER NOT NULL REFERENCES users(id),
            note_text TEXT NOT NULL,
            note_type VARCHAR(50) DEFAULT 'general' NOT NULL,
            is_private BOOLEAN DEFAULT false NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)
    
    op.execute("CREATE INDEX IF NOT EXISTS ix_application_notes_note_id ON application_notes(note_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_application_notes_application_id ON application_notes(application_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_application_notes_author_id ON application_notes(author_id)")


def downgrade() -> None:
    """Drop extended workflow tables."""
    op.execute("DROP TABLE IF EXISTS application_notes CASCADE")
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
    op.execute("DROP TABLE IF EXISTS proctoring_events CASCADE")
    op.execute("DROP TABLE IF EXISTS interview_feedback CASCADE")
    op.execute("DROP TABLE IF EXISTS interview_sessions CASCADE")
    op.execute("DROP TABLE IF EXISTS job_requisitions CASCADE")
