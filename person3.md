# EternoMind — Developer 3 Workstream: Frontend + Integration

## Your Role

You are **Person 3** on the EternoMind hackathon project. You own the **frontend** and **integration layer**: the React dashboard, chat interface, token savings visualization, SSE streaming client, and the Docker Compose configuration that ties the whole system together for the demo.

**Model**: Use **Claude Opus 4.7** in Kiro for all code generation.

**Your branch**: `frontend`
```bash
git checkout -b frontend
# All your work goes on this branch — never commit directly to main
```

---

## Project Context

**Project**: EternoMind (Self-Optimizing Memory-Aware AI Runtime)
**Hackathon**: Building AI Agents with Hindsight & cascadeflow
**Core idea**: Memory IS the token optimization system. Every interaction makes the AI cheaper and faster. Your job is to make that progression **visible** — a judge should be able to see the token count drop from ~15,000 to ~720 across 10 interactions without any explanation.

**Mandatory Technologies** (implemented by Person 2, consumed by you):
- [Hindsight](https://hindsight.so) — persistent memory (you visualize memory hits in the UI)
- [cascadeflow](https://cascadeflow.ai) — model routing (you show which model was selected)
- [Groq](https://groq.com) — LLM inference (you show latency and model name)

**Full Tech Stack**:
| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+, FastAPI (Person 1) |
| AI Pipeline | LangGraph, Hindsight, cascadeflow, Groq (Person 2) |
| Frontend | React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, Recharts, Zustand ← **you own this** |
| Infrastructure | Docker Compose ← **you own this** |

---

## What You Own

```
eternomind/
├── docker-compose.yml              ← you create this
│
└── frontend/
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
        │   │   ├── ChatInterface.tsx      ← main chat panel
        │   │   ├── MessageBubble.tsx      ← individual message rendering
        │   │   └── StreamingText.tsx      ← animates token-by-token output
        │   └── dashboard/
        │       ├── TokenSavingsChart.tsx  ← Recharts line chart
        │       ├── PipelineStepsPanel.tsx ← live pipeline progress indicator
        │       └── MetricsBar.tsx         ← current model, token count, latency
        ├── hooks/
        │   ├── useChat.ts                ← manages chat state + SSE connection
        │   ├── useMetrics.ts             ← fetches /api/v1/metrics/{session_id}
        │   └── useSSE.ts                 ← generic SSE hook
        ├── stores/
        │   ├── chatStore.ts              ← Zustand: messages, streaming state
        │   ├── sessionStore.ts           ← Zustand: session_id, user_id, auth token
        │   └── metricsStore.ts           ← Zustand: per-interaction token data
        └── api/
            ├── chat.ts                   ← POST /api/v1/chat (SSE)
            ├── sessions.ts               ← POST/GET /api/v1/sessions
            ├── auth.ts                   ← POST /api/v1/auth/login
            └── metrics.ts                ← GET /api/v1/metrics/{session_id}
```

You do **not** own the backend source code. All backend API calls go through the `src/api/` layer.

---

## Shared Interface Contracts

These are the exact API shapes from the backend. **Do not change field names.**

### POST /api/v1/auth/login
```typescript
interface LoginRequest { username: string; password: string; }
interface LoginResponse { access_token: string; refresh_token: string; token_type: string; }
```

### POST /api/v1/sessions
```typescript
interface CreateSessionRequest { user_id: string; }
interface Session { session_id: string; created_at: string; }
```

### GET /api/v1/sessions/{session_id}
```typescript
interface SessionDetail { session_id: string; user_id: string; created_at: string; interaction_count: number; }
```

### POST /api/v1/chat (SSE stream)
```typescript
interface ChatRequest { session_id: string; message: string; user_id: string; }

interface PipelineStepEvent {
  event: "pipeline_step";
  data: { step: string; status: "running"; };
  token_delta: "";
}
interface TokenEvent {
  event: "token";
  data: { step: "response"; };
  token_delta: string; // append to current message
}
interface DoneEvent {
  event: "done";
  data: { total_tokens: number; model: string; latency_ms: number; memory_hits: number; };
  token_delta: "";
}
interface ErrorEvent {
  event: "error";
  data: { step: string; message: string; };
  token_delta: "";
}
```

Parse SSE by splitting on `\n\n`, then splitting each block into `event:` and `data:` lines, then `JSON.parse(data)`.

### GET /api/v1/metrics/{session_id}
```typescript
interface MetricsResponse {
  session_id: string;
  interactions: Array<{
    interaction_number: number;
    token_count_input: number;
    token_count_output: number;
    model_used: string;
    memory_hits: number;
    latency_ms: number;
  }>;
}
```

### GET /api/v1/health
```typescript
interface HealthResponse { backend: "ok"; redis: "ok" | "error"; chromadb: "ok" | "error"; }
```

---

## Build Phases

Work through these phases in order.

> You can work on Phases 1-3 independently. Phase 4 requires Person 1's backend running. Phase 5 requires Person 2's pipeline running.

---

### Phase 1: Project Scaffold

**Goal**: Runnable Vite + React + TypeScript + TailwindCSS + shadcn/ui app.

**Deliverables**:
1. Initialize the project:
   ```bash
   npm create vite@latest frontend -- --template react-ts
   cd frontend && npm install
   ```
2. Install dependencies (pin these versions):
   ```bash
   npm install \
     tailwindcss@3.4.4 postcss autoprefixer \
     @radix-ui/react-slot class-variance-authority clsx tailwind-merge \
     shadcn-ui recharts@2.12.7 zustand@4.5.4 lucide-react@0.395.0
   ```
3. Configure Tailwind: `npx tailwindcss init -p`
4. Initialize shadcn/ui: `npx shadcn-ui@latest init` (default style, slate color)
5. Install shadcn components: `npx shadcn-ui@latest add button input card badge scroll-area separator`
6. `vite.config.ts` — proxy `/api` to `http://localhost:8000` to avoid CORS during dev:
   ```typescript
   server: { proxy: { '/api': 'http://localhost:8000' } }
   ```
7. `src/App.tsx` — two-column layout: left = chat panel, right = dashboard panel (stub content ok)

**Verification**:
```bash
npm run dev
# http://localhost:5173 should show the two-column layout
```

---

### Phase 2: Zustand Stores

**Goal**: Set up the three stores that all components share.

**Deliverables**:
1. `src/stores/sessionStore.ts`:
   ```typescript
   interface SessionState {
     userId: string | null;
     sessionId: string | null;
     accessToken: string | null;
     isAuthenticated: boolean;
     setAuth: (userId: string, token: string) => void;
     setSession: (sessionId: string) => void;
     logout: () => void;
   }
   ```
2. `src/stores/chatStore.ts`:
   ```typescript
   interface Message {
     id: string;
     role: "user" | "assistant";
     content: string;
     isStreaming: boolean;
     metrics?: { total_tokens: number; model: string; latency_ms: number; memory_hits: number; };
   }
   interface ChatState {
     messages: Message[];
     isLoading: boolean;
     currentPipelineStep: string | null;
     addUserMessage: (content: string) => string;
     startAssistantMessage: () => string;
     appendToken: (id: string, token: string) => void;
     finalizeMessage: (id: string, metrics: Message["metrics"]) => void;
     setPipelineStep: (step: string | null) => void;
   }
   ```
3. `src/stores/metricsStore.ts`:
   ```typescript
   interface Interaction {
     interaction_number: number;
     token_count_input: number;
     token_count_output: number;
     model_used: string;
     memory_hits: number;
     latency_ms: number;
   }
   interface MetricsState {
     interactions: Interaction[];
     setInteractions: (data: Interaction[]) => void;
     addInteraction: (i: Interaction) => void;
   }
   ```

**Verification**: `console.log` in `App.tsx` to confirm store reads/writes work.

---

### Phase 3: Chat UI Components (with mock data)

**Goal**: Build all chat components against mock data so Person 2's backend isn't a blocker.

**Deliverables**:
1. `src/components/chat/StreamingText.tsx` — renders content; when `isStreaming=true`, shows blinking cursor
2. `src/components/chat/MessageBubble.tsx`:
   - User: right-aligned, blue background
   - Assistant: left-aligned, dark background; metrics bar below (hidden while streaming)
3. `src/components/chat/ChatInterface.tsx`:
   - Scrollable message list (`ScrollArea` from shadcn/ui)
   - Input field + Send button at bottom
   - `currentPipelineStep` as status pill above input while loading
   - Red banner "Could not connect to EternoMind backend. Retrying..." + spinner when backend unreachable
4. `src/components/dashboard/TokenSavingsChart.tsx`:
   - Recharts `LineChart`: `token_count_input` (red), `token_count_output` (green)
   - X-axis: interaction number. Y-axis: token count.
   - Reference line at y=720 labeled "Memory-optimized baseline"
   - Empty state message when data is empty
5. `src/components/dashboard/PipelineStepsPanel.tsx`:
   - 11 named steps: Security, LangGraph, Memory Retrieval, Context Relevancy, RAG Retrieval, Prompt Optimizer, cascadeflow Routing, Groq LLM, Validation, Response, Memory Update
   - Three states per step: idle (grey), running (blue pulse), done (green check)
6. `src/components/dashboard/MetricsBar.tsx`:
   - Model badge, token count, latency ms, memory hits count
   - shadcn `Badge` for model name

**Verification**: Populate stores with mock data in `App.tsx` and confirm all components render.

---

### Phase 4: API Layer & Real Backend Connection

**Goal**: Wire the API layer to Person 1's running backend.

> **Requires**: Person 1's `backend-core` branch (Phases 1-4 complete, backend running at `http://localhost:8000`).

**Deliverables**:
1. `src/api/auth.ts` — `login()`: on success call `sessionStore.setAuth()`
2. `src/api/sessions.ts` — `createSession()`, `getSession()`: on success call `sessionStore.setSession()`
3. `src/api/metrics.ts` — `getMetrics(sessionId)`
4. `src/hooks/useSSE.ts` — generic hook that opens EventSource, parses events, calls handlers
5. `src/api/chat.ts` + `src/hooks/useChat.ts`:
   - Use `fetch` with `ReadableStream` (not `EventSource` — POST SSE not supported by native API)
   - `pipeline_step` → `chatStore.setPipelineStep(step)`
   - `token` → `chatStore.appendToken(msgId, token_delta)`
   - `done` → `chatStore.finalizeMessage()` + `metricsStore.addInteraction()` + fetch updated metrics
   - `error` → show error banner
6. Login screen in `App.tsx` when `!isAuthenticated`; after login, auto-create session

**Verification**:
```bash
# With backend running:
# 1. Open http://localhost:5173 → login screen appears
# 2. Log in with demo credentials
# 3. Send a message → SSE tokens stream in, pipeline steps light up, metrics bar updates
```

---

### Phase 5: Full Integration & Docker Compose

**Goal**: Docker Compose file that starts everything.

> **Requires**: Person 1 (`backend-core`) and Person 2 (`ai-pipeline`) both complete.

**Deliverables**:
1. `docker-compose.yml` at project root:
   ```yaml
   version: "3.9"

   services:
     redis:
       image: redis:7-alpine
       networks: [eternomind]

     chromadb:
       image: chromadb/chroma:latest
       networks: [eternomind]
       environment:
         - ANONYMIZED_TELEMETRY=false

     backend:
       build: ./backend
       ports:
         - "8000:8000"
       env_file: .env
       environment:
         - REDIS_URL=redis://redis:6379/0
         - CHROMA_HOST=chromadb
         - CHROMA_PORT=8001
         - DATABASE_URL=sqlite:///./eternomind.db
       volumes:
         - ./backend:/app
       depends_on:
         - redis
         - chromadb
       networks: [eternomind]
       command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

     frontend:
       build: ./frontend
       ports:
         - "5173:5173"
       env_file: .env
       depends_on:
         - backend
       networks: [eternomind]
       command: npm run dev -- --host

   networks:
     eternomind:
       driver: bridge
   ```

2. `backend/Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

3. `frontend/Dockerfile`:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json .
   RUN npm ci
   COPY . .
   EXPOSE 5173
   CMD ["npm", "run", "dev", "--", "--host"]
   ```

4. Update `vite.config.ts` for Docker:
   ```typescript
   proxy: { '/api': process.env.VITE_API_URL || 'http://backend:8000' }
   ```

**Verification**:
```bash
docker compose up --build
# GET http://localhost:8000/api/v1/health → {"backend":"ok","redis":"ok","chromadb":"ok"}
# http://localhost:5173 → login screen loads
```

---

### Phase 6: Demo Polish & Rehearsal

**Goal**: The UI tells the EternoMind story clearly to hackathon judges in under 2 minutes.

**Deliverables**:
1. Token Savings Chart: add second Y-axis for estimated cost (`$0.002/1k` large, `$0.0002/1k` small) + "Total saved: $X.XX" legend counter
2. PipelineStepsPanel: show per-step timing (ms) once `done` event arrives
3. "Reset Session" button — creates new session, clears messages/metrics
4. Model badge color: orange for `llama3-70b-8192`, green for `llama3-8b-8192`
5. Responsive layout: works at 1280×800 minimum

When done, push: `git push -u origin frontend`

---

## Demo Script (for judges)

```
1. Open http://localhost:5173
2. Log in with demo credentials (shown in terminal after docker compose up)
3. Ask: "Explain how transformer attention mechanisms work in detail"
   → Token count ~15,000, large model (orange badge), ~2s latency
   → Pipeline steps panel lights up all 11 steps

4. Ask: "How does multi-head attention differ from single-head?"
   → Token count drops (~9,000) — memory already has context

5. Ask 3-4 more related questions on transformers

6. Ask: "Give me a one-sentence summary of attention mechanisms"
   → By interaction 7-10: Token count ~720, small model (green badge), <500ms latency
   → Token Savings Chart shows dramatic downward curve
   → "Total saved" counter shows real cost savings

7. Click Reset Session → Ask the SAME first question again
   → Back to ~15,000 tokens — proves it's memory-driven, NOT just caching
```

---

## Dependencies on Other Developers

| Phase | Depends on | What you need |
|-------|-----------|---------------|
| Phases 1-3 | Nobody | Fully independent (use mock data) |
| Phase 4 | Person 1 (`backend-core`, Phases 1-4) | Backend at localhost:8000, demo user credentials |
| Phase 5 | Person 1 + Person 2 (all phases) | Both Dockerfiles, all endpoints functional |
| Phase 6 | Everything | Full stack running |

**Coordinate with Person 2** if SSE events don't match the contract — event names and data shapes above are final.

---

## Conventions

- All components are TypeScript (`.tsx`), all hooks and stores are `.ts`
- Use `import type` for type-only imports
- Zustand stores use the `(set, get) => ({...})` pattern — no class-based stores
- Never call `fetch` directly in components — always go through `src/api/` functions or hooks
- Tailwind classes only — no inline `style={{}}` except for Recharts customization
- All components handle three states: loading, error, and success
- Keep the backend URL in a single constant: `const API_BASE = import.meta.env.VITE_API_URL ?? ''`
- SSE parsing: use `fetch` + `ReadableStream` pattern — native `EventSource` doesn't support POST
