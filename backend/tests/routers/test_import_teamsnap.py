"""Tests for POST /api/import/teamsnap."""

from app.routers.import_teamsnap import _parse_date, _parse_game_event, _parse_positions

# ---------------------------------------------------------------------------
# _parse_game_event
# ---------------------------------------------------------------------------


class TestParseGameEvent:
    def test_vs_home(self):
        assert _parse_game_event("vs. Eagles") == ("Eagles", True)

    def test_vs_no_dot(self):
        assert _parse_game_event("vs Cardinals") == ("Cardinals", True)

    def test_at_away(self):
        assert _parse_game_event("at Barracudas") == ("Barracudas", False)

    def test_home_game(self):
        assert _parse_game_event("Home Game vs. Cards") == ("Cards", True)

    def test_away_game(self):
        assert _parse_game_event("Away Game vs. Cudas") == ("Cudas", False)

    def test_nightgame_vs(self):
        assert _parse_game_event("Nightgame vs Cudas") == ("Cudas", True)

    def test_nightgame_at(self):
        assert _parse_game_event("Nightgame a Cudas") == ("Cudas", False)

    def test_home_night_game(self):
        assert _parse_game_event("Home Night Game vs. Cudas") == ("Cudas", True)

    def test_playoffs_vs(self):
        assert _parse_game_event("Playoffs vs. Flyers") == ("Flyers", True)

    def test_playoffs_at(self):
        assert _parse_game_event("Playoffs at Flyers") == ("Flyers", False)

    def test_semi_finals(self):
        opponent, is_home = _parse_game_event("Semi Finals vs Cudas (2 Games)")
        assert opponent == "Cudas (2 Games)"
        assert is_home is True

    def test_finals_best_of(self):
        opponent, is_home = _parse_game_event("Finals Best of 5")
        assert "Finals" in opponent
        assert is_home is True

    def test_friendly_game(self):
        opponent, is_home = _parse_game_event("Friendly Game")
        assert is_home is True

    def test_rainout_game(self):
        opponent, is_home = _parse_game_event("Rainout Game")
        assert is_home is True

    def test_tournament(self):
        opponent, is_home = _parse_game_event("Finkston Tournament")
        assert "Tournament" in opponent
        assert is_home is True

    def test_tournament_with_words_after(self):
        opponent, _ = _parse_game_event("Zagreb Tournament Zagreb")
        assert opponent is not None

    def test_turnier(self):
        opponent, is_home = _parse_game_event("Pfingstturnier 18.-20.05.")
        assert opponent is not None
        assert is_home is True

    def test_practice_returns_none(self):
        assert _parse_game_event("Practice") is None

    def test_indoor_practice_returns_none(self):
        assert _parse_game_event("Indoor Practice") is None

    def test_team_dinner_returns_none(self):
        assert _parse_game_event("Team Dinner & Party") is None

    def test_batting_practice_returns_none(self):
        assert _parse_game_event("Batting Practice") is None

    def test_empty_returns_none(self):
        assert _parse_game_event("") is None


# ---------------------------------------------------------------------------
# _parse_date
# ---------------------------------------------------------------------------


class TestParseDate:
    def test_mm_dd_yyyy(self):
        from datetime import date

        assert _parse_date("06/08/2026") == date(2026, 6, 8)

    def test_mm_dd_yy(self):
        from datetime import date

        assert _parse_date("06/08/26") == date(2026, 6, 8)

    def test_iso(self):
        from datetime import date

        assert _parse_date("2026-06-08") == date(2026, 6, 8)

    def test_invalid_returns_none(self):
        assert _parse_date("TBD") is None

    def test_strips_whitespace(self):
        from datetime import date

        assert _parse_date("  06/08/2026  ") == date(2026, 6, 8)


# ---------------------------------------------------------------------------
# _parse_positions
# ---------------------------------------------------------------------------


