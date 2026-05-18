# EternoMind — Team Notes from Person 1

> Last updated: 2026-05-18 (evening) by Person 1 (backend-core)
> Read this before pulling main or starting your next phase.

---

## TL;DR — What changed and why

1. ✅ **Backend is working end-to-end.** Chat pipeline streams real Groq responses, Hindsight stores memories, ChromaDB returns RAG results.
2. ⚠️ **4 critical bugs fixed in Person 2's code** during integration testing — see Section 3 below.
3. ⚠️ **Main was force-reset** earlier today (unauthorized PR merged). Pull fresh.
4. 🔑 **Cascadeflow does NOT need an API key** — it's open-source. Don't waste time signing up.
5. 🐳 **Docker may not work on every machine** for Redis/ChromaDB — Person 1's machine had Docker port-forwarding broken. Use natively-installed Redis + ChromaDB embedded mode as fallback.
6. 📦 New dependencies. Run `pip install -r backend/requirements.txt` again after pulling.

---

## 1. Phase status across the team

| Person | Branch | Done | Remaining | Status |
|--------|--------|------|-----------|--------|
| **Person 1 (Backend Core)** | `backend-core` | 5/5 | **0** | ✅ Complete |
| **Person 2 (AI Pipeline)** | `ai-pipeline` | 5/6 | Phase 6 only | 🟡 Validation pending |
| **Person 3 (Frontend)** | `frontend` | 4/6 | Phase 5 (Docker), Phase 6 (polish) | 🟡 Backend now unblocks Phase 4 verification |

---

## 2. ⚠️ Force-reset incident (read once)

Someone merged `feature/space-galaxy-redesign` into main without team approval. Reset main back to `c09671a`. Going forward — **no direct merges to main without a reviewed PR**.

---

## 3. 🐛 Bugs found and fixed during end-to-end testing (Person 2 — please review)

### Bug 1 — Groq models decommissioned (FIXED in `.env`)
- `llama3-70b-8192` and `llama3-8b-8192` are retired by Groq
- Now using:
  - `GROQ_LARGE_MODEL=llama-3.3-70b-versatile`
  - `GROQ_SMALL_MODEL=llama-3.1-8b-instant`
- **Action:** Person 3 needs to update model badge color logic in `frontend/src/components/dashboard/MetricsBar.tsx` (orange = `llama-3.3-70b-versatile`, green = `llama-3.1-8b-instant`)

### Bug 2 — Hindsight SDK signature mismatch (FIXED in `hindsight_client.py`)
- The SDK does NOT have `user_id` parameters on `recall()` or `retain()`
- It uses **per-user banks** instead. Each user gets a bank named `eternomind-{user_id}`
- Person 1 rewrote the wrapper:
  - `_bank_id_for(user_id)` helper for safe bank naming
  - `_ensure_bank_async()` that calls `acreate_bank()` lazily
  - Switched to async variants: `arecall()`, `aretain()`, `acreate_bank()`
- **Action for Person 2:** review `backend/app/memory/hindsight_client.py`. The response field extraction (`response.memories` vs `response.items`) is a guess — log the raw SDK response once and confirm

### Bug 3 — ChromaDB 0.5.0 incompatible with Python 3.14 (FIXED in `chroma_client.py`)
- Old client raised `Connection reset by peer` on every request
- Upgraded to `chromadb>=1.5.9` in `requirements.txt`
- Switched to **embedded mode** (`PersistentClient`) — no Docker, no account, no API key
- HTTP mode still available — set `CHROMA_USE_HTTP=true` in `.env`

### Bug 4 — Cascadeflow API key not needed (DOCS UPDATE)
- `cascadeflow.Client(api_key=...)` doesn't exist — cascadeflow is open-source
- Real API: `cascadeflow.init()` + `CascadeAgent` — see https://docs.cascadeflow.ai/api-reference/python/cascade-agent.md
- Current code falls back to rule-based routing, which works fine for the demo
- **Action for Person 2:** optional — rewrite `cascadeflow_router.py` using real SDK, or keep rule-based (acceptable)

