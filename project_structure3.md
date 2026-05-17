# EternoMind — Project Structure & Concept (Person 3 View)

> Owned by: **Person 3 (Frontend + Integration)**
> Branch: `frontend`
> Last updated: 2026-05-17

---

## Core Idea

EternoMind is a Self-Optimizing Memory-Aware AI Runtime. Memory IS the token optimization system — every interaction stores compressed operational learnings in Hindsight, so the next similar query costs far fewer tokens and can be routed to a cheaper Groq model. The visible proof is the Token Savings Chart: token count drops from ~15,000 on interaction 1 to ~720 on interaction 10.

**Person 3 owns the layer that makes this visible** — the React dashboard, SSE streaming chat, token savings chart, pipeline step inspector, and the Docker Compose file that wires all services together.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   EternoMind UI (Port 5173)               │
│                                                           │
│  ┌─────────────────┐    ┌──────────────────────────────┐ │
│  │   Chat Panel    │    │      Dashboard Panel         │ │
│  │                 │    │                              │ │
│  │ ChatInterface   │    │ TokenSavingsChart (Recharts) │ │
│  │ MessageBubble   │    │ PipelineStepsPanel           │ │
│  │ StreamingText   │    │ MetricsBar                   │ │
│  └────────┬────────┘    └──────────────────────────────┘ │
│           │                         ↑                    │
│    useChat (SSE)              useMetrics                  │
│           │                         │                    │
│    ───────┼─────────────────────────┘                    │
│           ↓                                              │
│       src/api/ (fetch wrappers)                          │
└──────────────────────┬───────────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼───────────────────────────────────┐
│              Backend API (Port 8000) — Person 1 + 2       │
│  POST /api/v1/chat     ← SSE stream (Person 2)           │
│  GET  /api/v1/metrics  ← token data (Person 2)           │
│  POST /api/v1/sessions ← session mgmt (Person 1)         │
│  POST /api/v1/auth/*   ← JWT auth (Person 1)             │
│  GET  /api/v1/health   ← service health (Person 1)       │
└──────────────────────────────────────────────────────────┘
```

---

## Tech Stack (Person 3 Scope)

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 18 |
| Build Tool | Vite | 5 |
| Language | TypeScript | 5 |
| Styling | TailwindCSS | 3.4.4 |
| Component Library | shadcn/ui | latest |
| Charts | Recharts | 2.12.7 |
| State Management | Zustand | 4.5.4 |
| Icons | lucide-react | 0.395.0 |
| Infrastructure | Docker Compose | v2+ |

---

## Directory Structure (Person 3 Owns)

```
eternomind/
├── docker-compose.yml          ← wires all 4 services
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── components/
        │   ├── chat/
        │   │   ├── ChatInterface.tsx
        │   │   ├── MessageBubble.tsx
        │   │   └── StreamingText.tsx
        │   └── dashboard/
        │       ├── TokenSavingsChart.tsx
        │       ├── PipelineStepsPanel.tsx
        │       └── MetricsBar.tsx
        ├── hooks/
        │   ├── useChat.ts
        │   ├── useMetrics.ts
        │   └── useSSE.ts
        ├── stores/
        │   ├── chatStore.ts
        │   ├── sessionStore.ts
        │   └── metricsStore.ts
        └── api/
            ├── auth.ts
            ├── chat.ts
            ├── sessions.ts
            └── metrics.ts
```

---

## Phase Completion

- ✅ **Phase 1** — Project Scaffold (Vite + React + TS + Tailwind + shadcn/ui)
- ✅ **Phase 2** — Zustand Stores (chatStore, sessionStore, metricsStore)
- ✅ **Phase 3** — Chat UI Components with mock data
- ✅ **Phase 4** — API Layer & real backend connection *(Person 1 backend-core merged)*
- [ ] **Phase 5** — Docker Compose + full integration *(needs Person 2 ai-pipeline)*
- [ ] **Phase 6** — Demo polish & rehearsal

---

## SSE Event Contract (agreed with Person 2)

| Event | Data fields | Purpose |
|-------|------------|---------|
| `pipeline_step` | `step`, `status: "running"` | Light up a step in PipelineStepsPanel |
| `token` | `step: "response"`, `token_delta` | Append text to the current assistant message |
| `done` | `total_tokens`, `model`, `latency_ms`, `memory_hits` | Finalize message + update metrics chart |
| `error` | `step`, `message` | Show error banner |

---

## Key Decisions & Notes

- **POST SSE uses `fetch` + `ReadableStream`**, not native `EventSource` (which only supports GET)
- Backend URL is kept in a single constant: `import.meta.env.VITE_API_URL ?? ''`
- All components handle 3 states: loading, error, success
- No inline `style={{}}` — Tailwind classes only (except Recharts customization)
- Model badge colors: orange = `llama3-70b-8192`, green = `llama3-8b-8192`

---