class TestParsePositions:
    def test_single(self):
        assert _parse_positions("SS") == ["SS"]

    def test_multiple(self):
        assert _parse_positions("P / SS") == ["P", "SS"]

    def test_of_expanded(self):
        assert _parse_positions("OF") == ["LF", "CF", "RF"]

    def test_of_mixed(self):
        assert _parse_positions("OF / 1B") == ["LF", "CF", "RF", "1B"]

    def test_empty_returns_none(self):
        assert _parse_positions("") is None


# ---------------------------------------------------------------------------
# POST /api/import/teamsnap — roster
# ---------------------------------------------------------------------------


def _csv(content: str) -> bytes:
    return content.encode("utf-8")


def _upload(content: str, name: str = "file.csv"):
    return (name, _csv(content), "text/csv")


class TestImportRoster:
    def test_creates_players(self, client):
        csv = (
            "First,Last,Jersey Number,Position\nAlice,Smith,7,SS\nBob,Jones,14,P / OF\n"
        )
        r = client.post("/api/import/teamsnap", files={"roster": _upload(csv)})
        assert r.status_code == 200
        data = r.json()
        assert data["players_added"] == 2
        assert data["players_skipped"] == 0

        players = {p["name"]: p for p in client.get("/api/players/").json()}
        assert "Alice Smith" in players
        assert players["Alice Smith"]["jersey_number"] == "7"
        assert players["Alice Smith"]["capable_positions"] == ["SS"]
        assert players["Bob Jones"]["capable_positions"] == ["P", "LF", "CF", "RF"]

    def test_skips_duplicate(self, client):
        csv = "First,Last\nCarol,King\n"
        client.post("/api/import/teamsnap", files={"roster": _upload(csv)})
        r = client.post("/api/import/teamsnap", files={"roster": _upload(csv)})
        assert r.json()["players_added"] == 0
        assert r.json()["players_skipped"] == 1

    def test_fills_missing_jersey_on_existing(self, client):
        csv_no_jersey = "First,Last\nDave,Lee\n"
        client.post("/api/import/teamsnap", files={"roster": _upload(csv_no_jersey)})

        csv_with_jersey = "First,Last,Jersey Number\nDave,Lee,42\n"
        client.post("/api/import/teamsnap", files={"roster": _upload(csv_with_jersey)})

        players = {p["name"]: p for p in client.get("/api/players/").json()}
        assert players["Dave Lee"]["jersey_number"] == "42"

    def test_strips_note_last_name(self, client):
        csv = "First,Last\nLeandra,(here for back-up)\n"
        r = client.post("/api/import/teamsnap", files={"roster": _upload(csv)})
        assert r.json()["players_added"] == 1
        names = [p["name"] for p in client.get("/api/players/").json()]
        assert "Leandra" in names

    def test_skips_row_with_no_first_name(self, client):
        csv = "First,Last\n,Smith\n"
        r = client.post("/api/import/teamsnap", files={"roster": _upload(csv)})
        assert r.json()["players_added"] == 0


# ---------------------------------------------------------------------------
# POST /api/import/teamsnap — schedule
# ---------------------------------------------------------------------------


