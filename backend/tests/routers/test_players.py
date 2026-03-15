def test_create_and_get_player(client):
    r = client.post("/players/", json={"name": "Alice", "jersey_number": "7"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Alice"
    assert data["jersey_number"] == "7"
    assert data["is_active"] is True

    r2 = client.get(f"/players/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Alice"


def test_list_players(client):
    client.post("/players/", json={"name": "Bob"})
    client.post("/players/", json={"name": "Carol"})
    r = client.get("/players/")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert "Bob" in names
    assert "Carol" in names


def test_update_player(client):
    r = client.post("/players/", json={"name": "Dave"})
    pid = r.json()["id"]

    r2 = client.patch(f"/players/{pid}", json={"is_active": False})
    assert r2.status_code == 200
    assert r2.json()["is_active"] is False


def test_delete_player(client):
    r = client.post("/players/", json={"name": "Eve"})
    pid = r.json()["id"]

    assert client.delete(f"/players/{pid}").status_code == 204
    assert client.get(f"/players/{pid}").status_code == 404


def test_get_player_not_found(client):
    assert client.get("/players/99999").status_code == 404
