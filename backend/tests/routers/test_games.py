def test_create_and_get_game(client):
    r = client.post("/games/", json={"game_date": "2026-06-01", "opponent": "Tigers"})
    assert r.status_code == 201
    data = r.json()
    assert data["opponent"] == "Tigers"
    assert data["is_home"] is True

    r2 = client.get(f"/games/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["opponent"] == "Tigers"


def test_list_games(client):
    client.post("/games/", json={"game_date": "2026-07-01", "opponent": "Bears"})
    r = client.get("/games/")
    assert r.status_code == 200
    assert any(g["opponent"] == "Bears" for g in r.json())


def test_update_game_opponent(client):
    r = client.post("/games/", json={"game_date": "2026-08-01", "opponent": "Lions"})
    gid = r.json()["id"]

    r2 = client.patch(f"/games/{gid}", json={"opponent": "Tigers"})
    assert r2.status_code == 200
    assert r2.json()["opponent"] == "Tigers"


def test_delete_game(client):
    r = client.post("/games/", json={"game_date": "2026-09-01", "opponent": "Wolves"})
    gid = r.json()["id"]

    assert client.delete(f"/games/{gid}").status_code == 204
    assert client.get(f"/games/{gid}").status_code == 404


def test_get_game_not_found(client):
    assert client.get("/games/99999").status_code == 404


def test_update_game_not_found(client):
    r = client.patch("/games/99999", json={"opponent": "Wolves"})
    assert r.status_code == 404
