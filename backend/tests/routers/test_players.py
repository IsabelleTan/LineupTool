def test_create_and_get_player(client):
    r = client.post("/api/players/", json={"name": "Alice", "jersey_number": "7"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Alice"
    assert data["jersey_number"] == "7"
    assert data["role"] == "Player"
    assert data["status"] == "Active"

    r2 = client.get(f"/api/players/{data['id']}")
    assert r2.status_code == 200
    assert r2.json()["name"] == "Alice"


def test_list_players(client):
    client.post("/api/players/", json={"name": "Bob"})
    client.post("/api/players/", json={"name": "Carol"})
    r = client.get("/api/players/")
    assert r.status_code == 200
    names = [p["name"] for p in r.json()]
    assert "Bob" in names
    assert "Carol" in names


def test_update_player_status(client):
    r = client.post("/api/players/", json={"name": "Dave"})
    pid = r.json()["id"]

    r2 = client.patch(f"/api/players/{pid}", json={"status": "Injured"})
    assert r2.status_code == 200
    assert r2.json()["status"] == "Injured"


def test_update_player_role(client):
    r = client.post("/api/players/", json={"name": "Eve"})
    pid = r.json()["id"]

    r2 = client.patch(f"/api/players/{pid}", json={"role": "Staff"})
    assert r2.status_code == 200
    assert r2.json()["role"] == "Staff"


def test_delete_player(client):
    r = client.post("/api/players/", json={"name": "Frank"})
    pid = r.json()["id"]

    assert client.delete(f"/api/players/{pid}").status_code == 204
    assert client.get(f"/api/players/{pid}").status_code == 404


def test_get_player_not_found(client):
    assert client.get("/api/players/99999").status_code == 404
