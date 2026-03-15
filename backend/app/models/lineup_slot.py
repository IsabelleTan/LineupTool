from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .lineup import Lineup
    from .player import Player


class LineupSlot(Base, TimestampMixin):
    __tablename__ = "lineup_slots"
    __table_args__ = (UniqueConstraint("lineup_id", "batting_order"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    lineup_id: Mapped[int] = mapped_column(ForeignKey("lineups.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    batting_order: Mapped[int] = mapped_column(Integer, nullable=False)
    fielding_position: Mapped[str] = mapped_column(String, nullable=False)

    lineup: Mapped["Lineup"] = relationship("Lineup", back_populates="slots")
    player: Mapped["Player"] = relationship("Player", back_populates="lineup_slots")
