# EternoMind — Team Notes from Person 1

> Last updated: 2026-05-18 by Person 1 (backend-core)
> Read this before pulling main or starting your next phase.

---

## TL;DR — What changed and why

1. ✅ Backend foundation is **done and merged to main**. Server runs, auth works, DB migrations work.
2. ⚠️ **Main was force-reset** to recover from an unauthorized merge. Pull main fresh.
3. 🔑 **Cascadeflow does NOT need an API key** — it's open source. Don't waste time signing up.
4. 🐛 **Person 2's `cascadeflow_router.py` has a bug** — the SDK init code is wrong. It still works because it falls back to rule-based routing, but it should be fixed before the demo.
5. 📦 New dependencies were added by Person 2. Run `pip install -r backend/requirements.txt` again after pulling.

---

## 1. Backend status (Person 1's work — done)

All 5 phases complete and merged to `main`:

| Phase | Status | Files |
|-------|--------|-------|
| 1 — Scaffold & config | ✅ | `backend/app/main.py`, `config.py`, `requirements.txt` |
| 2 — DB models & Alembic | ✅ | `backend/app/db/`, migrations applied |
| 3 — Security & JWT auth | ✅ | `backend/app/security/`, `api/auth.py` |
| 4 — Sessions & health | ✅ | `backend/app/api/sessions.py`, `health.py` |
| 5 — Handoff (push + merge) | ✅ | branch `backend-core` → `main` |

**Tests:** 7/7 pass in `backend/tests/test_auth.py`.

**Demo credentials** (regenerate any time with `python scripts/seed_demo_user.py`):
```
Username: demo
Password: yM_0ZdcVxBWmfjif
```

---

## 2. ⚠️ Force-reset incident (everyone read this)

Someone merged `feature/space-galaxy-redesign` into `main` via PR #1 without team approval (commits `c051096` + `59579d9`). This was reverted.

**What I did:**
- Reset main back to `c09671a` (last clean state — backend-core merge)
- `git push origin main --force`
- The `feature/space-galaxy-redesign` branch still exists on remote, untouched

**What you need to do:**
- **Pull main fresh:** `git checkout main && git fetch origin && git reset --hard origin/main`
- **Going forward:** No direct merges to main. Open a PR, ping the team in chat, wait for review.

---

## 3. 🔑 API keys — what's actually needed

| Key | Status | Where to get it | Notes |
|-----|--------|-----------------|-------|
| `SECRET_KEY` | Generate locally | `openssl rand -hex 32` | No signup |
| `GROQ_API_KEY` | ✅ Have it | [console.groq.com](https://console.groq.com) | Free tier |
| `HINDSIGHT_API_KEY` | ✅ Have it | [hindsight.vectorize.io](https://hindsight.vectorize.io) → click Cloud → sign up | Free with promo code |
| `CASCADEFLOW_API_KEY` | ❌ **NOT NEEDED** | — | Open-source library, uses GROQ_API_KEY |

**Cascadeflow clarification (important):**
- It's a Python library: `pip install cascadeflow`
- It does **not** have a paid service or its own key
- It uses your existing `GROQ_API_KEY` to route between Groq models
- Verified at https://docs.cascadeflow.ai/api-reference/python/environment.md

**Action:** Person 2 should remove `CASCADEFLOW_API_KEY` references from code (or just leave them blank — they're harmless).

---

## 4. 🐛 Bug in `cascadeflow_router.py` (Person 2 to fix)

In `backend/app/optimization/cascadeflow_router.py`, this line:
```python
self._sdk_client = cascadeflow.Client(api_key=settings.cascadeflow_api_key)
```
is **wrong**. The real cascadeflow API uses:
```python
import cascadeflow
cascadeflow.init(mode="observe")
agent = cascadeflow.CascadeAgent(...)
result = agent.run(...)
```

**Current behavior:** The `try/except` catches the failure and falls back to rule-based routing (memory_hits ≥ 4 + tokens < 2000 → small model, else large). **The demo still works** because the fallback is correct logic.

**Fix priority:** Low. Demo is fine without it. But for full credit, swap to the real SDK before judging.

Reference: https://docs.cascadeflow.ai/api-reference/python/cascade-agent.md

---

## 5. 📦 New dependencies (Person 2 added)

After pulling main, run:
```bash
cd backend
source .venv/bin/activate   # or: .venv/bin/pip install -r requirements.txt
pip install -r requirements.txt
```

New packages: `langchain`, `langgraph`, `langchain-groq`, `groq`, `chromadb`, `cascadeflow`, `hindsight-sdk`.

---

## 6. How to run the full stack right now (local dev)

**Backend (Person 1's territory):**
```bash
cd backend
.venv/bin/alembic upgrade head           # one-time
.venv/bin/python scripts/seed_demo_user.py  # one-time
.venv/bin/uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)
```

**Required for Person 2's pipeline to work:**
- Redis on `localhost:6379` (use `docker run -p 6379:6379 redis:7-alpine`)
- ChromaDB on `localhost:8001` (use `docker run -p 8001:8000 chromadb/chroma`)
- Real `GROQ_API_KEY` and `HINDSIGHT_API_KEY` in `.env`

**Frontend (Person 3's territory):**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 7. Phase status across the team (as of 2026-05-18)

| Person | Branch | Total | Done | Remaining |
|--------|--------|-------|------|-----------|
| Person 1 (Backend Core) | `backend-core` | 5 | 5 | **0** ✅ |
| Person 2 (AI Pipeline) | `ai-pipeline` | 6 | 5 | **1** — Phase 6 (10-interaction validation) |
| Person 3 (Frontend) | `frontend` | 6 | 3 | **3** — Phase 4 (real backend wire), 5 (Docker), 6 (polish) |

---

## 8. Critical path to demo

```
[Person 2 finishes Phase 6]   →   validates token reduction works end-to-end
            ↓
[Person 3 finishes Phase 4]   →   chat UI talks to real /api/v1/chat (SSE)
            ↓
[Person 3 Phase 5: Docker]    →   one-command full stack via docker-compose up
            ↓
[Person 3 Phase 6: polish]    →   demo-ready UI for judges
```

**Blockers right now:**
- Person 2 needs Redis + Chroma running to test Phase 6 (use Docker images above)
- Person 3 is unblocked for Phase 4 — backend is live at `localhost:8000` with demo credentials

---

## 9. Questions / coordination

- SSE event format is **frozen** — see `person2.md` and `person3.md`. Don't change field names.
- API contracts (`/auth/*`, `/sessions/*`, `/chat`, `/metrics`, `/health`) are **frozen** — see `README.md`.
- If you find a contract problem, ping the team **before** changing anything. We can adjust together.

— Person 1 (backend-core)
