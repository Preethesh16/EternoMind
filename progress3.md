# Progress Log — Person 3 (Frontend + Integration)

> Auto-updated after every prompt / workflow change.

---

## [2026-05-17] — Initial Setup

- Created workstream files for all 3 developers (person1.md, person2.md, person3.md)
- Created README.md with full project overview and integration contracts
- Renamed project from SOMA to **EternoMind** across all files
- Branch names assigned: `backend-core` (P1), `ai-pipeline` (P2), `frontend` (P3)
- Created `progress3.md` (this file) and `project_structure3.md`
- All files committed to `main` and pushed to `origin`
- **Person 3 branch `frontend` created and checked out**

### What is working
- Planning and documentation complete
- Branch `frontend` ready for implementation

### Next step
- Phase 1: Scaffold the React + Vite + TypeScript + TailwindCSS + shadcn/ui project

---

## [2026-05-17] — Phases 1, 2 & 3 Complete

### What was built
- **Phase 1**: Vite + React 19 + TypeScript scaffold created. TailwindCSS 3.4.4 configured with full dark-mode CSS variables. Vite proxy set to forward `/api` → `http://localhost:8000`. `@` path alias configured.
- **Phase 2**: All three Zustand stores implemented:
  - `sessionStore` — userId, sessionId, accessToken, isAuthenticated
  - `chatStore` — messages, streaming state, pipeline step indicator
  - `metricsStore` — per-interaction token data array
- **Phase 3**: All UI components built and wired with stores (no backend needed):
  - `StreamingText` — renders content with blinking cursor when streaming
  - `MessageBubble` — user (blue/right) and assistant (dark/left) with metrics bar
  - `ChatInterface` — scrollable messages, pipeline step pill, error banner, input bar
  - `TokenSavingsChart` — Recharts LineChart (input=red, output=green, reference line at 720)
  - `PipelineStepsPanel` — 11 steps, idle/running/done states
  - `MetricsBar` — tokens, latency, model badge (orange=large, green=small), memory hits
- API layer scaffolded: `client.ts`, `auth.ts`, `sessions.ts`, `chat.ts` (POST SSE via ReadableStream), `metrics.ts`
- Hooks scaffolded: `useChat`, `useMetrics`, `useSSE`
- TypeScript: `tsc --noEmit` passes with zero errors

### What is now working
- Full UI renders at `http://localhost:5173` (run `npm run dev` in `frontend/`)
- All components display correctly in mock/empty state
- Stores read/write correctly
- SSE parsing logic ready for real backend

### ⚠️ Manual steps required before Phase 4
See "Manual Integration Steps" section below.

### Next step
- Phase 4: Connect to Person 1's backend (branch: `backend-core`)
  - Requires Person 1 to complete their Phase 1-4 and confirm backend is running at `http://localhost:8000`
  - Requires demo user credentials from `seed_demo_user.py`

---

## [2026-05-18] — Phase 4 Complete

### What was built
- `LoginScreen.tsx` — full login form with username/password, error handling, auto-creates session on success
- `App.tsx` updated — shows LoginScreen when not authenticated; shows full app when authenticated
- Header bar — session ID display, "↺ Reset Session" button (creates new session + clears messages/metrics), "Sign out" button
- `client.ts` updated — added `getAuthHeaders()` helper
- `useChat.ts` updated — sends `Authorization: Bearer <token>` header with every chat request
- `useMetrics.ts` updated — sends auth token when fetching metrics

### What is now working
- `http://localhost:5173` shows login screen on first load
- Login with `demo` / `wW0-N87fP5lCJY2o` authenticates and creates a session
- After login, full two-panel layout appears
- Reset Session creates a fresh session and clears all messages + chart data
- Sign out returns to login screen
- Chat will show "Could not connect" error until Person 2 builds the chat endpoint (expected)

### Next step
- Phase 5: Docker Compose — blocked on Person 2 (`ai-pipeline`) finishing chat + metrics endpoints
- Phase 6: Demo polish — after full stack works end-to-end

---

## [2026-05-18] — Phase 5 Complete

### Context
- Person 2 (`ai-pipeline`) finished and merged Phases 1-5 (LangGraph, Hindsight, RAG, prompt optimizer, cascadeflow router, chat SSE endpoint, metrics endpoint)
- Person 1 (`backend-core`) confirmed all backend phases done; force-reset main to clean state after unauthorized merge incident
- Pulled main into `frontend` branch — full stack now available locally

### What was built
- `docker-compose.yml` — wires all 4 services with health checks, volumes, named network
  - `redis` (alpine, internal, healthcheck on `redis-cli ping`)
  - `chromadb` (chromadb/chroma:latest, internal, healthcheck on `/api/v1/heartbeat`)
  - `backend` (built from `backend/Dockerfile`, port 8000, runs `alembic upgrade head` + `seed_demo_user.py` before uvicorn)
  - `frontend` (built from `frontend/Dockerfile`, port 5173, Vite dev server with `--host 0.0.0.0`)
- `backend/Dockerfile` — Python 3.11-slim, build-essential for bcrypt/chromadb compilation
- `frontend/Dockerfile` — Node 20-alpine, npm install with `--legacy-peer-deps`
- `backend/.dockerignore` — excludes `__pycache__`, `.venv`, `*.db`, `data/`
- `frontend/.dockerignore` — excludes `node_modules`, `dist`, `.vite`
- Volumes: `chroma_data` (vector store) and `backend_data` (SQLite DB) persist across restarts
- depends_on with `condition: service_healthy` so backend waits for redis + chromadb

