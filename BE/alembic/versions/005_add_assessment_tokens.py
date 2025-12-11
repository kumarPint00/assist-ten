"""Add assessment invitation tokens table

Revision ID: 005_add_assessment_tokens
Revises: 004_cand_assess
Create Date: 2025-12-11

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = '005_add_assessment_tokens'
down_revision = '004_cand_assess'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create assessment_tokens table
    op.execute('''
        CREATE TABLE IF NOT EXISTS assessment_tokens (
            id SERIAL PRIMARY KEY,
            token VARCHAR(255) NOT NULL UNIQUE,
            assessment_id INTEGER NOT NULL REFERENCES assessments(id),
            candidate_email VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
            is_used BOOLEAN DEFAULT false,
            created_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    ''')

    op.execute('CREATE INDEX IF NOT EXISTS ix_assessment_tokens_token ON assessment_tokens(token)')
    op.execute('CREATE INDEX IF NOT EXISTS ix_assessment_tokens_email ON assessment_tokens(candidate_email)')


def downgrade() -> None:
    op.execute('DROP TABLE IF EXISTS assessment_tokens CASCADE')

