from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Game, GameAvailability, Player
from app.schemas import (
    GameAvailabilityCreate,
    GameAvailabilityRead,
    GameAvailabilityUpdate,
)

router = APIRouter(prefix="/games/{game_id}/availability", tags=["availability"])


def _get_game_or_404(game_id: int, db: Session) -> Game:
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.get("/", response_model=list[GameAvailabilityRead])
def list_availability(game_id: int, db: Session = Depends(get_db)):
    _get_game_or_404(game_id, db)
    return db.query(GameAvailability).filter(GameAvailability.game_id == game_id).all()


@router.post("/", response_model=GameAvailabilityRead, status_code=201)
def set_availability(
    game_id: int, body: GameAvailabilityCreate, db: Session = Depends(get_db)
):
    _get_game_or_404(game_id, db)
    if not db.get(Player, body.player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    record = GameAvailability(game_id=game_id, **body.model_dump())
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Availability already set for this player"
        )
    db.refresh(record)
    return record


@router.patch("/{availability_id}", response_model=GameAvailabilityRead)
def update_availability(
    game_id: int,
    availability_id: int,
    body: GameAvailabilityUpdate,
    db: Session = Depends(get_db),
):
    _get_game_or_404(game_id, db)
    record = db.get(GameAvailability, availability_id)
    if not record or record.game_id != game_id:
        raise HTTPException(status_code=404, detail="Availability record not found")
    record.is_available = body.is_available
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{availability_id}", status_code=204)
def delete_availability(
    game_id: int, availability_id: int, db: Session = Depends(get_db)
):
    _get_game_or_404(game_id, db)
    record = db.get(GameAvailability, availability_id)
    if not record or record.game_id != game_id:
        raise HTTPException(status_code=404, detail="Availability record not found")
    db.delete(record)
    db.commit()
