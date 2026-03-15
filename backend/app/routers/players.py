from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Player
from app.schemas import PlayerCreate, PlayerRead, PlayerUpdate

router = APIRouter(prefix="/players", tags=["players"])


@router.get("/", response_model=list[PlayerRead])
def list_players(db: Session = Depends(get_db)):
    return db.query(Player).all()


@router.post("/", response_model=PlayerRead, status_code=201)
def create_player(body: PlayerCreate, db: Session = Depends(get_db)):
    player = Player(**body.model_dump())
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.get("/{player_id}", response_model=PlayerRead)
def get_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.patch("/{player_id}", response_model=PlayerRead)
def update_player(player_id: int, body: PlayerUpdate, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(player, field, value)
    db.commit()
    db.refresh(player)
    return player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    db.delete(player)
    db.commit()