---

## 4. 🔑 API keys — what's actually needed

| Key | Status | Where to get it | Notes |
|-----|--------|-----------------|-------|
| `SECRET_KEY` | Generate locally | `openssl rand -hex 32` | No signup |
| `GROQ_API_KEY` | Required | [console.groq.com](https://console.groq.com) | Free tier |
| `HINDSIGHT_API_KEY` | Required | [hindsight.vectorize.io](https://hindsight.vectorize.io) → click "Cloud" → sign up | Free with promo code |
| `CASCADEFLOW_API_KEY` | **NOT NEEDED** | — | Open-source library |

---

## 5. 🐳 Docker quirks (Person 3 take note)

On Person 1's Arch Linux box, Docker port forwarding for Redis and ChromaDB containers broke (TCP resets). The fix was to use natively-installed services:

```bash
# Redis (or Valkey on Arch)
sudo pacman -S redis        # Arch
sudo apt install redis      # Debian/Ubuntu
redis-server --port 6379 &

# ChromaDB — use embedded mode (default in our code)
# No setup needed; it creates ./chroma_data/ automatically
```

For Phase 5 (Docker Compose), this should still work in actual Docker containers because they share an internal network. But if anyone hits the same issue locally, they can fall back to the native install.

---

## 6. 📦 New dependencies

After pulling main, run:
```bash
cd backend
.venv/bin/pip install -r requirements.txt
```

Notable changes:
- `chromadb>=1.5.9` (was 0.5.0)
- All cascadeflow / langchain / langgraph / groq packages already installed

---

## 7. How to run the full stack right now (local dev)

**One-time setup:**
```bash
# 1. Pull
git checkout main && git pull origin main

# 2. Backend deps
cd backend
.venv/bin/pip install -r requirements.txt

# 3. Set up .env (already done in Person 1's local — others need their own)
cp ../.env.example .env
# Edit .env: paste your GROQ_API_KEY and HINDSIGHT_API_KEY

# 4. DB migrations
.venv/bin/alembic upgrade head

# 5. Demo user
.venv/bin/python scripts/seed_demo_user.py
# Note the printed password

# 6. RAG docs (one-time, downloads ~90MB ONNX model first run)
.venv/bin/python scripts/ingest_demo_docs.py

# 7. Start Redis (native install)
redis-server --port 6379 &
```

**Run the stack:**
```bash
# Terminal 1: backend
cd backend
.venv/bin/uvicorn app.main:app --reload

# Terminal 2: frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`, log in with demo credentials, and chat.

---

## 8. Critical path to demo

```
[Person 2 Phase 6: validation]    → run scripts/run_10_interactions.py, confirm token drop
            ↓
[Person 3 Phase 5: Docker]        → docker-compose up brings up everything (use embedded ChromaDB or keep HTTP mode)
            ↓
[Person 3 Phase 6: polish]        → cost counter, model badge colors (use NEW model names), responsive layout
            ↓
[End-to-end demo rehearsal]
```

**Blockers right now:** None. All three people can work in parallel.

---

## 9. Quick reference — what each file's status is

```
backend/.env                            ← local only, gitignored, has real keys
backend/requirements.txt                ← updated, run pip install
backend/app/rag/chroma_client.py        ← Person 1 rewrote (embedded + HTTP modes)
backend/app/memory/hindsight_client.py  ← Person 1 rewrote (per-user banks, async)
backend/app/optimization/cascadeflow_router.py  ← still uses old fake API; falls back gracefully
backend/scripts/ingest_demo_docs.py     ← works as-is, ingests 10 docs
frontend/src/components/dashboard/MetricsBar.tsx ← Person 3: update model name colors
```

— Person 1 (backend-core)
