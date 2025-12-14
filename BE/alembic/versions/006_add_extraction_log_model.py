"""Add ExtractionLog model for LLM extraction auditing.

Revision ID: 006_add_extraction_log_model
Revises: add_candidate_info_fields
Create Date: 2024-12-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '006_add_extraction_log_model'
down_revision = 'add_candidate_info_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create extraction_logs table
    op.create_table(
        'extraction_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('extraction_type', sa.String(50), nullable=False),
        sa.Column('input_length', sa.Integer(), nullable=False),
        sa.Column('output_data', sa.JSON(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('provider', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    
    # Create indexes
    op.create_index('ix_extraction_logs_user', 'extraction_logs', ['user_id'], unique=False)
    op.create_index('ix_extraction_logs_type', 'extraction_logs', ['extraction_type'], unique=False)
    op.create_index('ix_extraction_logs_created', 'extraction_logs', ['created_at'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_extraction_logs_created', 'extraction_logs')
    op.drop_index('ix_extraction_logs_type', 'extraction_logs')
    op.drop_index('ix_extraction_logs_user', 'extraction_logs')
    
    # Drop table
    op.drop_table('extraction_logs')
