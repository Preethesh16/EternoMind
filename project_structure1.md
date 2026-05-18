# EternoMind — Project Structure & Concept (Person 1 View)

> Owned by: **Person 1 (Backend Core)**
> Branch: `backend-core`
> Last updated: 2026-05-17

---

## Core Idea

EternoMind is a Self-Optimizing Memory-Aware AI Runtime. Memory IS the token optimization system — every interaction stores compressed operational learnings in Hindsight, so the next similar query costs far fewer tokens and can be routed to a cheaper Groq model. Token count drops from ~15,000 on interaction 1 to ~720 on interaction 10.

**Person 1 owns the backend foundation** — the FastAPI app scaffold, SQLite database models, Alembic migrations, security middleware (sanitization, rate limiting), JWT authentication, sessions, and health endpoints. Everything else (AI pipeline, frontend) builds on top of this layer.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│             EternoMind Backend API (Port 8000)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  /auth/*     │  │  /sessions/* │  │   /health        │   │
│  │  login       │  │  POST create │  │   redis ping     │   │
│  │  refresh     │  │  GET detail  │  │   chromadb ping  │   │
│  │  logout      │  └──────────────┘  └──────────────────┘   │
│  └──────────────┘                                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Security Middleware                                  │    │
│  │  sanitizer.py · rate_limiter.py · auth.py (JWT)      │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Database Layer                                       │    │
│  │  SQLAlchemy ORM · SQLite · Alembic migrations         │    │
│  │  Models: User, Session, InteractionLog                │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
         ↑                         ↑
  Person 2 uses:             Person 3 uses:
  get_db, InteractionLog     /auth, /sessions, /health
```

---

## Tech Stack (Person 1 Scope)

| Layer | Technology | Version |
|-------|-----------|---------|
| API Framework | FastAPI | 0.111.0 |
| ASGI Server | Uvicorn | 0.29.0 |
| Settings | pydantic-settings | 2.2.1 |
| ORM | SQLAlchemy | 2.0.30 |
| Migrations | Alembic | 1.13.1 |
| JWT | python-jose[cryptography] | 3.3.0 |
| Password Hashing | passlib[bcrypt] | 1.7.4 |
| Caching/Rate Limiting | Redis | 5.0.4 |
| HTTP Client (health) | httpx | 0.27.0 |
| Database | SQLite (file: eternomind.db) | — |

---

## Directory Structure (Person 1 Owns)

```
eternomind/
├── .env.example                    ← API keys template (no real values)
│
└── backend/
    ├── requirements.txt            ← pinned Python deps
    ├── README.md                   ← setup instructions
    ├── alembic.ini                 ← Alembic config
    ├── scripts/
    │   └── seed_demo_user.py       ← creates demo user, prints credentials
    ├── tests/
    │   └── test_auth.py            ← auth endpoint tests
    └── app/
        ├── main.py                 ← FastAPI app, CORS, routers, lifespan
        ├── config.py               ← pydantic-settings Settings class
        ├── security/
        │   ├── __init__.py
        │   ├── sanitizer.py        ← strip HTML, detect prompt injection
        │   ├── rate_limiter.py     ← Redis-backed rate limiting (429)
        │   └── auth.py             ← JWT create/verify, bcrypt, get_current_user
        ├── db/
        │   ├── __init__.py
        │   ├── database.py         ← engine, SessionLocal, Base, get_db()
        │   ├── models.py           ← User, Session, InteractionLog ORM models
        │   └── migrations/         ← Alembic-generated files
        ├── schemas/
        │   ├── __init__.py
        │   ├── auth.py             ← LoginRequest, TokenResponse, etc.
        │   └── sessions.py         ← CreateSessionRequest, SessionResponse, etc.
        └── api/
            ├── __init__.py
            ├── health.py           ← GET /api/v1/health
            ├── auth.py             ← POST /api/v1/auth/login, /refresh, /logout
            └── sessions.py         ← POST /api/v1/sessions, GET /api/v1/sessions/{id}
```

---

## API Contracts (Person 1 implements, others consume)

### POST /api/v1/auth/login
- Request: `{ "username": str, "password": str }`
- Response 200: `{ "access_token": str, "refresh_token": str, "token_type": "bearer" }`
- Response 401: `{ "detail": "Invalid credentials" }`

### POST /api/v1/auth/refresh
- Header: `Authorization: Bearer <refresh_token>`
- Response 200: `{ "access_token": str, "token_type": "bearer" }`

### POST /api/v1/auth/logout
- Header: `Authorization: Bearer <access_token>`
- Response 200: `{ "message": "Logged out" }`

### POST /api/v1/sessions
- Request: `{ "user_id": str }`
- Response 201: `{ "session_id": str, "created_at": "ISO8601" }`

### GET /api/v1/sessions/{session_id}
- Response 200: `{ "session_id": str, "user_id": str, "created_at": "ISO8601", "interaction_count": int }`
- Response 404: `{ "detail": "Session not found" }`

### GET /api/v1/health
- Response 200: `{ "backend": "ok", "redis": "ok|error", "chromadb": "ok|error" }`

### interaction_logs table (defined by P1, written by P2)
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PK AUTOINCREMENT |
| session_id | TEXT | NOT NULL, FK→sessions |
| user_id | TEXT | NOT NULL |
| interaction_number | INTEGER | NOT NULL |
| token_count_input | INTEGER | NOT NULL |
| token_count_output | INTEGER | NOT NULL |
| model_used | TEXT | NOT NULL |
| memory_hits | INTEGER | NOT NULL DEFAULT 0 |
| latency_ms | REAL | NOT NULL |
| created_at | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP |

---

## Phase Completion

- ✅ **Phase 1** — Project Scaffold & Configuration
- ✅ **Phase 2** — Database Models & Migrations
- ✅ **Phase 3** — Security Middleware & Auth
- ✅ **Phase 4** — Sessions & Health Endpoints
- ✅ **Phase 5** — Handoff (branch pushed + merged to main)

**🟢 All 5 phases complete. Person 1 work is done.**

---

## Key Decisions & Notes

- All DB access goes through `get_db()` dependency — no global sessions
- JWT uses `python-jose`, passwords use `passlib[bcrypt]` — no other crypto libs
- Error responses always use `HTTPException` — never raw dicts
- Rate limits: 60 req/min per IP on `/chat`, 10 req/min per IP on `/auth/login`
- `.env` is gitignored — only `.env.example` is committed
- All path functions are `async`, all models use `ConfigDict(from_attributes=True)`

---

## Manual Integration Steps Required

> ⚠️ These steps require manual action before the backend can run

### 1. Environment Variables
After cloning, copy `.env.example` to `.env` and fill in:
- `SECRET_KEY` — generate with `openssl rand -hex 32` (no signup needed)
- `GROQ_API_KEY` — from [console.groq.com](https://console.groq.com) (free tier)
- `HINDSIGHT_API_KEY` — from [hindsight.vectorize.io](https://hindsight.vectorize.io) → click "Cloud" → sign up
- `CASCADEFLOW_API_KEY` — **NOT REQUIRED**. cascadeflow is open-source (`pip install cascadeflow`) and uses your `GROQ_API_KEY` directly. Verified at [docs.cascadeflow.ai/api-reference/python/environment.md](https://docs.cascadeflow.ai/api-reference/python/environment.md)

### 2. Database Migration
```bash
cd backend
alembic upgrade head
```

### 3. Seed Demo User
```bash
cd backend
python scripts/seed_demo_user.py
# Prints: Demo user created — username: demo, password: <generated>
```

### 4. Start the Server
```bash
cd backend
uvicorn app.main:app --reload
```

---

## API Key Status (as of 2026-05-18)

| Service | Status | Notes |
|---------|--------|-------|
| `SECRET_KEY` | ✅ Generated | Local `.env` only, never committed |
| `GROQ_API_KEY` | ✅ Obtained | From console.groq.com (free tier) |
| `HINDSIGHT_API_KEY` | ✅ Obtained | From hindsight.vectorize.io (free with promo code) |
| `CASCADEFLOW_API_KEY` | ❌ Not needed | Open-source library, uses GROQ_API_KEY |

---

## Team Coordination Notes

**2026-05-18 — Unauthorized commit recovery**
- A teammate force-merged `feature/space-galaxy-redesign` to main without approval
- Reset main back to commit `c09671a` (last clean state — backend-core merge)
- `git push --force origin main` to overwrite remote
- Going forward: all work must go through PRs reviewed before merging to main

---
