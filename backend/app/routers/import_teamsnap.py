import csv
import io
import re
from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models import Game, GameAvailability, Player

router = APIRouter(tags=["import"])

# Patterns that identify a competitive game entry and capture the opponent name.
# Each tuple is (regex, is_home). Checked in order; first match wins.
_GAME_PATTERNS: list[tuple[re.Pattern, bool]] = [
    (re.compile(r"^vs\.?\s+(.+)$", re.IGNORECASE), True),
    (re.compile(r"^at\s+(.+)$", re.IGNORECASE), False),
    (re.compile(r"^home\s+(?:night\s*)?game\s+vs\.?\s+(.+)$", re.IGNORECASE), True),
    (re.compile(r"^away\s+(?:night\s*)?game\s+vs\.?\s+(.+)$", re.IGNORECASE), False),
    (re.compile(r"^nightgame\s+vs\.?\s*(.+)$", re.IGNORECASE), True),
    (re.compile(r"^nightgame\s+(?:at|a)\s+(.+)$", re.IGNORECASE), False),
    (re.compile(r"^playoffs?\s+vs\.?\s*(.+)$", re.IGNORECASE), True),
    (re.compile(r"^playoffs?\s+at\s+(.+)$", re.IGNORECASE), False),
    (re.compile(r"^semi\s*finals?\s+vs\.?\s*(.+)$", re.IGNORECASE), True),
    (
        re.compile(r"^finals?\s+(?:best\s+of\s+\d+\s*)?vs\.?\s*(.+)$", re.IGNORECASE),
        True,
    ),
    (re.compile(r"^finals?\s+best\s+of\s+\d+$", re.IGNORECASE), True),
    (re.compile(r"^friendly\s+game(?:\s+vs\.?\s*(.+))?$", re.IGNORECASE), True),
    (re.compile(r"^rainout\s+game$", re.IGNORECASE), True),
    # Tournaments: requires at least one word before "tournament"/"turnier"
    (re.compile(r"^.+(?:tournament|turnier).*$", re.IGNORECASE), True),
]


def _parse_game_event(name: str) -> Optional[tuple[str, bool]]:
    """Return (opponent, is_home) if name matches a competitive game pattern, else None."""
    for pattern, is_home in _GAME_PATTERNS:
        m = pattern.match(name.strip())
        if m:
            captured = m.group(1) if m.lastindex else None
            opponent = (captured or name).strip()
            return opponent, is_home
    return None


def _parse_date(value: str) -> Optional[date]:
    for fmt in ("%m/%d/%Y", "%m/%d/%y", "%Y-%m-%d"):
        try:
            return datetime.strptime(value.strip(), fmt).date()
        except ValueError:
            continue
    return None


def _read_csv(file: UploadFile) -> list[dict]:
    content = file.file.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    return list(reader)


def _parse_name(row: dict) -> Optional[str]:
    """Extract a clean full name from a CSV row, or None if unusable."""
    first = (row.get("First") or row.get("First Name") or "").strip()
    last = (row.get("Last") or row.get("Last Name") or "").strip()
    if last.startswith("("):  # e.g. "(here for back-up)" — treat as no last name
        last = ""
    if not first:
        return None
    return f"{first} {last}".strip()


def _parse_positions(pos_str: str) -> Optional[list[str]]:
    """Parse a TeamSnap position string into a list, expanding OF → LF/CF/RF."""
    positions = []
    for p in pos_str.split("/"):
        p = p.strip()
        if not p:
            continue
        if p.upper() == "OF":
            positions.extend(["LF", "CF", "RF"])
        else:
            positions.append(p)
    return positions or None


