from typing import Optional

from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Player(Base, TimestampMixin):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    jersey_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    license_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    capable_positions: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True)
    role: Mapped[str] = mapped_column(String, nullable=False, default="Player")
    status: Mapped[str] = mapped_column(String, nullable=False, default="Active")

    availabilities: Mapped[list["GameAvailability"]] = relationship(  # noqa: F821
        "GameAvailability", back_populates="player"
    )
    lineup_slots: Mapped[list["LineupSlot"]] = relationship(  # noqa: F821
        "LineupSlot", back_populates="player"
    )
