"""Add candidate_notes table and assigned_recruiter_id column

Revision ID: 010_candidate_notes_assignment
Revises: 009_extended_workflows
Create Date: 2025-12-14

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '010_candidate_notes_assignment'
down_revision = '009_extended_workflows'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add assigned_recruiter_id column to candidates
    op.execute("ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_recruiter_id INTEGER REFERENCES users(id);")

    # Create candidate_notes table
    op.execute("""
        CREATE TABLE IF NOT EXISTS candidate_notes (
            id SERIAL PRIMARY KEY,
            note_id VARCHAR(100) NOT NULL UNIQUE,
            candidate_id VARCHAR(100) NOT NULL REFERENCES candidates(candidate_id),
            author_id INTEGER NOT NULL REFERENCES users(id),
            note_text TEXT NOT NULL,
            note_type VARCHAR(50) DEFAULT 'general' NOT NULL,
            is_private BOOLEAN DEFAULT true NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_candidate_notes_note_id ON candidate_notes(note_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_candidate_notes_candidate_id ON candidate_notes(candidate_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_candidate_notes_author_id ON candidate_notes(author_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS candidate_notes CASCADE")
    # Drop assigned_recruiter_id if exists
    op.execute("ALTER TABLE candidates DROP COLUMN IF EXISTS assigned_recruiter_id;")
