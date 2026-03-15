from datetime import date

from app.models import Game
from app.models.enums import GameStatus


def test_game_basic_fields(db):
    game = Game(game_date=date(2026, 6, 1), opponent="Tigers")
    db.add(game)
    db.flush()

    assert game.id is not None
    assert game.game_date == date(2026, 6, 1)
    assert game.opponent == "Tigers"


def test_game_defaults(db):
    game = Game(game_date=date(2026, 6, 1), opponent="Bears")
    db.add(game)
    db.flush()

    assert game.location is None
    assert game.is_home is True
    assert game.status == GameStatus.SCHEDULED


def test_game_status_enum(db):
    game = Game(
        game_date=date(2026, 6, 2),
        opponent="Lions",
        status=GameStatus.COMPLETED,
    )
    db.add(game)
    db.flush()
    db.expire(game)

    loaded = db.get(Game, game.id)
    assert loaded.status == GameStatus.COMPLETED
    assert loaded.status == "completed"


def test_game_away(db):
    game = Game(
        game_date=date(2026, 6, 3),
        opponent="Wolves",
        location="Away Park",
        is_home=False,
    )
    db.add(game)
    db.flush()

    assert game.is_home is False
    assert game.location == "Away Park"


def test_game_timestamps(db):
    game = Game(game_date=date(2026, 6, 4), opponent="Eagles")
    db.add(game)
    db.flush()

    assert game.created_at is not None
    assert game.updated_at is not None
