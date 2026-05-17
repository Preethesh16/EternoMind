# Progress Log — Person 1 (Backend Core)

> Auto-updated after every prompt / workflow change in this session.

---

## [2026-05-17] — Branch Created & Work Begins

- Pulled latest `main` from `origin` (79 objects fetched)
- Created and checked out branch `backend-core`
- Created `progress1.md` (this file) and `project_structure1.md`
- Created `.env.example` with all required keys + comments

---

## [2026-05-17] — Phases 1–4 Complete ✅

### What was built

**Phase 1 — Scaffold & Configuration**
- `backend/requirements.txt` — pinned deps (SQLAlchemy 2.0.36, Alembic 1.14.0, bcrypt 4.2.1 to support Python 3.14)
- `backend/app/config.py` — pydantic-settings `Settings` class, reads `.env`, `cors_origins_list` property
- `backend/app/main.py` — FastAPI app, CORS middleware, `RateLimitMiddleware`, lifespan creates DB tables, all routers registered

**Phase 2 — Database Models & Migrations**
- `backend/app/db/database.py` — `engine`, `SessionLocal`, `Base`, `get_db()` dependency
- `backend/app/db/models.py` — `User`, `ChatSession`, `InteractionLog` ORM models with all contractual columns
- Alembic initialized and configured (`env.py` reads `settings.database_url`)
- Initial migration generated: detects `users`, `sessions`, `interaction_logs` tables
- `alembic upgrade head` — migration applied, `eternomind.db` created

**Phase 3 — Security Middleware & Auth**
- `backend/app/security/sanitizer.py` — `sanitize_input()`, `detect_prompt_injection()`, `validate_and_sanitize()`; 12 injection patterns
- `backend/app/security/rate_limiter.py` — Redis-backed `RateLimitMiddleware`; 60 req/min on `/chat`, 10 req/min on `/auth/login`; fails open if Redis down
- `backend/app/security/auth.py` — `hash_password()` / `verify_password()` (direct bcrypt), `create_access_token()`, `create_refresh_token()`, `verify_token()`, `get_current_user` dependency
- `backend/app/api/auth.py` — `/auth/login`, `/auth/refresh`, `/auth/logout` endpoints
- `backend/scripts/seed_demo_user.py` — idempotent, prints credentials to stdout

**Phase 4 — Sessions & Health Endpoints**
- `backend/app/schemas/auth.py` — `LoginRequest`, `TokenResponse`, `AccessTokenResponse`, `LogoutResponse`
- `backend/app/schemas/sessions.py` — `CreateSessionRequest`, `SessionResponse`, `SessionDetailResponse`
- `backend/app/api/sessions.py` — `POST /api/v1/sessions` (201), `GET /api/v1/sessions/{id}` (200/404)
- `backend/app/api/health.py` — pings Redis + ChromaDB, always returns 200 with status fields
- `backend/README.md` — setup instructions for the whole team

### Tests
- `backend/tests/test_auth.py` — 7 tests: login success, wrong password, unknown user, token refresh, wrong token type on refresh, logout, logout without token
- **All 7 tests pass** ✅

### Compatibility notes
- Python 3.14 only system — pinned SQLAlchemy 2.0.36, Alembic 1.14.0 (3.14-compatible)
- Replaced `passlib[bcrypt]` (unmaintained, breaks on bcrypt >=4) with direct `bcrypt==4.2.1`
- Test engine uses `StaticPool` so in-memory SQLite shares one connection across requests

### Demo credentials
```
Username: demo
Password: wW0-N87fP5lCJY2o
```
(Regenerate at any time by running `python scripts/seed_demo_user.py`)

### What is now working
- FastAPI server starts: `uvicorn app.main:app --reload` from `backend/`
- All routes appear in `http://localhost:8000/docs`
- Auth endpoints fully functional with JWT
- SQLite DB created and migrated
- Rate limiting middleware loaded (Redis optional — fails open)
- Health endpoint pings Redis and ChromaDB

### ⚠️ Manual steps required

See `project_structure1.md` → "Manual Integration Steps Required" section:
1. Copy `.env.example` to `.env` and add a real `SECRET_KEY` (`openssl rand -hex 32`)
2. Run `alembic upgrade head` once per fresh checkout
3. Run `python scripts/seed_demo_user.py` to get demo login credentials

### Next step
- **Phase 5**: Push branch, coordinate with Person 2 and Person 3
  - Person 2 can now implement `app/api/chat.py` and `app/api/metrics.py`
  - Person 3 can connect to `http://localhost:8000` with demo credentials

---
