from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Game, Lineup, LineupSlot, Player


def make_lineup(db):
    g = Game(game_date=date(2026, 9, 1), opponent="Challengers")
    db.add(g)
    db.flush()
    lineup = Lineup(game_id=g.id)
    db.add(lineup)
    db.flush()
    return lineup


def make_player(db, name="Player"):
    p = Player(name=name)
    db.add(p)
    db.flush()
    return p


def test_slot_basic(db):
    lineup = make_lineup(db)
    p = make_player(db)
    slot = LineupSlot(
        lineup_id=lineup.id,
        player_id=p.id,
        batting_order=1,
        fielding_position="SS",
    )
    db.add(slot)
    db.flush()

    assert slot.id is not None
    assert slot.batting_order == 1
    assert slot.fielding_position == "SS"


def test_slot_batting_order_unique_per_lineup(db):
    lineup = make_lineup(db)
    p1 = make_player(db, "P1")
    p2 = make_player(db, "P2")

    db.add(
        LineupSlot(
            lineup_id=lineup.id,
            player_id=p1.id,
            batting_order=1,
            fielding_position="CF",
        )
    )
    db.flush()

    db.add(
        LineupSlot(
            lineup_id=lineup.id,
            player_id=p2.id,
            batting_order=1,
            fielding_position="LF",
        )
    )
    with pytest.raises(IntegrityError):
        db.flush()


def test_slot_bench_allows_multiple(db):
    lineup = make_lineup(db)
    p1 = make_player(db, "Bench1")
    p2 = make_player(db, "Bench2")

    db.add(
        LineupSlot(
            lineup_id=lineup.id,
            player_id=p1.id,
            batting_order=10,
            fielding_position="BENCH",
        )
    )
    db.add(
        LineupSlot(
            lineup_id=lineup.id,
            player_id=p2.id,
            batting_order=11,
            fielding_position="BENCH",
        )
    )
    db.flush()

    db.expire_all()
    loaded = db.get(Lineup, lineup.id)
    bench_slots = [s for s in loaded.slots if s.fielding_position == "BENCH"]
    assert len(bench_slots) == 2


def test_slots_ordered_by_batting_order(db):
    lineup = make_lineup(db)
    players = [make_player(db, f"P{i}") for i in range(3)]

    for i, p in enumerate(players):
        db.add(
            LineupSlot(
                lineup_id=lineup.id,
                player_id=p.id,
                batting_order=3 - i,
                fielding_position="P",
            )
        )

    db.flush()
    db.expire_all()

    loaded = db.get(Lineup, lineup.id)
    orders = [s.batting_order for s in loaded.slots]
    assert orders == sorted(orders)
