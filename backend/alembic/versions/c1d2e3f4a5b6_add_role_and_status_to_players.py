"""add role and status to players, remove is_active

Revision ID: c1d2e3f4a5b6
Revises: b1c2d3e4f5a6
Create Date: 2026-03-23 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c1d2e3f4a5b6"
down_revision: Union[str, Sequence[str], None] = "b1c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "players",
        sa.Column("role", sa.String(), nullable=False, server_default="Player"),
    )
    op.add_column(
        "players",
        sa.Column("status", sa.String(), nullable=False, server_default="Active"),
    )
    # Migrate existing is_active=False rows to status="Inactive"
    op.execute("UPDATE players SET status = 'Inactive' WHERE is_active = 0")
    with op.batch_alter_table("players") as batch_op:
        batch_op.drop_column("is_active")


def downgrade() -> None:
    op.add_column(
        "players",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="1"),
    )
    op.execute(
        "UPDATE players SET is_active = CASE WHEN status = 'Active' THEN 1 ELSE 0 END"
    )
    with op.batch_alter_table("players") as batch_op:
        batch_op.drop_column("status")
        batch_op.drop_column("role")
