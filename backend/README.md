# EternoMind — Backend

> Person 1 workstream · Branch: `backend-core`

FastAPI backend providing auth, sessions, health check, and the SQLite database schema that Person 2's AI pipeline writes into.

---

## Quick Start

### 1. Create & activate virtualenv

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Copy & fill environment variables

```bash
cp ../.env.example ../.env
# Edit .env — required fields:
#   SECRET_KEY  → openssl rand -hex 32
```

### 4. Run database migrations

```bash
alembic upgrade head
```

### 5. Seed demo user

```bash
python scripts/seed_demo_user.py
# Prints: username + password to stdout
# Share these with Person 3 for the login screen
```

### 6. Start the server

```bash
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
# Health:   http://localhost:8000/api/v1/health
```

---

## Running Tests

```bash
python -m pytest tests/ -v
```

All 7 auth tests should pass.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/login` | Login — returns access + refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/sessions` | Create a chat session |
| GET | `/api/v1/sessions/{id}` | Get session details |
| GET | `/api/v1/health` | Health check (backend, redis, chromadb) |

Full interactive docs at `http://localhost:8000/docs`.

---

## Handoff Notes for Person 2

- Import `get_db` from `app.db.database` as your FastAPI dependency
- Import `InteractionLog`, `ChatSession` from `app.db.models`
- Add your routers (`chat`, `metrics`) by uncommenting the lines in `app/main.py`
- `SECRET_KEY` must be set in `.env` before any JWT operations work

## Handoff Notes for Person 3

- Base URL: `http://localhost:8000`
- Get demo credentials by running `python scripts/seed_demo_user.py`
- CORS is pre-configured to allow `http://localhost:5173`
