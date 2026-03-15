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

### Models vs Schemas — what's the difference?

- **Models** (`app/models/`) define the shape of the data *in the database*. Each model maps to a table. For example, `Player` maps to the `players` table.
- **Schemas** (`app/schemas/`) define the shape of the data *in the API*. They control what fields are required when creating something, what's optional when updating, and what gets returned in a response.

They're kept separate because you often don't want to expose every database field in the API (e.g. internal IDs, timestamps), and you may want different fields when creating vs updating a record.

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
│   ├── main.tsx          # Entry point — wraps the app in BrowserRouter and mounts it
│   ├── App.tsx           # Root — top nav and route definitions
│   ├── api/
│   │   ├── client.ts     # Base fetch wrapper (sets base URL, JSON headers, error handling)
│   │   └── players.ts    # Typed functions for the players API
│   ├── components/
│   │   ├── players/      # Feature components for the Players page
│   │   └── ui/           # Auto-generated shadcn/ui primitives (Button, Dialog, Table, etc.)
│   ├── lib/
│   │   └── utils.ts      # cn() — combines Tailwind classes safely
│   └── pages/
│       └── PlayersPage.tsx  # Players roster page
├── index.html            # The single HTML file the browser loads
├── vite.config.ts        # Build tool and Vitest config
└── package.json          # Node dependencies and scripts
```

### Pages

| Route | Page | What it shows |
|---|---|---|
| `/players` | PlayersPage | Full roster — add, edit, delete players |

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

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/). They cover the API client, players API module, and the PlayerTable and PlayerDialog components.

---

## CI (GitHub Actions)

Two automated workflows run on every push and pull request:

- **Backend** (`.github/workflows/backend.yml`) — runs on changes to `backend/`. Checks linting (ruff), formatting (black), all tests (pytest), and verifies no database migrations are missing.
- **Frontend** (`.github/workflows/frontend.yml`) — runs on changes to `frontend/`. Checks linting (eslint) and runs a full TypeScript type-check and build.

---

## Glossary

A few terms that come up a lot if you're newer to web dev:

| Term | What it means here |
|---|---|
| **API** | The set of URLs the backend exposes. The frontend calls these to read/write data. |
| **REST** | A convention for structuring API URLs and HTTP methods (GET = read, POST = create, PATCH = update, DELETE = delete). |
| **Endpoint** | One specific URL in the API, e.g. `POST /players`. |
| **Schema** | A description of the expected shape of data — which fields exist, what types they are. |
| **Migration** | A script that updates the database structure (e.g. adds a new column) in a tracked, reversible way. |
| **ORM** | "Object-Relational Mapper" — SQLAlchemy lets you work with database rows as Python objects instead of writing raw SQL. |
| **SPA** | "Single-Page App" — the browser loads one HTML file and React handles all navigation client-side. |
| **Vite** | The build tool for the frontend. In dev mode it serves files instantly with hot reload; for production it bundles everything into optimised static files. |
