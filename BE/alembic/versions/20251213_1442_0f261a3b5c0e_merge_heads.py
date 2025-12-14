# merge heads

"""
Revision ID: 0f261a3b5c0e
Revises: 005_add_assessment_tokens, 006_add_extraction_log_model, 008_add_skillmatch_model, 256869c12ffc
Create Date: 2025-12-13 14:42:04.150841

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0f261a3b5c0e'
down_revision: Union[str, None] = ('005_add_assessment_tokens', '006_add_extraction_log_model', '008_add_skillmatch_model', '256869c12ffc')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade database schema."""
    pass


def downgrade() -> None:
    """Downgrade database schema."""
    pass