@router.post("/teamsnap")
def import_teamsnap(
    roster: Optional[UploadFile] = None,
    schedule: Optional[UploadFile] = None,
    availability: Optional[UploadFile] = None,
    db: Session = Depends(get_db),
):
    result = {
        "players_added": 0,
        "players_skipped": 0,
        "games_added": 0,
        "games_skipped": 0,
        "availability_added": 0,
        "availability_skipped": 0,
        "errors": [],
    }

    # --- Roster ---
    # Creates players with jersey numbers and positions. If the player already
    # exists (e.g. from a prior availability import), fills in missing fields.
    if roster:
        for row in _read_csv(roster):
            name = _parse_name(row)
            if not name:
                continue
            jersey = (
                row.get("Jersey Number") or row.get("Jersey #") or row.get("#") or ""
            ).strip() or None
            positions = _parse_positions(row.get("Position") or "")
            existing = db.query(Player).filter(Player.name == name).first()
            if existing:
                if jersey and not existing.jersey_number:
                    existing.jersey_number = jersey
                if positions and not existing.capable_positions:
                    existing.capable_positions = positions
                result["players_skipped"] += 1
            else:
                db.add(
                    Player(name=name, jersey_number=jersey, capable_positions=positions)
                )
                result["players_added"] += 1
        db.commit()

    # --- Schedule ---
    # Creates upcoming games (today or later). Skips practices and other
    # non-game events. If a game already exists, fills in a missing location.
    if schedule:
        today = date.today()
        for row in _read_csv(schedule):
            event_name = (
                row.get("Opponent")
                or row.get("Title")
                or row.get("Game / Event Name")
                or ""
            ).strip()
            parsed = _parse_game_event(event_name)
            if parsed is None:
                result["games_skipped"] += 1
                continue
            opponent, is_home = parsed

            date_str = (row.get("Event Date") or row.get("Date") or "").strip()
            if not date_str:
                result["errors"].append(f"Game '{event_name}' has no date — skipped")
                continue
            game_date = _parse_date(date_str)
            if game_date is None:
                result["errors"].append(f"Could not parse date: {date_str!r}")
                continue
            if game_date < today:
                result["games_skipped"] += 1
                continue

            location = (row.get("Location") or "").strip() or None
            existing = (
                db.query(Game)
                .filter(Game.game_date == game_date, Game.opponent == opponent)
                .first()
            )
            if existing:
                if location and not existing.location:
                    existing.location = location
                result["games_skipped"] += 1
                continue
            db.add(
                Game(
                    game_date=game_date,
                    opponent=opponent,
                    location=location,
                    is_home=is_home,
                )
            )
            result["games_added"] += 1
        db.commit()

    # --- Availability ---
    # Also creates any players and games not already present from the roster/
    # schedule imports. Only "yes"/"no" cells are imported; "maybe" and
    # "unknown" (haven't replied) are silently skipped.
    if availability:
        today = date.today()
        rows = _read_csv(availability)
        if rows:
            _META_COLS = {"First Name", "Last Name", "Player", "First", "Last"}
            event_cols = [c for c in rows[0].keys() if c not in _META_COLS]

            # Pre-parse column headers (format: "{event name} MM/DD/YYYY  HH:MM")
            # and create any missing games up front.
            col_game_id: dict[str, Optional[int]] = {}
            for col in event_cols:
                m = re.search(r"(\d{2}/\d{2}/\d{4})", col)
                if not m:
                    col_game_id[col] = None
                    continue
                event_name = col[: m.start()].strip()
                parsed = _parse_game_event(event_name)
                if parsed is None:
                    col_game_id[col] = None
                    continue
                opponent, is_home = parsed
                gd = _parse_date(m.group(1))
                if gd is None or gd < today:
                    col_game_id[col] = None
                    continue
                game = (
                    db.query(Game)
                    .filter(Game.game_date == gd, Game.opponent == opponent)
                    .first()
                )
                if not game:
                    game = Game(game_date=gd, opponent=opponent, is_home=is_home)
                    db.add(game)
                    db.flush()
                    result["games_added"] += 1
                else:
                    result["games_skipped"] += 1
                col_game_id[col] = game.id
            db.commit()

            for row in rows:
                name = _parse_name(row)
                if not name:
                    continue
                player = db.query(Player).filter(Player.name == name).first()
                if not player:
                    player = Player(name=name)
                    db.add(player)
                    db.flush()
                    result["players_added"] += 1
                else:
                    result["players_skipped"] += 1

                for col in event_cols:
                    game_id = col_game_id.get(col)
                    if game_id is None:
                        continue
                    cell = (row.get(col) or "").strip().lower()
                    if cell not in ("yes", "no"):
                        continue
                    existing = (
                        db.query(GameAvailability)
                        .filter(
                            GameAvailability.game_id == game_id,
                            GameAvailability.player_id == player.id,
                        )
                        .first()
                    )
                    if existing:
                        result["availability_skipped"] += 1
                        continue
                    db.add(
                        GameAvailability(
                            game_id=game_id,
                            player_id=player.id,
                            is_available=cell == "yes",
                        )
                    )
                    result["availability_added"] += 1
            db.commit()

    return result
