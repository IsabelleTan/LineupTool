"""remove status from games and preferred_position from players

Revision ID: a1b2c3d4e5f6
Revises: 80003190caeb
Create Date: 2026-03-19 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "80003190caeb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("games", "status")
    op.drop_column("players", "preferred_position")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column(
        "players", sa.Column("preferred_position", sa.String(), nullable=True)
    )
    op.add_column(
        "games",
        sa.Column("status", sa.String(), nullable=False, server_default="scheduled"),
    )
