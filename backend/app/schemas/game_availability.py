from datetime import datetime

from pydantic import BaseModel


class GameAvailabilityCreate(BaseModel):
    player_id: int
    is_available: bool = True


class GameAvailabilityUpdate(BaseModel):
    is_available: bool


class GameAvailabilityRead(BaseModel):
    id: int
    game_id: int
    player_id: int
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
