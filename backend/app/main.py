from fastapi import FastAPI

from app.routers import (
    availability_router,
    games_router,
    lineups_router,
    players_router,
)

app = FastAPI()

app.include_router(players_router)
app.include_router(games_router)
app.include_router(availability_router)
app.include_router(lineups_router)


@app.get("/")
def root():
    return {"status": "ok"}
