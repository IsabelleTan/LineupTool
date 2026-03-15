from datetime import date
from typing import Optional

from sqlalchemy import Boolean, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import GameStatus


class Game(Base, TimestampMixin):
    __tablename__ = "games"

    id: Mapped[int] = mapped_column(primary_key=True)
    game_date: Mapped[date] = mapped_column(Date, nullable=False)
    opponent: Mapped[str] = mapped_column(String, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_home: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[GameStatus] = mapped_column(
        String, default=GameStatus.SCHEDULED, nullable=False
    )

    availabilities: Mapped[list["GameAvailability"]] = relationship(  # noqa: F821
        "GameAvailability", back_populates="game", cascade="all, delete-orphan"
    )
    lineups: Mapped[list["Lineup"]] = relationship(  # noqa: F821
        "Lineup", back_populates="game", cascade="all, delete-orphan"
    )
