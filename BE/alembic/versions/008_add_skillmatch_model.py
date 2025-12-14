"""Add SkillMatch model for storing ATS matching runs

Revision ID: 008_add_skillmatch_model
Revises: 007_add_admin_settings_model
Create Date: 2025-12-13 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '008_add_skillmatch_model'
down_revision = '007_add_admin_settings_model'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'skill_matches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('match_id', sa.String(100), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('jd_file_id', sa.Integer(), nullable=True),
        sa.Column('cv_file_id', sa.Integer(), nullable=True),
        sa.Column('match_score', sa.Float(), nullable=False),
        sa.Column('matched_skills', sa.JSON(), nullable=False),
        sa.Column('missing_skills', sa.JSON(), nullable=False),
        sa.Column('extra_skills', sa.JSON(), nullable=False),
        sa.Column('summary', sa.JSON(), nullable=False),
        sa.Column('llm_used', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('provider', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['jd_file_id'], ['uploaded_documents.id'], ),
        sa.ForeignKeyConstraint(['cv_file_id'], ['uploaded_documents.id'], ),
    )

    op.create_index('ix_skill_matches_user_id', 'skill_matches', ['user_id'], unique=False)
    op.create_index('ix_skill_matches_created_at', 'skill_matches', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_skill_matches_created_at', 'skill_matches')
    op.drop_index('ix_skill_matches_user_id', 'skill_matches')
    op.drop_table('skill_matches'
)
