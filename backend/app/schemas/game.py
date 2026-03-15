from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import GameStatus


class GameCreate(BaseModel):
    game_date: date
    opponent: str
    location: Optional[str] = None
    is_home: bool = True
    status: GameStatus = GameStatus.SCHEDULED


class GameUpdate(BaseModel):
    game_date: Optional[date] = None
    opponent: Optional[str] = None
    location: Optional[str] = None
    is_home: Optional[bool] = None
    status: Optional[GameStatus] = None


class GameRead(BaseModel):
    id: int
    game_date: date
    opponent: str
    location: Optional[str]
    is_home: bool
    status: GameStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
