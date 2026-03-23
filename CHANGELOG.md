# Changelog

All notable changes to this project will be documented in this file.


## [1.0.0] - 2026-03-23

### Added
- **TeamSnap CSV import** — import roster, schedule, and availability from TeamSnap exports in one step (`/import`)
- **Print preview** — print or share a lineup card directly from the game detail page
- **License numbers** — optional license number field on players, shown in print view
- **Bench section** — unassigned available players shown in a bench section on the lineup card
- **Out-of-position assignment** — assign players to positions outside their listed capable positions
- **Upcoming / past games split** — games list separates upcoming and past games, sorted by date
- **CI/CD pipeline** — deploy to production automatically when a GitHub Release is published
- **`/api` URL prefix** — all backend routes now live under `/api/`, fixing page-refresh returning JSON and the browser URL switching to port 8000 in development

### Changed
- Player availability: "hasn't replied" is now treated as unavailable (only an explicit "going" counts as available)

---

## [0.3.0]

### Added
- **Lineup builder** — assign players to fielding positions on a baseball diamond and set the batting order with drag-and-drop
- **Game detail page** — per-game view with availability panel, diamond view, and batting order list

---

## [0.2.0]

### Added
- **Games management** — create, edit, and delete scheduled games
- **Player availability** — mark players available or unavailable per game

---

## [0.1.0]

### Added
- **Players page** — full roster management (add, edit, deactivate, delete players)
- **Backend API** — FastAPI + SQLAlchemy REST API with players, games, availability, lineups, and lineup slots
- **CI** — GitHub Actions for backend (ruff, black, pytest, alembic check) and frontend (eslint, tsc, vitest)
