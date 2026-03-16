"""Add 10 dummy players for testing. Run from the backend/ directory:
poetry run python seed_players.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.db.database import SessionLocal
from app.models.player import Player

PLAYERS = [
    {
        "name": "Marcus Rivera",
        "jersey_number": "3",
        "preferred_position": "P",
        "capable_positions": ["P", "CF"],
    },
    {
        "name": "Jake Thompson",
        "jersey_number": "14",
        "preferred_position": "C",
        "capable_positions": ["C", "P"],
    },
    {
        "name": "Sofia Chen",
        "jersey_number": "22",
        "preferred_position": "1B",
        "capable_positions": ["1B", "3B"],
    },
    {
        "name": "Liam Rodriguez",
        "jersey_number": "9",
        "preferred_position": "2B",
        "capable_positions": ["2B", "SS"],
    },
    {
        "name": "Aisha Johnson",
        "jersey_number": "17",
        "preferred_position": "3B",
        "capable_positions": ["3B", "1B"],
    },
    {
        "name": "Tyler Brooks",
        "jersey_number": "5",
        "preferred_position": "SS",
        "capable_positions": ["SS", "2B"],
    },
    {
        "name": "Emma Martinez",
        "jersey_number": "31",
        "preferred_position": "LF",
        "capable_positions": ["LF", "CF"],
    },
    {
        "name": "Noah Williams",
        "jersey_number": "8",
        "preferred_position": "CF",
        "capable_positions": ["CF", "LF", "RF"],
    },
    {
        "name": "Chloe Davis",
        "jersey_number": "11",
        "preferred_position": "RF",
        "capable_positions": ["RF", "CF"],
    },
    {
        "name": "Ethan Kim",
        "jersey_number": "27",
        "preferred_position": "P",
        "capable_positions": ["P", "1B"],
    },
]


def main():
    db = SessionLocal()
    try:
        added = 0
        for data in PLAYERS:
            exists = db.query(Player).filter(Player.name == data["name"]).first()
            if exists:
                print(f"  skip (already exists): {data['name']}")
                continue
            db.add(Player(**data, is_active=True))
            added += 1
            print(f"  added: {data['name']}")
        db.commit()
        print(f"\nDone — {added} player(s) added.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
