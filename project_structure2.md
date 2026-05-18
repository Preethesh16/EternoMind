# EternoMind — Project Structure & Concept (Person 2 View)

> Owned by: **Person 2 (AI/Agent Pipeline)**
> Branch: `ai-pipeline`
> Last updated: 2026-05-18 (evening — Phase 6 validated)

---

## Core Idea

EternoMind is a Self-Optimizing Memory-Aware AI Runtime. Memory IS the token optimization system — every interaction stores compressed operational learnings in Hindsight, so the next similar query costs far fewer tokens and can be routed to a cheaper Groq model via cascadeflow. Token count drops from ~15,000 on interaction 1 to ~720 on interaction 10.

**Person 2 owns the intelligence core** — the LangGraph state machine, Hindsight persistent memory integration, ChromaDB RAG retrieval, Prompt Optimizer, and cascadeflow model routing. This is where EternoMind's self-optimization actually happens.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                    EternoMind AI Pipeline                             │
│                                                                      │
│  POST /api/v1/chat  ──►  run_pipeline()  ──►  SSE stream             │
│                                │                                     │
│  ┌─────────────────────────────▼──────────────────────────────────┐  │
│  │                  LangGraph StateGraph                           │  │
│  │                                                                 │  │
│  │  [memory_retrieval] → [context_relevancy] → [rag_retrieval]    │  │
│  │       ↓ Hindsight SDK          ↓ score filter    ↓ ChromaDB    │  │
│  │                                                                 │  │
│  │  [prompt_optimizer] → [model_router] → [llm_inference]         │  │
│  │       ↓ compress ctx    ↓ cascadeflow    ↓ Groq stream          │  │
│  │                                                                 │  │
│  │  [validator] ──(fail, retry<1)──► [llm_inference]              │  │
│  │       ↓ pass                                                    │  │
│  │  [memory_updater] → END                                         │  │
│  │       ↓ Hindsight SDK                                           │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  GET /api/v1/metrics/{session_id}  ──►  interaction_logs table       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack (Person 2 Scope)

| Layer | Technology | Version |
|-------|-----------|---------|
| Agent Orchestration | LangGraph | 0.1.5 |
| LLM Framework | LangChain | 0.2.5 |
| Groq Integration | langchain-groq | 0.1.5 |
| Groq SDK | groq | 0.9.0 |
| Persistent Memory | Hindsight SDK (hindsight-client) | latest |
| Vector Store | ChromaDB | >=1.5.9 (was 0.5.0 — incompatible with Python 3.14) |
| Model Routing | cascadeflow | latest (open-source, NO API KEY) |
| LLM Inference | Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant) | — |

---

## Directory Structure (Person 2 Owns)

```
backend/app/
├── agents/
│   ├── __init__.py
│   ├── state.py                  ← LangGraph AgentState TypedDict
│   ├── graph.py                  ← LangGraph StateGraph definition
│   └── nodes/
│       ├── __init__.py
│       ├── memory_retrieval.py   ← Step 3: Hindsight memory fetch
│       ├── context_relevancy.py  ← Step 4: relevance scoring + filtering
│       ├── rag_retrieval.py      ← Step 5: ChromaDB similarity search
│       ├── prompt_optimizer.py   ← Step 6: token-minimizing rewrite
│       ├── model_router.py       ← Step 7: cascadeflow routing decision
│       ├── llm_inference.py      ← Step 8: Groq API call
│       ├── validator.py          ← Step 9: response quality check
│       └── memory_updater.py     ← Step 11: write new facts to Hindsight
├── memory/
│   ├── __init__.py
│   └── hindsight_client.py       ← Hindsight SDK wrapper
├── rag/
│   ├── __init__.py
│   ├── chroma_client.py          ← ChromaDB connection singleton
│   └── retriever.py              ← Document ingestion + similarity search
├── optimization/
│   ├── __init__.py
│   ├── prompt_optimizer.py       ← Prompt rewriting logic
│   └── cascadeflow_router.py     ← cascadeflow routing wrapper
├── runtime/
│   ├── __init__.py
│   └── pipeline.py               ← Entry point: run_pipeline(...)
└── api/
    ├── chat.py                   ← POST /api/v1/chat (SSE streaming)
    └── metrics.py                ← GET /api/v1/metrics/{session_id}
```

---

## The 12-Step Pipeline

