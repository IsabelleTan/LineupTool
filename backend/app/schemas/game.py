from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class GameCreate(BaseModel):
    game_date: date
    opponent: str
    location: Optional[str] = None
    is_home: bool = True


class GameUpdate(BaseModel):
    game_date: Optional[date] = None
    opponent: Optional[str] = None
    location: Optional[str] = None
    is_home: Optional[bool] = None


class GameRead(BaseModel):
    id: int
    game_date: date
    opponent: str
    location: Optional[str]
    is_home: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
