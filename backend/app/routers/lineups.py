from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Game, Lineup, LineupSlot, Player
from app.schemas import (
    LineupCreate,
    LineupRead,
    LineupReadWithSlots,
    LineupSlotCreate,
    LineupSlotRead,
    LineupSlotUpdate,
    LineupUpdate,
)

router = APIRouter(prefix="/lineups", tags=["lineups"])


@router.get("/", response_model=list[LineupRead])
def list_lineups(game_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Lineup)
    if game_id is not None:
        q = q.filter(Lineup.game_id == game_id)
    return q.all()


@router.post("/", response_model=LineupRead, status_code=201)
def create_lineup(body: LineupCreate, db: Session = Depends(get_db)):
    if not db.get(Game, body.game_id):
        raise HTTPException(status_code=404, detail="Game not found")
    lineup = Lineup(**body.model_dump())
    db.add(lineup)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.get("/{lineup_id}", response_model=LineupReadWithSlots)
def get_lineup(lineup_id: int, db: Session = Depends(get_db)):
    lineup = db.get(Lineup, lineup_id)
    if not lineup:
        raise HTTPException(status_code=404, detail="Lineup not found")
    return lineup


@router.patch("/{lineup_id}", response_model=LineupRead)
def update_lineup(lineup_id: int, body: LineupUpdate, db: Session = Depends(get_db)):
    lineup = db.get(Lineup, lineup_id)
    if not lineup:
        raise HTTPException(status_code=404, detail="Lineup not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(lineup, field, value)
    db.commit()
    db.refresh(lineup)
    return lineup


@router.delete("/{lineup_id}", status_code=204)
def delete_lineup(lineup_id: int, db: Session = Depends(get_db)):
    lineup = db.get(Lineup, lineup_id)
    if not lineup:
        raise HTTPException(status_code=404, detail="Lineup not found")
    db.delete(lineup)
    db.commit()


# --- Slots ---


@router.get("/{lineup_id}/slots", response_model=list[LineupSlotRead])
def list_slots(lineup_id: int, db: Session = Depends(get_db)):
    if not db.get(Lineup, lineup_id):
        raise HTTPException(status_code=404, detail="Lineup not found")
    return (
        db.query(LineupSlot)
        .filter(LineupSlot.lineup_id == lineup_id)
        .order_by(LineupSlot.batting_order)
        .all()
    )


@router.post("/{lineup_id}/slots", response_model=LineupSlotRead, status_code=201)
def add_slot(lineup_id: int, body: LineupSlotCreate, db: Session = Depends(get_db)):
    if not db.get(Lineup, lineup_id):
        raise HTTPException(status_code=404, detail="Lineup not found")
    if not db.get(Player, body.player_id):
        raise HTTPException(status_code=404, detail="Player not found")
    slot = LineupSlot(lineup_id=lineup_id, **body.model_dump())
    db.add(slot)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Batting order position already taken"
        )
    db.refresh(slot)
    return slot


@router.patch("/{lineup_id}/slots/{slot_id}", response_model=LineupSlotRead)
def update_slot(
    lineup_id: int,
    slot_id: int,
    body: LineupSlotUpdate,
    db: Session = Depends(get_db),
):
    slot = db.get(LineupSlot, slot_id)
    if not slot or slot.lineup_id != lineup_id:
        raise HTTPException(status_code=404, detail="Slot not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(slot, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Batting order position already taken"
        )
    db.refresh(slot)
    return slot


@router.delete("/{lineup_id}/slots/{slot_id}", status_code=204)
def delete_slot(lineup_id: int, slot_id: int, db: Session = Depends(get_db)):
    slot = db.get(LineupSlot, slot_id)
    if not slot or slot.lineup_id != lineup_id:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.delete(slot)
    db.commit()
