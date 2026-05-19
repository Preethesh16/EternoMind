# EternoMind — Self-Optimizing Memory-Aware AI Runtime

> **Hackathon**: Building AI Agents with Hindsight & cascadeflow
> **Core Innovation**: Memory itself IS the token optimization system. Every interaction makes EternoMind smarter, cheaper, and faster.

---

## What is EternoMind?

EternoMind is an enterprise-grade AI runtime that uses persistent memory to continuously reduce the cost and latency of LLM inference. On the first interaction a user asks a question and EternoMind processes it through a full 12-step pipeline using ~15,000 tokens. By interaction 10 on the same topic, EternoMind recognizes the context from memory, routes to a smaller cached model, and answers with ~720 tokens — a **95% token reduction** with zero loss in answer quality.

**Mandatory Technologies**: [Hindsight](https://hindsight.so) (persistent memory) · [cascadeflow](https://cascadeflow.ai) (model routing intelligence) · [Groq](https://groq.com) (LLM inference)

---

## The 12-Step Pipeline

Every user message passes through this ordered pipeline:

1. **Security** — Input sanitization, prompt injection detection, rate-limit enforcement
2. **LangGraph Orchestration** — State machine entry point; coordinates all downstream steps
3. **Hindsight Memory Retrieval** — Fetch relevant memories from the user's persistent memory store
4. **Context Relevancy** — Score and filter retrieved memories; keep only high-relevance context
5. **RAG Retrieval** — Similarity search in ChromaDB for supporting documents
6. **Prompt Optimizer** — Rewrite the assembled prompt to minimize token count while preserving intent
7. **cascadeflow Routing** — Route to large model (novel query) or small/cached model (memory-covered)
8. **Groq LLM** — Execute inference via Groq API with the optimized prompt
9. **Validation** — Verify response quality and safety before delivery
10. **Response** — Stream the validated answer to the client via SSE
11. **Memory Learning Update** — Write new facts and patterns back to Hindsight for future recall

---

## The Demo Moment

| Interaction | Tokens Used | Model | Answer Quality |
|------------|-------------|-------|----------------|
| 1 | ~15,000 | llama-3.3-70b-versatile | Generic, exploratory |
| 3 | ~8,400 | llama-3.3-70b-versatile | Contextually aware |
| 5 | ~3,200 | llama-3.1-8b-instant | Personalized, efficient |
| 10 | ~720 | llama-3.1-8b-instant (cached) | Instant, memory-powered |

This progression is **visible in the UI** via the Token Savings Chart — a live Recharts graph that updates after every interaction.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+, FastAPI |
| Agent Orchestration | LangGraph, LangChain |
| Persistent Memory | Hindsight SDK |
| Vector Store | ChromaDB |
| Relational DB | SQLite + Alembic |
| Model Routing | cascadeflow |
| LLM Inference | Groq |
| Caching | Redis |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, Recharts, Zustand |
| Infrastructure | Docker Compose |

---

## Architecture

```
eternomind/
├── README.md
├── docker-compose.yml
├── .env.example
│
├── backend/
│   └── app/
│       ├── api/            # FastAPI routers
│       ├── agents/         # LangGraph state machine
│       ├── memory/         # Hindsight SDK integration
│       ├── rag/            # ChromaDB RAG
│       ├── optimization/   # Prompt Optimizer, cascadeflow
│       ├── runtime/        # Pipeline orchestrator
│       ├── security/       # Auth, sanitization, rate limiting
│       ├── db/             # SQLAlchemy models, Alembic
│       ├── schemas/        # Pydantic request/response models
│       └── main.py         # FastAPI app entry point
│
└── frontend/
    └── src/
        ├── components/
        │   ├── chat/       # ChatInterface, MessageBubble, StreamingText
        │   └── dashboard/  # TokenSavingsChart, PipelineStepsPanel, MetricsBar
        ├── hooks/          # useChat, useMetrics, useSSE
        ├── stores/         # Zustand: chatStore, sessionStore, metricsStore
        └── api/            # Fetch wrappers for backend calls
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose v2+
- Groq API key — [console.groq.com](https://console.groq.com)
- Hindsight API key — [hindsight.so](https://hindsight.so)
- cascadeflow API key — [cascadeflow.ai](https://cascadeflow.ai)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/eternomind.git
cd eternomind

# 2. Copy and fill in environment variables
cp .env.example .env
# Edit .env with your API keys (see .env.example for required variables)

# 3. Launch all services
docker compose up --build

# 4. Open the app
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

> If any environment variable is missing, the backend will fail to start with a clear error message.
> See `.env.example` for all required variables and descriptions.

---

## Integration Contracts

All three developers share these API contracts. **Names and shapes are canonical** — do not rename fields.

### POST /api/v1/chat
```json
// Request
{ "session_id": "string", "message": "string", "user_id": "string" }

// SSE stream events
{ "event": "pipeline_step", "data": { "step": "string", "status": "running" }, "token_delta": "" }
{ "event": "token",         "data": { "step": "response", "token_delta": "string" }, "token_delta": "string" }
{ "event": "done",          "data": { "total_tokens": 0, "model": "string", "latency_ms": 0, "memory_hits": 0 }, "token_delta": "" }
{ "event": "error",         "data": { "step": "string", "message": "string" }, "token_delta": "" }
```

### GET /api/v1/metrics/{session_id}
```json
// Response
{
  "session_id": "string",
  "interactions": [
    {
      "interaction_number": 1,
      "token_count_input": 0,
      "token_count_output": 0,
      "model_used": "string",
      "memory_hits": 0,
      "latency_ms": 0
    }
  ]
}
```

### POST /api/v1/sessions
```json
// Request:  { "user_id": "string" }
// Response: { "session_id": "string", "created_at": "ISO8601" }
```

### GET /api/v1/sessions/{session_id}
```json
// Response: { "session_id": "string", "user_id": "string", "created_at": "ISO8601", "interaction_count": 0 }
```

### GET /api/v1/health
```json
// Response: { "backend": "ok", "redis": "ok|error", "chromadb": "ok|error" }
```

### POST /api/v1/auth/login
```json
// Request:  { "username": "string", "password": "string" }
// Response: { "access_token": "string", "refresh_token": "string", "token_type": "bearer" }
```

### POST /api/v1/auth/refresh
```json
// Request header: Authorization: Bearer <refresh_token>
// Response: { "access_token": "string", "token_type": "bearer" }
```

### POST /api/v1/auth/logout
```json
// Request header: Authorization: Bearer <access_token>
// Response: { "message": "Logged out" }
```

### interaction_logs table (SQLite)
| Column | Type |
|--------|------|
| id | INTEGER PRIMARY KEY |
| session_id | TEXT NOT NULL |
| user_id | TEXT NOT NULL |
| interaction_number | INTEGER NOT NULL |
| token_count_input | INTEGER NOT NULL |
| token_count_output | INTEGER NOT NULL |
| model_used | TEXT NOT NULL |
| memory_hits | INTEGER NOT NULL |
| latency_ms | REAL NOT NULL |
| created_at | DATETIME NOT NULL |

---

---

## Demo Instructions (for judges)

1. Open link
2. Log in with the demo credentials from `.env.example`
3. Ask: _"Explain how transformer attention mechanisms work"_ → watch token count (~15,000)
4. Ask 9 more related questions on the same topic
5. On interaction 10, observe:
   - Token count drops to ~720
   - Model shown changes to a smaller variant
   - Response arrives nearly instantly
   - Token Savings Chart shows the full downward curve
6. Click the Pipeline Steps panel to see each of the 12 steps light up in real time

---

## Contributors

| Role | Name | Owns |
|------|------|------|
| Backend Core | **Preethesh Carvalho** | FastAPI scaffold, SQLite + Alembic, JWT auth, security middleware, sessions, health |
| AI/Agent Pipeline | **Imran Kazia** | LangGraph state machine, Hindsight memory, ChromaDB RAG, prompt optimizer, cascadeflow routing, Groq inference |
| Frontend + Integration | **Deepthi C J** | React UI, chat streaming, token savings chart, pipeline panel, model selector, Docker Compose |

---

## License

MIT — built for the **Building AI Agents with Hindsight & cascadeflow** hackathon.

---


