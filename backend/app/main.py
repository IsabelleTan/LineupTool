from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    availability_router,
    games_router,
    import_router,
    lineups_router,
    players_router,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(players_router, prefix="/api")
app.include_router(games_router, prefix="/api")
app.include_router(availability_router, prefix="/api")
app.include_router(lineups_router, prefix="/api")
app.include_router(import_router, prefix="/api/import")


@app.get("/")
def root():
    return {"status": "ok"}
