from .backup import router as backup_router
from .game_availability import router as availability_router
from .games import router as games_router
from .import_teamsnap import router as import_router
from .lineups import router as lineups_router
from .players import router as players_router

__all__ = [
    "players_router",
    "games_router",
    "availability_router",
    "lineups_router",
    "import_router",
    "backup_router",
]
