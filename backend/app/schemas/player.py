from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.enums import PlayerRole, PlayerStatus


class PlayerCreate(BaseModel):
    name: str
    jersey_number: Optional[str] = None
    license_number: Optional[str] = None
    capable_positions: Optional[list[str]] = None
    role: PlayerRole = PlayerRole.PLAYER
    status: PlayerStatus = PlayerStatus.ACTIVE


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[str] = None
    license_number: Optional[str] = None
    capable_positions: Optional[list[str]] = None
    role: Optional[PlayerRole] = None
    status: Optional[PlayerStatus] = None


class PlayerRead(BaseModel):
    id: int
    name: str
    jersey_number: Optional[str]
    license_number: Optional[str]
    capable_positions: Optional[list[str]]
    role: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
