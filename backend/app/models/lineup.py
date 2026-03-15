from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin


class Lineup(Base, TimestampMixin):
    __tablename__ = "lineups"

    id: Mapped[int] = mapped_column(primary_key=True)
    game_id: Mapped[int] = mapped_column(ForeignKey("games.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, default="Draft", nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    game: Mapped["Game"] = relationship("Game", back_populates="lineups")  # noqa: F821
    slots: Mapped[list["LineupSlot"]] = relationship(  # noqa: F821
        "LineupSlot",
        back_populates="lineup",
        cascade="all, delete-orphan",
        order_by="LineupSlot.batting_order",
    )
