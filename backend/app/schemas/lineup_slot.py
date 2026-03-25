from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class LineupSlotCreate(BaseModel):
    player_id: int
    batting_order: int
    fielding_position: str
    is_flex: bool = False


class LineupSlotUpdate(BaseModel):
    batting_order: Optional[int] = None
    fielding_position: Optional[str] = None
    is_flex: Optional[bool] = None


class LineupReorder(BaseModel):
    slot_ids: list[int]


class LineupSlotRead(BaseModel):
    id: int
    lineup_id: int
    player_id: int
    batting_order: int
    fielding_position: str
    is_flex: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
