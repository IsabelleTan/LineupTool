from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PlayerCreate(BaseModel):
    name: str
    jersey_number: Optional[str] = None
    license_number: Optional[str] = None
    capable_positions: Optional[list[str]] = None
    is_active: bool = True


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[str] = None
    license_number: Optional[str] = None
    capable_positions: Optional[list[str]] = None
    is_active: Optional[bool] = None


class PlayerRead(BaseModel):
    id: int
    name: str
    jersey_number: Optional[str]
    license_number: Optional[str]
    capable_positions: Optional[list[str]]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
