# Lineup Tool

A web app for managing baseball/softball lineups. You can track players, schedule games, mark who's available for each game, and build batting orders with fielding positions.

---

## What's in this repo

```
lineup-tool/
├── backend/     # The server — handles data storage and the API
└── frontend/    # The browser app — what users actually see and interact with
```

The backend and frontend are two separate applications that talk to each other over HTTP. The backend stores and manages all the data; the frontend is the visual interface that calls the backend to read and write that data.

---

## Backend

**Tech:** Python, FastAPI, SQLAlchemy, SQLite

The backend is a REST API — a set of URLs (called endpoints) that the frontend (or any HTTP client like Postman) can call to create, read, update, or delete data.

### How the code is organised

```
backend/
├── app/
│   ├── main.py          # Entry point — creates the app and registers all routes
│   ├── db/
│   │   └── database.py  # Sets up the database connection
│   ├── models/          # Database table definitions (what gets stored)
│   ├── schemas/         # Request/response shapes (what the API accepts and returns)
│   └── routers/         # The actual API endpoints, grouped by resource
├── alembic/             # Database migration scripts (versioned schema changes)
├── tests/               # Automated tests
└── pyproject.toml       # Python dependencies and project config
```

### Database tables

| Table | What it stores |
|---|---|
| `players` | Each person on the roster — name, jersey number, positions they can play |
| `games` | Scheduled games — date, opponent, location, home/away, status |
| `game_availabilities` | Which players are available for a given game |
| `lineups` | A batting order for a game (a game can have multiple draft lineups) |
| `lineup_slots` | Each row in a lineup — which player bats where and plays what position |

### API endpoints

| Method | URL | What it does |
|---|---|---|
| GET | `/players` | List all players |
| POST | `/players` | Add a new player |
| GET | `/players/:id` | Get one player |
| PATCH | `/players/:id` | Update a player |
| DELETE | `/players/:id` | Remove a player |
| GET | `/games` | List all games |
| POST | `/games` | Schedule a new game |
| GET | `/games/:id` | Get one game |
| PATCH | `/games/:id` | Update a game |
| DELETE | `/games/:id` | Delete a game |
| GET | `/games/:id/availability` | List availability for a game |
| POST | `/games/:id/availability` | Mark a player as available/unavailable |
| PATCH | `/games/:id/availability/:av_id` | Update an availability record |
| DELETE | `/games/:id/availability/:av_id` | Remove an availability record |
| GET | `/lineups` | List lineups (filter by `?game_id=` to get lineups for one game) |
| POST | `/lineups` | Create a new lineup |
| GET | `/lineups/:id` | Get a lineup including all its slots |
| PATCH | `/lineups/:id` | Rename a lineup or mark it as final |
| DELETE | `/lineups/:id` | Delete a lineup (also deletes its slots) |
| POST | `/lineups/:id/slots` | Add a player to a lineup |
| PATCH | `/lineups/:id/slots/:slot_id` | Change a player's batting order or position |
| DELETE | `/lineups/:id/slots/:slot_id` | Remove a player from a lineup |
| PUT | `/lineups/:id/reorder` | Reorder all slots in a lineup by supplying the full ordered list of slot IDs |

### Running the backend locally

```bash
cd backend

# Install dependencies (first time only)
poetry install

# Apply database migrations (creates the lineup.db file)
poetry run alembic upgrade head

# Start the dev server
poetry run uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. You can explore all endpoints interactively at `http://localhost:8000/docs` (FastAPI generates this automatically).

### Running the tests

```bash
cd backend
poetry run pytest tests/ -v
```

Tests use an in-memory database so they don't touch your local `lineup.db`.

---

## Frontend

**Tech:** React 19, TypeScript, Vite, React Router, shadcn/ui (Tailwind CSS)

The frontend is a single-page app (SPA) — the browser loads it once and then navigates between views without full page reloads. It's written in TypeScript (JavaScript with types) to catch mistakes at edit time rather than at runtime.

### How the code is organised

```
frontend/
├── src/
│   ├── api/         # Typed API client functions
│   ├── components/  # Feature components and shadcn/ui primitives
│   ├── lib/         # Shared utilities
│   └── pages/       # One file per route
└── package.json
```

### Pages

| Route | Page | What it shows |
|---|---|---|
| `/players` | PlayersPage | Full roster — add, edit, delete players |
| `/games` | GamesPage | Scheduled games — add, edit, delete games |
| `/games/:id` | GameDetailPage | Game detail — availability panel, fielding positions on a baseball diamond, and drag-and-drop batting order |

### Running the frontend locally

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`. It expects the backend to be running at `http://localhost:8000`.

### Running the frontend tests

```bash
cd frontend
npm run test
```

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/). They cover the API clients, page components, and UI components.

---

## CI (GitHub Actions)

Two automated workflows run on every push and pull request:

- **Backend** (`.github/workflows/backend.yml`) — runs on changes to `backend/`. Checks linting (ruff), formatting (black), all tests (pytest), and verifies no database migrations are missing.
- **Frontend** (`.github/workflows/frontend.yml`) — runs on changes to `frontend/`. Checks linting (eslint) and runs a full TypeScript type-check and build.