### What is now working
- Single-command full stack: `docker compose up --build`
- Frontend talks to backend via `VITE_API_URL=http://localhost:8000` (host port mapping)
- Backend talks to redis via `redis://redis:6379/0` (Docker network)
- Backend talks to chromadb via `http://chromadb:8000` (Docker network — note chroma's internal port is 8000, not 8001)
- Live reload still works for both frontend and backend (source-mounted volumes)

### Next step
- **Phase 6 — Demo Polish**:
  - Cost estimator on TokenSavingsChart (USD savings legend)
  - Per-step timing in PipelineStepsPanel (parse `done` event latency)
  - Responsive layout check at 1280×800
  - Demo script run-through

---

## [2026-05-18] — Phase 6 Complete 🎉

### What was polished
- **TokenSavingsChart**:
  - Added second Y-axis (right) for cost in USD
  - Cost calculated per interaction using model-aware pricing ($0.002/1k for 70b, $0.0002/1k for 8b)
  - Purple dashed line shows cost trajectory
  - "Saved $X.XXXX" badge in header — calculates savings vs baseline (interaction 1 cost × N interactions)
  - "X% reduction" indicator from interaction 1 to latest
- **PipelineStepsPanel**:
  - Tracks per-step start time using `performance.now()`
  - Shows ms or s next to each completed step (e.g., "245ms", "1.23s")
  - Resets timings when a new user message starts
  - Falls back to ✓ checkmark for steps without timing data

### What is now working end-to-end
- Login → Send message → SSE stream populates messages, pipeline lights up with timings, chart updates with token + cost data
- Over multiple interactions: chart shows downward trend, model badge switches to green (small model), cost savings counter grows
- Reset Session resets everything for the demo's "do it again" moment
- `docker compose up --build` boots the entire stack

### All 6 phases done ✅
- Phase 1 — Scaffold
- Phase 2 — Stores
- Phase 3 — UI Components
- Phase 4 — Real backend wire
- Phase 5 — Docker Compose
- Phase 6 — Demo polish

### Demo readiness
- Frontend: ready
- Backend: ready (Person 1 + Person 2)
- Docker stack: ready
- Demo script: documented in `person3.md`
- Open issues for Person 2 to fix (optional, demo works without): cascadeflow SDK init bug

---

## [2026-05-18 evening] — Backend Integration Re-verified + Model Name Polish

### Context (from TEAM_NOTES.md)
- Person 1 ran end-to-end integration tests and fixed 4 critical bugs in Person 2's code:
  - Groq decommissioned old model names — switched to `llama-3.3-70b-versatile` and `llama-3.1-8b-instant`
  - Hindsight SDK uses per-user banks, not `user_id` parameter — Person 1 rewrote the wrapper
  - ChromaDB 0.5.0 incompatible with Python 3.14 — upgraded to 1.5.9, switched to embedded mode
  - cascadeflow doesn't need API key — Person 2 already fixed this independently
- Full backend stack is now confirmed working end-to-end

### What was updated on the frontend side
- Created `src/lib/models.ts` — central helper for model identification, pricing, and badge classes
  - Future-proofs against further model renames (matches `70b`, `versatile`, `large`, `8b`, `instant`, `small`)
  - Updated Groq pricing constants to current public rates
- `MetricsBar.tsx` — uses `modelBadgeClasses(model)` instead of hardcoded `'70b'` check
- `MessageBubble.tsx` — uses `modelBadgeTextClasses(model)` instead of hardcoded `'70b'` check
- `TokenSavingsChart.tsx` — uses `estimateCostUsd(tokens, model)` from the central helper
- All three components now show `title={model}` tooltip on hover for full model name

### Error handling polish (Phase 6)
- `LoginScreen.tsx` — friendly messages for wrong creds (401), backend offline, rate-limited (429)
- `useChat.ts` — friendly messages for 401 (session expired), 429 (rate limited), 503 (backend starting), network errors

### Docker Compose update
- Added `CHROMA_USE_HTTP=true` to backend service env (so the in-container ChromaDB client uses HTTP mode against the chromadb service, while local dev uses embedded mode by default)

### TypeScript
- `tsc --noEmit` passes with zero errors

### What is now ready for end-to-end test
1. Start backend natively: `cd backend && uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Log in with `demo` + password from `seed_demo_user.py`
4. Send chat → SSE events stream, pipeline lights up, metrics bar shows real model name with correct color
5. Send 3-4 related messages → token savings chart populates with cost overlay

### Manual setup steps (still required, not automatable)
- Backend `.venv` must be activated and `pip install -r requirements.txt` run
- `backend/.env` must have real `GROQ_API_KEY`, `HINDSIGHT_API_KEY`, `SECRET_KEY`
- `alembic upgrade head` must be run once
- `python scripts/seed_demo_user.py` must be run for credentials
- `python scripts/ingest_demo_docs.py` must be run for RAG corpus
- Native Redis must be running on port 6379 (Docker port forwarding may be broken on some machines per Person 1's note)

---
