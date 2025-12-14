"""add_user_role_column

Revision ID: 20251213_0001
Revises: 
Create Date: 2025-12-13 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20251213_0001'
down_revision = '0f261a3b5c0e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('role', sa.String(length=50), nullable=False, server_default='user'))
    op.execute("UPDATE users SET role='user' WHERE role IS NULL")


def downgrade():
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_column('role')
