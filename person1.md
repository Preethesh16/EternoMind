# EternoMind — Developer 1 Workstream: Backend Core

## Your Role

You are **Person 1** on the EternoMind hackathon project. You own the **backend foundation** that the entire team builds on: FastAPI application scaffold, SQLite database models, Alembic migrations, security middleware, JWT authentication, and the shared project setup files.

**Model**: Use **Claude Opus 4.7** in Kiro for all code generation.

**Your branch**: `backend-core`
```bash
git checkout -b backend-core
# All your work goes on this branch — never commit directly to main
```

---

## Project Context

**Project**: EternoMind (Self-Optimizing Memory-Aware AI Runtime)
**Hackathon**: Building AI Agents with Hindsight & cascadeflow
**Core idea**: Memory IS the token optimization system. Every interaction makes the AI cheaper and faster.

**Mandatory Technologies** (used by your teammates, inform your scaffold):
- [Hindsight](https://hindsight.so) — persistent memory SDK (Person 2 implements)
- [cascadeflow](https://cascadeflow.ai) — model routing (Person 2 implements)
- [Groq](https://groq.com) — LLM inference (Person 2 implements)

**Full Tech Stack**:
| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+, FastAPI |
| Agent Orchestration | LangGraph, LangChain (Person 2) |
| Persistent Memory | Hindsight SDK (Person 2) |
| Vector Store | ChromaDB |
| Relational DB | SQLite + Alembic ← **you own this** |
| Caching | Redis |
| Frontend | React 18, Vite, TypeScript, TailwindCSS (Person 3) |
| Infrastructure | Docker Compose (Person 3) |

---

## What You Own

```
eternomind/
├── .env.example                    ← you create this
├── backend/
│   └── app/
│       ├── main.py                 ← FastAPI app entry, middleware, routers
│       ├── config.py               ← Settings (pydantic-settings, reads .env)
│       ├── security/
│       │   ├── __init__.py
│       │   ├── sanitizer.py        ← Input sanitization & injection detection
│       │   ├── rate_limiter.py     ← Redis-backed rate limiting middleware
│       │   └── auth.py             ← JWT creation, verification, dependencies
│       ├── db/
│       │   ├── __init__.py
│       │   ├── database.py         ← SQLAlchemy engine, SessionLocal, Base
│       │   ├── models.py           ← ORM models (users, sessions, interaction_logs)
│       │   └── migrations/         ← Alembic migration files
│       ├── schemas/
│       │   ├── __init__.py
│       │   ├── auth.py             ← Pydantic schemas for auth endpoints
│       │   └── sessions.py         ← Pydantic schemas for session endpoints
│       └── api/
│           ├── __init__.py
│           ├── health.py           ← GET /api/v1/health
│           ├── auth.py             ← POST /api/v1/auth/login, /refresh, /logout
│           └── sessions.py         ← POST /api/v1/sessions, GET /api/v1/sessions/{id}
```

You do **not** own: `agents/`, `memory/`, `rag/`, `optimization/`, `runtime/`, `api/chat.py`, `api/metrics.py`, or anything in `frontend/`.

---

## Shared Interface Contracts

Your endpoints are consumed by **Person 3 (Frontend)**. These shapes are canonical — do not change field names after agreeing with the team.

### POST /api/v1/auth/login
```json
// Request
{ "username": "string", "password": "string" }

// Response 200
{ "access_token": "string", "refresh_token": "string", "token_type": "bearer" }

// Response 401
{ "detail": "Invalid credentials" }
```

### POST /api/v1/auth/refresh
```json
// Request header: Authorization: Bearer <refresh_token>
// Response 200
{ "access_token": "string", "token_type": "bearer" }
```

### POST /api/v1/auth/logout
```json
// Request header: Authorization: Bearer <access_token>
// Response 200
{ "message": "Logged out" }
```

### POST /api/v1/sessions
```json
// Request
{ "user_id": "string" }

// Response 201
{ "session_id": "string", "created_at": "ISO8601 string" }
```

### GET /api/v1/sessions/{session_id}
```json
// Response 200
{ "session_id": "string", "user_id": "string", "created_at": "ISO8601 string", "interaction_count": 0 }

// Response 404
{ "detail": "Session not found" }
```

### GET /api/v1/health
```json
// Response 200
{ "backend": "ok", "redis": "ok|error", "chromadb": "ok|error" }
```

### interaction_logs table (SQLite)

Person 2 writes to this table. Your job is to define and migrate it. **Column names are fixed**:

| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| session_id | TEXT | NOT NULL, FK → sessions.session_id |
| user_id | TEXT | NOT NULL |
| interaction_number | INTEGER | NOT NULL |
| token_count_input | INTEGER | NOT NULL |
| token_count_output | INTEGER | NOT NULL |
| model_used | TEXT | NOT NULL |
| memory_hits | INTEGER | NOT NULL DEFAULT 0 |
| latency_ms | REAL | NOT NULL |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP |

---

## Environment Variables

Create `.env.example` with these entries (no real values, just keys + comments):

```dotenv
# ── App ──────────────────────────────────────────────────
SECRET_KEY=                   # JWT signing secret (generate: openssl rand -hex 32)
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# ── Database ─────────────────────────────────────────────
DATABASE_URL=sqlite:///./eternomind.db

# ── Redis ────────────────────────────────────────────────
REDIS_URL=redis://redis:6379/0

# ── ChromaDB ─────────────────────────────────────────────
CHROMA_HOST=chromadb
CHROMA_PORT=8001

# ── Groq (used by Person 2) ───────────────────────────────
GROQ_API_KEY=

# ── Hindsight (used by Person 2) ──────────────────────────
HINDSIGHT_API_KEY=

# ── cascadeflow (used by Person 2) ────────────────────────
CASCADEFLOW_API_KEY=

# ── Model Names (used by Person 2) ────────────────────────
GROQ_LARGE_MODEL=llama3-70b-8192
GROQ_SMALL_MODEL=llama3-8b-8192

# ── CORS ──────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:5173
```

---

## Build Phases

Work through these phases in order. Each phase has clear deliverables and tests.

---

### Phase 1: Project Scaffold & Configuration

**Goal**: Get a runnable FastAPI app with settings management.

**Deliverables**:
1. `backend/requirements.txt` with pinned versions:
   - `fastapi==0.111.0`
   - `uvicorn[standard]==0.29.0`
   - `pydantic-settings==2.2.1`
   - `sqlalchemy==2.0.30`
   - `alembic==1.13.1`
   - `python-jose[cryptography]==3.3.0`
   - `passlib[bcrypt]==1.7.4`
   - `redis==5.0.4`
   - `python-multipart==0.0.9`
   - `httpx==0.27.0` (for health checks)
2. `backend/app/config.py` — pydantic-settings `Settings` class reading all `.env` variables listed above
3. `backend/app/main.py` — FastAPI app with:
   - CORS middleware (reads `CORS_ORIGINS` from settings)
   - APIRouter includes for health, auth, sessions (stubs OK for now)
   - Lifespan event that creates DB tables on startup
4. `.env.example` as specified above

**Verification**:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# GET http://localhost:8000/docs should show the OpenAPI UI
```

---

### Phase 2: Database Models & Migrations

**Goal**: Define all SQLAlchemy models and run Alembic migrations.

**Deliverables**:
1. `backend/app/db/database.py`:
   - `engine` using `DATABASE_URL` from settings
   - `SessionLocal` factory
   - `Base` declarative base
   - `get_db()` FastAPI dependency
2. `backend/app/db/models.py` with three models:
   - `User`: id (PK), username (unique), hashed_password, created_at
   - `Session`: session_id (UUID PK), user_id (FK→User), created_at, interaction_count
   - `InteractionLog`: all columns from the table contract above
3. Alembic init + initial migration:
   ```bash
   cd backend
   alembic init app/db/migrations
   alembic revision --autogenerate -m "initial schema"
   alembic upgrade head
   ```

**Verification**:
```bash
# After alembic upgrade head:
python -c "from app.db.models import User, Session, InteractionLog; print('Models OK')"
```

---

### Phase 3: Security Middleware & Auth

**Goal**: Input sanitization, rate limiting, and JWT auth endpoints.

**Deliverables**:
1. `backend/app/security/sanitizer.py`:
   - `sanitize_input(text: str) -> str`: strips HTML, control characters
   - `detect_prompt_injection(text: str) -> bool`: returns True if suspicious patterns found (e.g. "ignore previous instructions", "system prompt", jailbreak patterns)
   - Raise `HTTPException(400, "Rejected input")` if injection detected
2. `backend/app/security/rate_limiter.py`:
   - Redis-backed middleware
   - 60 requests/minute per IP for `/api/v1/chat`
   - 10 requests/minute per IP for `/api/v1/auth/login`
   - Return HTTP 429 with `Retry-After` header when exceeded
3. `backend/app/security/auth.py`:
   - `create_access_token(data: dict) -> str`
   - `create_refresh_token(data: dict) -> str`
   - `verify_token(token: str) -> dict` — raises `HTTPException(401)` on invalid/expired
   - `get_current_user` FastAPI dependency
   - `hash_password(password: str) -> str` using passlib bcrypt
   - `verify_password(plain: str, hashed: str) -> bool`
4. `backend/app/api/auth.py` — three endpoints from the contract above
5. Seed script `backend/scripts/seed_demo_user.py` — creates a demo user with credentials printed to stdout for the demo

**Verification**:
```bash
cd backend && python -m pytest tests/test_auth.py -v
# Tests should cover: login success, login wrong password, token refresh, logout
```

---

### Phase 4: Sessions & Health Endpoints

**Goal**: Sessions CRUD and a live health check.

**Deliverables**:
1. `backend/app/api/sessions.py` — POST and GET endpoints from contract
2. `backend/app/api/health.py`:
   - Ping Redis with `redis.ping()`
   - Ping ChromaDB with `httpx.get(f"http://{CHROMA_HOST}:{CHROMA_PORT}/api/v1/heartbeat")`
   - Return `{"backend": "ok", "redis": "ok|error", "chromadb": "ok|error"}`
3. `backend/app/schemas/sessions.py` — Pydantic request/response models
4. `backend/app/schemas/auth.py` — Pydantic request/response models

**Verification**:
```bash
cd backend && python -m pytest tests/ -v
# All endpoints return correct HTTP status codes
# GET /api/v1/health returns 200 with expected shape
```

---

### Phase 5: Handoff

**Goal**: Make sure Person 2 and Person 3 can build on your foundation.

**Deliverables**:
1. `backend/README.md` — instructions to install deps, run migrations, seed demo user, and start the server
2. Verify all routes appear in `GET /docs`
3. Push your branch (`git push -u origin backend-core`); tell Person 2 they can now implement `app/api/chat.py` and `app/api/metrics.py` using your `get_db` dependency and `InteractionLog` model
4. Tell Person 3 the base URL is `http://localhost:8000` and share the demo user credentials

---

## Dependencies on Other Developers

| Phase | Depends on | What you need |
|-------|-----------|---------------|
| All phases | Nobody | You are the foundation; start immediately |
| Phase 5 handoff | Person 2 + Person 3 | Coordinate interface shapes if they find gaps |

---

## Conventions

- All Python files use **type hints** throughout
- All FastAPI path functions are **async**
- Pydantic models use `model_config = ConfigDict(from_attributes=True)` for ORM mode
- Never commit real API keys — `.env` is gitignored, only `.env.example` is committed
- All DB access goes through the `get_db()` dependency injection — no global sessions
- Use `python-jose` for JWT, `passlib[bcrypt]` for passwords — do not use other crypto libraries
- Error responses always use FastAPI's `HTTPException` — never return raw dicts for errors
- Follow the directory structure exactly as shown above — Person 2 and Person 3 depend on these paths
