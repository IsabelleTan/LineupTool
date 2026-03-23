import pytest


@pytest.fixture
def game(client):
    return client.post(
        "/api/games/", json={"game_date": "2026-06-01", "opponent": "Opp"}
    ).json()


@pytest.fixture
def player(client):
    return client.post("/api/players/", json={"name": "Alice"}).json()


def test_create_and_get_lineup(client, game):
    r = client.post("/api/lineups/", json={"game_id": game["id"]})
    assert r.status_code == 201
    assert r.json()["name"] == "Draft"
    assert r.json()["is_final"] is False

    lid = r.json()["id"]
    r2 = client.get(f"/api/lineups/{lid}")
    assert r2.status_code == 200
    assert r2.json()["slots"] == []


def test_list_lineups_filtered_by_game(client, game):
    client.post("/api/lineups/", json={"game_id": game["id"], "name": "A"})
    client.post("/api/lineups/", json={"game_id": game["id"], "name": "B"})

    r = client.get(f"/api/lineups/?game_id={game['id']}")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_update_lineup(client, game):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    r = client.patch(f"/api/lineups/{lid}", json={"name": "Final", "is_final": True})
    assert r.status_code == 200
    assert r.json()["is_final"] is True


def test_delete_lineup(client, game):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    assert client.delete(f"/api/lineups/{lid}").status_code == 204
    assert client.get(f"/api/lineups/{lid}").status_code == 404


def test_add_and_list_slots(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    r = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    )
    assert r.status_code == 201
    assert r.json()["fielding_position"] == "CF"

    r2 = client.get(f"/api/lineups/{lid}/slots")
    assert len(r2.json()) == 1


def test_duplicate_batting_order_returns_409(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    p2 = client.post("/api/players/", json={"name": "Bob"}).json()

    client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    )
    r = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p2["id"], "batting_order": 1, "fielding_position": "LF"},
    )
    assert r.status_code == 409


def test_update_slot(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    sid = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    ).json()["id"]

    r = client.patch(f"/api/lineups/{lid}/slots/{sid}", json={"fielding_position": "SS"})
    assert r.status_code == 200
    assert r.json()["fielding_position"] == "SS"


def test_delete_slot(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    sid = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    ).json()["id"]

    r = client.delete(f"/api/lineups/{lid}/slots/{sid}")
    assert r.status_code == 200
    assert r.json()["slots"] == []


def test_delete_slot_compacts_batting_orders(client, game, player):
    p2 = client.post("/api/players/", json={"name": "Bob"}).json()
    p3 = client.post("/api/players/", json={"name": "Charlie"}).json()
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    )
    s2 = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p2["id"], "batting_order": 2, "fielding_position": "SS"},
    ).json()["id"]
    client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p3["id"], "batting_order": 3, "fielding_position": "P"},
    )

    r = client.delete(f"/api/lineups/{lid}/slots/{s2}")
    assert r.status_code == 200
    slots = r.json()["slots"]
    orders = sorted(s["batting_order"] for s in slots)
    assert orders == [1, 2]


def test_lineup_with_slots_in_get(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 3, "fielding_position": "P"},
    )

    r = client.get(f"/api/lineups/{lid}")
    assert len(r.json()["slots"]) == 1
    assert r.json()["slots"][0]["batting_order"] == 3


def test_create_lineup_game_not_found(client):
    r = client.post("/api/lineups/", json={"game_id": 99999})
    assert r.status_code == 404


def test_add_slot_player_not_found(client, game):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    r = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": 99999, "batting_order": 1, "fielding_position": "CF"},
    )
    assert r.status_code == 404


def test_update_slot_batting_order_conflict(client, game, player):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    p2 = client.post("/api/players/", json={"name": "Bob"}).json()

    client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    )
    sid2 = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p2["id"], "batting_order": 2, "fielding_position": "LF"},
    ).json()["id"]

    r = client.patch(f"/api/lineups/{lid}/slots/{sid2}", json={"batting_order": 1})
    assert r.status_code == 409


def test_reorder_slots(client, game, player):
    p2 = client.post("/api/players/", json={"name": "Bob"}).json()
    p3 = client.post("/api/players/", json={"name": "Charlie"}).json()
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    s1 = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    ).json()["id"]
    s2 = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p2["id"], "batting_order": 2, "fielding_position": "SS"},
    ).json()["id"]
    s3 = client.post(
        f"/api/lineups/{lid}/slots",
        json={"player_id": p3["id"], "batting_order": 3, "fielding_position": "P"},
    ).json()["id"]

    r = client.put(f"/api/lineups/{lid}/reorder", json={"slot_ids": [s3, s1, s2]})
    assert r.status_code == 200
    slots = r.json()["slots"]
    order = {s["id"]: s["batting_order"] for s in slots}
    assert order[s3] == 1
    assert order[s1] == 2
    assert order[s2] == 3


def test_reorder_slots_wrong_lineup(client, game):
    lid = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    r = client.put(f"/api/lineups/{lid}/reorder", json={"slot_ids": [999]})
    assert r.status_code == 422


def test_update_slot_wrong_lineup(client, game, player):
    lineup_a = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]
    lineup_b = client.post("/api/lineups/", json={"game_id": game["id"]}).json()["id"]

    sid = client.post(
        f"/api/lineups/{lineup_a}/slots",
        json={"player_id": player["id"], "batting_order": 1, "fielding_position": "CF"},
    ).json()["id"]

    r = client.patch(
        f"/api/lineups/{lineup_b}/slots/{sid}", json={"fielding_position": "SS"}
    )
    assert r.status_code == 404
