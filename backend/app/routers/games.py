from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Game
from app.schemas import GameCreate, GameRead, GameUpdate

router = APIRouter(prefix="/games", tags=["games"])


@router.get("/", response_model=list[GameRead])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


@router.post("/", response_model=GameRead, status_code=201)
def create_game(body: GameCreate, db: Session = Depends(get_db)):
    game = Game(**body.model_dump())
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.get("/{game_id}", response_model=GameRead)
def get_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game


@router.patch("/{game_id}", response_model=GameRead)
def update_game(game_id: int, body: GameUpdate, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(game, field, value)
    db.commit()
    db.refresh(game)
    return game


@router.delete("/{game_id}", status_code=204)
def delete_game(game_id: int, db: Session = Depends(get_db)):
    game = db.get(Game, game_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    db.delete(game)
    db.commit()
