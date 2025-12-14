"""Add AdminSettings model for storing user-specific admin configurations.

Revision ID: 007_add_admin_settings_model
Revises: add_candidate_info_fields
Create Date: 2025-12-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '007_add_admin_settings_model'
down_revision = 'add_candidate_info_fields'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create admin_settings table
    op.create_table(
        'admin_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('settings', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.UniqueConstraint('user_id'),
    )
    
    # Create index
    op.create_index('ix_admin_settings_user_id', 'admin_settings', ['user_id'], unique=True)


def downgrade() -> None:
    # Drop index
    op.drop_index('ix_admin_settings_user_id', 'admin_settings')
    
    # Drop table
    op.drop_table('admin_settings')