| Step | Node | Description |
|------|------|-------------|
| 1 | FastAPI middleware | Security (Person 1) |
| 2 | LangGraph entry | Initialize AgentState |
| 3 | `memory_retrieval` | Hindsight SDK fetch |
| 4 | `context_relevancy` | Score & filter memories (≥ 0.65) |
| 5 | `rag_retrieval` | ChromaDB similarity search (k=5) |
| 6 | `prompt_optimizer` | Token-minimizing prompt rewrite |
| 7 | `model_router` | cascadeflow routing decision |
| 8 | `llm_inference` | Groq streaming API call |
| 9 | `validator` | Response quality check (retry once) |
| 10 | FastAPI SSE | Stream tokens to frontend (Person 3) |
| 11 | `memory_updater` | Write new facts to Hindsight |
| 12 | DB write | Insert row into `interaction_logs` |

---

## API Contracts (Person 2 implements, Person 3 consumes)

### POST /api/v1/chat
- Request: `{ "session_id": str, "message": str, "user_id": str }`
- Response: SSE stream with events: `pipeline_step`, `token`, `done`, `error`

### GET /api/v1/metrics/{session_id}
- Response: `{ "session_id": str, "interactions": [...] }`

### SSE Event Format
```
event: pipeline_step
data: {"step": "memory_retrieval", "status": "running"}

event: token
data: {"step": "response", "token_delta": "The "}

event: done
data: {"total_tokens": 720, "model": "llama-3.1-8b-instant", "latency_ms": 340.5, "memory_hits": 7}
```

---

## Phase Completion

- ✅ **Phase 1** — Hindsight Memory Integration *(per-user banks, async API, response.results extraction)*
- ✅ **Phase 2** — ChromaDB RAG *(chromadb 1.5.9, embedded mode)*
- ✅ **Phase 3** — Prompt Optimizer & cascadeflow Router *(real SDK init + rule-based fallback)*
- ✅ **Phase 4** — LangGraph State Machine *(all 8 nodes verified end-to-end)*
- ✅ **Phase 5** — Chat & Metrics API Endpoints *(SSE stream + InteractionLog write working)*
- ✅ **Phase 6** — Token Reduction Validation *(60% reduction over 10 interactions, model switch confirmed)*

🟢 **All 6 phases complete. Person 2 work is done.**

---

## Key Decisions & Notes

- All pipeline node functions are `async` and accept/return `AgentState`
- Hindsight and Groq are never called synchronously — always `await`
- Each pipeline step logs with `logging.getLogger(__name__).info(f"[{step_name}] ...")`
- ChromaDB, Hindsight, and cascadeflow clients are singletons initialized at app startup
- If Hindsight SDK raises, log and continue with empty memories — never block pipeline
- If cascadeflow is unavailable, fall back to rule-based routing (memory_hits >= 4 AND token_estimate < 2000)
- Model names come from `settings.groq_large_model` / `settings.groq_small_model` — never hardcoded

---

## Manual Integration Steps Required

> ⚠️ These steps require manual action before the AI pipeline can run

### 1. API Keys (add to `.env`)
```dotenv
GROQ_API_KEY=<your-key-from-console.groq.com>           # required
HINDSIGHT_API_KEY=<your-key-from-hindsight.vectorize.io> # required
CASCADEFLOW_API_KEY=                                     # NOT NEEDED — open-source library
```

### 2. Install New Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 3. ChromaDB — embedded mode (default, recommended)
No setup needed. ChromaDB will create `./chroma_data/` automatically on first run.

To use HTTP mode instead (Docker/production):
```bash
# In .env: CHROMA_USE_HTTP=true
docker run -p 8001:8000 chromadb/chroma:latest
```

### 4. Redis
On Arch Linux, install natively (Docker port forwarding may not work):
```bash
sudo pacman -S redis
redis-server --port 6379 &
```
On other systems:
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

### 5. Seed RAG Documents
```bash
cd backend
python scripts/ingest_demo_docs.py
```

### 6. Start the Backend
```bash
cd backend
uvicorn app.main:app --reload
```

---

## Dependencies on Other Developers

| Phase | Depends on | Status |
|-------|-----------|--------|
| Phases 1-3 | Nobody | ✅ Independent |
| Phase 4 | Person 1 Phase 1 | ✅ backend-core merged |
| Phase 5 | Person 1 Phases 1-2 | ✅ get_db + InteractionLog available |
| Phase 6 | Full stack via docker compose | ⏳ Needs Person 3 Phase 5 |

---