class TestImportSchedule:
    def test_creates_upcoming_game(self, client):
        csv = "Date,Game / Event Name,Location\n12/31/2099,vs. Eagles,Stadium\n"
        r = client.post("/api/import/teamsnap", files={"schedule": _upload(csv)})
        assert r.status_code == 200
        assert r.json()["games_added"] == 1
        games = client.get("/api/games/").json()
        assert any(
            g["opponent"] == "Eagles" and g["location"] == "Stadium" for g in games
        )

    def test_skips_past_game(self, client):
        csv = "Date,Game / Event Name\n01/01/2000,vs. Eagles\n"
        r = client.post("/api/import/teamsnap", files={"schedule": _upload(csv)})
        assert r.json()["games_skipped"] == 1
        assert r.json()["games_added"] == 0

    def test_skips_practice(self, client):
        csv = (
            "Date,Game / Event Name\n12/31/2099,Practice\n12/31/2099,Indoor Practice\n"
        )
        r = client.post("/api/import/teamsnap", files={"schedule": _upload(csv)})
        assert r.json()["games_added"] == 0

    def test_away_game_inferred(self, client):
        csv = "Date,Game / Event Name\n12/31/2099,at Barracudas\n"
        client.post("/api/import/teamsnap", files={"schedule": _upload(csv)})
        games = client.get("/api/games/").json()
        g = next(g for g in games if g["opponent"] == "Barracudas")
        assert g["is_home"] is False

    def test_skips_duplicate_fills_location(self, client):
        csv1 = "Date,Game / Event Name\n12/30/2099,vs. Panthers\n"
        csv2 = "Date,Game / Event Name,Location\n12/30/2099,vs. Panthers,Field A\n"
        client.post("/api/import/teamsnap", files={"schedule": _upload(csv1)})
        r = client.post("/api/import/teamsnap", files={"schedule": _upload(csv2)})
        assert r.json()["games_skipped"] == 1
        games = client.get("/api/games/").json()
        g = next(g for g in games if g["opponent"] == "Panthers")
        assert g["location"] == "Field A"


# ---------------------------------------------------------------------------
# POST /api/import/teamsnap — availability
# ---------------------------------------------------------------------------


class TestImportAvailability:
    def _avail_csv(self, player: str, event_col: str, cell: str) -> str:
        return f"First Name,Last Name,Player,{event_col}\n{player},,Y,{cell}\n"

    def test_creates_player_and_game(self, client):
        csv = self._avail_csv("Zara", "vs. Frogs 12/31/2099  8:00 AM", "yes")
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.status_code == 200
        assert r.json()["players_added"] == 1
        assert r.json()["games_added"] == 1
        assert r.json()["availability_added"] == 1

    def test_yes_is_available(self, client):
        csv = self._avail_csv("Yuki", "vs. Eagles 12/28/2099  8:00 AM", "yes")
        client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        games = client.get("/api/games/").json()
        game = next(g for g in games if g["opponent"] == "Eagles")
        avail = client.get(f"/api/games/{game['id']}/availability/").json()
        assert avail[0]["is_available"] is True

    def test_no_is_not_available(self, client):
        csv = self._avail_csv("Xena", "vs. Cardinals 12/27/2099  8:00 AM", "no")
        client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        games = client.get("/api/games/").json()
        game = next(g for g in games if g["opponent"] == "Cardinals")
        avail = client.get(f"/api/games/{game['id']}/availability/").json()
        assert avail[0]["is_available"] is False

    def test_maybe_skipped(self, client):
        csv = self._avail_csv("Wren", "vs. Flyers 12/26/2099  8:00 AM", "maybe")
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.json()["availability_added"] == 0

    def test_unknown_skipped(self, client):
        csv = self._avail_csv("Vera", "vs. Flyers 12/25/2099  8:00 AM", "unknown")
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.json()["availability_added"] == 0

    def test_practice_column_skipped(self, client):
        csv = "First Name,Last Name,Player,Practice 12/31/2099  6:00 PM\nUma,,Y,yes\n"
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.json()["games_added"] == 0
        assert r.json()["availability_added"] == 0

    def test_past_column_skipped(self, client):
        csv = self._avail_csv("Tina", "vs. Bears 01/01/2000  8:00 AM", "yes")
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.json()["games_added"] == 0
        assert r.json()["availability_added"] == 0

    def test_skips_duplicate_availability(self, client):
        csv = self._avail_csv("Sara", "vs. Panthers 12/24/2099  8:00 AM", "yes")
        client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        r = client.post("/api/import/teamsnap", files={"availability": _upload(csv)})
        assert r.json()["availability_skipped"] == 1
        assert r.json()["availability_added"] == 0
