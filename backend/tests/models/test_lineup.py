from datetime import date

from app.models import Game, Lineup, LineupSlot, Player


def make_game(db):
    g = Game(game_date=date(2026, 8, 1), opponent="Rivals")
    db.add(g)
    db.flush()
    return g


def make_player(db, name="Player"):
    p = Player(name=name)
    db.add(p)
    db.flush()
    return p


def test_lineup_defaults(db):
    g = make_game(db)
    lineup = Lineup(game_id=g.id)
    db.add(lineup)
    db.flush()

    assert lineup.name == "Draft"
    assert lineup.is_final is False


def test_lineup_custom_fields(db):
    g = make_game(db)
    lineup = Lineup(game_id=g.id, name="Final Lineup", is_final=True)
    db.add(lineup)
    db.flush()

    assert lineup.name == "Final Lineup"
    assert lineup.is_final is True


def test_lineup_cascade_delete_slots(db):
    g = make_game(db)
    p = make_player(db)
    lineup = Lineup(game_id=g.id)
    db.add(lineup)
    db.flush()

    slot = LineupSlot(
        lineup_id=lineup.id,
        player_id=p.id,
        batting_order=1,
        fielding_position="CF",
    )
    db.add(slot)
    db.flush()
    slot_id = slot.id

    db.delete(lineup)
    db.flush()

    assert db.get(LineupSlot, slot_id) is None


def test_lineup_relationship_to_game(db):
    g = make_game(db)
    lineup = Lineup(game_id=g.id)
    db.add(lineup)
    db.flush()
    db.expire_all()

    loaded = db.get(Lineup, lineup.id)
    assert loaded.game.opponent == "Rivals"
