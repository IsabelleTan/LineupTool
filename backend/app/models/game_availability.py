from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .game import Game
    from .player import Player


class GameAvailability(Base, TimestampMixin):
    __tablename__ = "game_availabilities"
    __table_args__ = (UniqueConstraint("game_id", "player_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="availabilities")
    player: Mapped["Player"] = relationship("Player", back_populates="availabilities")
