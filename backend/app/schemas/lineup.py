from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .lineup_slot import LineupSlotRead


class LineupCreate(BaseModel):
    game_id: int
    name: str = "Draft"
    is_final: bool = False


class LineupUpdate(BaseModel):
    name: Optional[str] = None
    is_final: Optional[bool] = None


class LineupRead(BaseModel):
    id: int
    game_id: int
    name: str
    is_final: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LineupReadWithSlots(LineupRead):
    slots: list[LineupSlotRead] = []
