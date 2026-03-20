"""Add 10 dummy games for testing (5 past, 5 upcoming). Run from the backend/ directory:
poetry run python seed_games.py
"""

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.models.game import Game

today = date.today()

GAMES = [
    # --- Past games ---
    {
        "game_date": today - timedelta(days=60),
        "opponent": "Riverside Raptors",
        "location": "Riverside Park Field 2",
        "is_home": False,
    },
    {
        "game_date": today - timedelta(days=45),
        "opponent": "Lakeside Lions",
        "location": "Lakeside Diamond",
        "is_home": False,
    },
    {
        "game_date": today - timedelta(days=30),
        "opponent": "Northside Nationals",
        "location": "Home Field",
        "is_home": True,
    },
    {
        "game_date": today - timedelta(days=14),
        "opponent": "Eastside Eagles",
        "location": "Home Field",
        "is_home": True,
    },
    {
        "game_date": today - timedelta(days=7),
        "opponent": "Southside Sluggers",
        "location": "Southside Sports Complex",
        "is_home": False,
    },
    # --- Upcoming games ---
    {
        "game_date": today + timedelta(days=7),
        "opponent": "Westfield Warriors",
        "location": "Home Field",
        "is_home": True,
    },
    {
        "game_date": today + timedelta(days=14),
        "opponent": "Maplewood Marlins",
        "location": "Maplewood Recreation Center",
        "is_home": False,
    },
    {
        "game_date": today + timedelta(days=21),
        "opponent": "Pinecrest Panthers",
        "location": "Home Field",
        "is_home": True,
    },
    {
        "game_date": today + timedelta(days=35),
        "opponent": "Clearwater Cobras",
        "location": "Clearwater Athletic Fields",
        "is_home": False,
    },
    {
        "game_date": today + timedelta(days=50),
        "opponent": "Sunset Stingers",
        "location": "Home Field",
        "is_home": True,
    },
]


def main():
    db = SessionLocal()
    try:
        added = 0
        for data in GAMES:
            exists = (
                db.query(Game)
                .filter(Game.game_date == data["game_date"], Game.opponent == data["opponent"])
                .first()
            )
            if exists:
                print(f"  skip (already exists): {data['opponent']} on {data['game_date']}")
                continue
            db.add(Game(**data))
            added += 1
            print(f"  added: {data['opponent']} on {data['game_date']}")
        db.commit()
        print(f"\nDone — {added} game(s) added.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
