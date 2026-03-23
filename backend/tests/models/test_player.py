from app.models import Player


def test_player_basic_fields(db):
    player = Player(name="Alice", jersey_number="7")
    db.add(player)
    db.flush()

    assert player.id is not None
    assert player.name == "Alice"
    assert player.jersey_number == "7"
    assert player.role == "Player"
    assert player.status == "Active"


def test_player_jersey_number_zero_zero(db):
    player = Player(name="Bob", jersey_number="00")
    db.add(player)
    db.flush()

    assert player.jersey_number == "00"


def test_player_defaults(db):
    player = Player(name="Charlie")
    db.add(player)
    db.flush()

    assert player.jersey_number is None
    assert player.license_number is None
    assert player.capable_positions is None
    assert player.role == "Player"
    assert player.status == "Active"


def test_player_capable_positions_json(db):
    positions = ["P", "1B", "CF"]
    player = Player(name="Dana", capable_positions=positions)
    db.add(player)
    db.flush()
    db.expire(player)

    loaded = db.get(Player, player.id)
    assert loaded.capable_positions == positions


def test_player_injured(db):
    player = Player(name="Eve", status="Injured")
    db.add(player)
    db.flush()

    assert player.status == "Injured"


def test_player_timestamps(db):
    player = Player(name="Frank")
    db.add(player)
    db.flush()

    assert player.created_at is not None
    assert player.updated_at is not None
