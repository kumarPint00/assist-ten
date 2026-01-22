"""merge heads

Revision ID: d20a8afdde4d
Revises: 010_candidate_notes_assignment, 20251213_0001
Create Date: 2025-12-18 00:35:50.032316

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd20a8afdde4d'
down_revision: Union[str, None] = ('010_candidate_notes_assignment', '20251213_0001')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
