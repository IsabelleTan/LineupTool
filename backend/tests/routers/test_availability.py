import pytest


@pytest.fixture
def game_and_player(client):
    g = client.post(
        "/api/games/", json={"game_date": "2026-06-01", "opponent": "Opp"}
    ).json()
    p = client.post("/api/players/", json={"name": "Alice"}).json()
    return g["id"], p["id"]


def test_set_and_list_availability(client, game_and_player):
    gid, pid = game_and_player
    r = client.post(f"/api/games/{gid}/availability/", json={"player_id": pid})
    assert r.status_code == 201
    assert r.json()["is_available"] is True

    r2 = client.get(f"/api/games/{gid}/availability/")
    assert r2.status_code == 200
    assert len(r2.json()) == 1


def test_update_availability(client, game_and_player):
    gid, pid = game_and_player
    av = client.post(f"/api/games/{gid}/availability/", json={"player_id": pid}).json()

    r = client.patch(
        f"/api/games/{gid}/availability/{av['id']}", json={"is_available": False}
    )
    assert r.status_code == 200
    assert r.json()["is_available"] is False


def test_duplicate_availability_returns_409(client, game_and_player):
    gid, pid = game_and_player
    client.post(f"/api/games/{gid}/availability/", json={"player_id": pid})
    r = client.post(f"/api/games/{gid}/availability/", json={"player_id": pid})
    assert r.status_code == 409


def test_delete_availability(client, game_and_player):
    gid, pid = game_and_player
    av = client.post(f"/api/games/{gid}/availability/", json={"player_id": pid}).json()

    assert client.delete(f"/api/games/{gid}/availability/{av['id']}").status_code == 204
    assert client.get(f"/api/games/{gid}/availability/").json() == []


def test_availability_game_not_found(client):
    assert client.get("/api/games/99999/availability/").status_code == 404


def test_set_availability_player_not_found(client, game_and_player):
    gid, _ = game_and_player
    r = client.post(f"/api/games/{gid}/availability/", json={"player_id": 99999})
    assert r.status_code == 404


def test_update_availability_not_found(client, game_and_player):
    gid, _ = game_and_player
    r = client.patch(f"/api/games/{gid}/availability/99999", json={"is_available": False})
    assert r.status_code == 404


def test_delete_availability_not_found(client, game_and_player):
    gid, _ = game_and_player
    r = client.delete(f"/api/games/{gid}/availability/99999")
    assert r.status_code == 404
