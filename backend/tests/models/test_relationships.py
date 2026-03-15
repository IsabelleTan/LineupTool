"""Full integration: game → lineups → slots → player traversal both ways."""

from datetime import date

from app.models import Game, GameAvailability, Lineup, LineupSlot, Player


def test_full_traversal(db):
    # Setup
    game = Game(game_date=date(2026, 10, 1), opponent="Finals")
    db.add(game)
    db.flush()

    players = []
    for i in range(3):
        p = Player(name=f"Player{i}", jersey_number=str(i))
        db.add(p)
        players.append(p)
    db.flush()

    for p in players:
        db.add(GameAvailability(game_id=game.id, player_id=p.id, is_available=True))
    db.flush()

    lineup = Lineup(game_id=game.id, name="Championship Lineup", is_final=True)
    db.add(lineup)
    db.flush()

    positions = ["CF", "SS", "1B"]
    for i, (p, pos) in enumerate(zip(players, positions)):
        slot = LineupSlot(
            lineup_id=lineup.id,
            player_id=p.id,
            batting_order=i + 1,
            fielding_position=pos,
        )
        db.add(slot)
    db.flush()
    db.expire_all()

    # Forward: game → lineups → slots → player
    loaded_game = db.get(Game, game.id)
    assert len(loaded_game.lineups) == 1
    loaded_lineup = loaded_game.lineups[0]
    assert loaded_lineup.name == "Championship Lineup"
    assert len(loaded_lineup.slots) == 3

    slot_names = [s.player.name for s in loaded_lineup.slots]
    assert slot_names == ["Player0", "Player1", "Player2"]

    # Reverse: player → lineup_slots → lineup → game
    loaded_player = db.get(Player, players[0].id)
    assert len(loaded_player.lineup_slots) == 1
    assert loaded_player.lineup_slots[0].lineup.game.opponent == "Finals"

    # Availability traversal
    assert len(loaded_game.availabilities) == 3
    available_names = sorted(a.player.name for a in loaded_game.availabilities)
    assert available_names == ["Player0", "Player1", "Player2"]
