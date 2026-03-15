from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.models import Game, GameAvailability, Player


def make_game(db, opponent="Opp"):
    g = Game(game_date=date(2026, 7, 1), opponent=opponent)
    db.add(g)
    db.flush()
    return g


def make_player(db, name="Player"):
    p = Player(name=name)
    db.add(p)
    db.flush()
    return p


def test_availability_defaults(db):
    g = make_game(db)
    p = make_player(db)
    av = GameAvailability(game_id=g.id, player_id=p.id)
    db.add(av)
    db.flush()

    assert av.is_available is True


def test_availability_explicit_unavailable(db):
    g = make_game(db, "Opp2")
    p = make_player(db, "P2")
    av = GameAvailability(game_id=g.id, player_id=p.id, is_available=False)
    db.add(av)
    db.flush()

    assert av.is_available is False


def test_availability_relationship_traversal(db):
    g = make_game(db, "Opp3")
    p = make_player(db, "P3")
    av = GameAvailability(game_id=g.id, player_id=p.id)
    db.add(av)
    db.flush()
    db.expire_all()

    loaded = db.get(GameAvailability, av.id)
    assert loaded.game.opponent == "Opp3"
    assert loaded.player.name == "P3"


def test_availability_unique_constraint(db):
    g = make_game(db, "Opp4")
    p = make_player(db, "P4")
    db.add(GameAvailability(game_id=g.id, player_id=p.id))
    db.flush()

    db.add(GameAvailability(game_id=g.id, player_id=p.id))
    with pytest.raises(IntegrityError):
        db.flush()
