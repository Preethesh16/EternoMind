# EternoMind — Developer 2 Workstream: AI/Agent Pipeline

## Your Role

You are **Person 2** on the EternoMind hackathon project. You own the **intelligence core**: the LangGraph state machine, Hindsight persistent memory integration, ChromaDB RAG retrieval, Prompt Optimizer, and cascadeflow model routing. This is where EternoMind's self-optimization actually happens.

**Model**: Use **Claude Opus 4.7** in Kiro for all code generation.

**Your branch**: `ai-pipeline`
```bash
git checkout -b ai-pipeline
# All your work goes on this branch — never commit directly to main
```

---

## Project Context

**Project**: EternoMind (Self-Optimizing Memory-Aware AI Runtime)
**Hackathon**: Building AI Agents with Hindsight & cascadeflow
**Core idea**: Memory IS the token optimization system. Every interaction makes the AI cheaper and faster because Hindsight learns what each user already knows, and cascadeflow routes to a cheaper model when memory coverage is high.

**Mandatory Technologies** — you implement all three:
- [Hindsight](https://hindsight.so) — persistent memory SDK for storing and retrieving user-specific context across sessions
- [cascadeflow](https://cascadeflow.ai) — model routing intelligence; decides which Groq model to use based on memory coverage score
- [Groq](https://groq.com) — LLM inference provider

**Full Tech Stack**:
| Layer | Technology |
|-------|-----------|
| Backend API | Python 3.11+, FastAPI (Person 1 sets up) |
| Agent Orchestration | LangGraph, LangChain ← **you own this** |
| Persistent Memory | Hindsight SDK ← **you own this** |
| Vector Store | ChromaDB ← **you own RAG on top** |
| Relational DB | SQLite + Alembic (Person 1 owns schema) |
| Caching | Redis |
| Model Routing | cascadeflow ← **you own this** |
| LLM Inference | Groq ← **you own this** |
| Frontend | React 18 (Person 3) |
| Infrastructure | Docker Compose (Person 3) |

---

## What You Own

```
backend/app/
├── agents/
│   ├── __init__.py
│   ├── state.py              ← LangGraph AgentState TypedDict
│   ├── graph.py              ← LangGraph StateGraph definition
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
│   └── hindsight_client.py   ← Hindsight SDK wrapper
├── rag/
│   ├── __init__.py
│   ├── chroma_client.py      ← ChromaDB connection
│   └── retriever.py          ← Document ingestion + similarity search
├── optimization/
│   ├── __init__.py
│   ├── prompt_optimizer.py   ← Prompt rewriting logic
│   └── cascadeflow_router.py ← cascadeflow routing wrapper
├── runtime/
│   ├── __init__.py
│   └── pipeline.py           ← Entry point: run_pipeline(session_id, message, user_id)
└── api/
    ├── chat.py               ← POST /api/v1/chat  (SSE streaming)
    └── metrics.py            ← GET /api/v1/metrics/{session_id}
```

You do **not** own: `security/`, `db/`, `schemas/auth.py`, `schemas/sessions.py`, `api/auth.py`, `api/health.py`, `api/sessions.py`, or anything in `frontend/`.

---

## Shared Interface Contracts

### POST /api/v1/chat — you implement this

Person 3 (Frontend) calls this endpoint and renders the SSE stream. The shape is **fixed**:

```python
# Request body (Pydantic schema)
class ChatRequest(BaseModel):
    session_id: str
    message: str
    user_id: str
```

**SSE Event Stream** — emit these event types in order. Person 3 subscribes to all of them.

| event name | when to emit | data payload |
|-----------|-------------|-------------|
| `pipeline_step` | Start of each pipeline step (steps 2-11) | `{"step": "<step_name>", "status": "running"}` |
| `token` | Each token chunk from Groq stream | `{"step": "response", "token_delta": "<chunk>"}` |
| `done` | After memory update complete | `{"total_tokens": int, "model": str, "latency_ms": float, "memory_hits": int}` |
| `error` | On any unhandled exception | `{"step": "<step_name>", "message": "<error text>"}` |

**SSE wire format** — each event must be formatted exactly as:
```
event: <event_name>\n
data: <json_string>\n
\n
```

Full SSE response example:
```
event: pipeline_step
data: {"step": "memory_retrieval", "status": "running"}

event: pipeline_step
data: {"step": "context_relevancy", "status": "running"}

event: token
data: {"step": "response", "token_delta": "The "}

event: token
data: {"step": "response", "token_delta": "answer "}

event: done
data: {"total_tokens": 720, "model": "llama-3.1-8b-instant", "latency_ms": 340.5, "memory_hits": 7}

```

### GET /api/v1/metrics/{session_id} — you implement this

Person 3 calls this to populate the Token Savings Chart.

```json
// Response 200
{
  "session_id": "string",
  "interactions": [
    {
      "interaction_number": 1,
      "token_count_input": 14800,
      "token_count_output": 612,
      "model_used": "llama-3.3-70b-versatile",
      "memory_hits": 0,
      "latency_ms": 2100.5
    }
  ]
}
```

Query `interaction_logs` table (defined by Person 1) ordered by `interaction_number ASC`.

### interaction_logs table — Person 1 creates, you write to it

After every pipeline run, INSERT a row. **Column names are fixed**:

| Column | Type | Your value |
|--------|------|-----------|
| session_id | TEXT | from request |
| user_id | TEXT | from request |
| interaction_number | INTEGER | COUNT of prior rows for this session + 1 |
| token_count_input | INTEGER | input tokens from Groq response usage |
| token_count_output | INTEGER | output tokens from Groq response usage |
| model_used | TEXT | model name cascadeflow selected |
| memory_hits | INTEGER | count of Hindsight memories that passed relevancy filter |
| latency_ms | REAL | total pipeline wall-clock time in milliseconds |
| created_at | DATETIME | UTC now |

---

## The 12-Step Pipeline — Your Implementation Map

Steps 1 (Security) and 10 (Response streaming) are handled by FastAPI middleware / the chat endpoint itself. You implement steps 2-9 and 11 as LangGraph nodes.

```
Step 2:  LangGraph entry node — initialize AgentState
Step 3:  hindsight_client.retrieve(user_id, query) → List[Memory]
Step 4:  score each memory for relevance; filter to score ≥ 0.65
Step 5:  retriever.similarity_search(query, k=5) → List[Document]
Step 6:  prompt_optimizer.optimize(query, memories, docs) → optimized_prompt, token_estimate
Step 7:  cascadeflow_router.route(memory_hits, token_estimate) → model_name
Step 8:  groq_client.stream(model_name, optimized_prompt) → AsyncGenerator[str]
Step 9:  validator.check(response_text) → bool (re-run step 8 once if False)
Step 11: hindsight_client.update(user_id, query, response_text)
```

### LangGraph AgentState

```python
from typing import TypedDict, List

class AgentState(TypedDict):
    # Input
    session_id: str
    user_id: str
    original_query: str

    # Step 3 output
    retrieved_memories: List[dict]

    # Step 4 output
    relevant_memories: List[dict]
    memory_hits: int

    # Step 5 output
    rag_documents: List[dict]

    # Step 6 output
    optimized_prompt: str
    token_estimate: int

    # Step 7 output
    selected_model: str

    # Step 8 output
    response_text: str
    token_count_input: int
    token_count_output: int

    # Step 9 output
    validation_passed: bool
    retry_count: int

    # Timing
    pipeline_start_ms: float
```

---

## Build Phases

Work through these phases in order.

> **Dependency**: You need Person 1 to complete **Phase 1** (FastAPI app running, `get_db` dependency available, `InteractionLog` model defined) before you start Phase 4. Phases 1-3 below are independent.

---

### Phase 1: Hindsight Memory Integration

**Goal**: Wrap the Hindsight SDK so all pipeline nodes use a single client.

**Deliverables**:
1. Add to `requirements.txt` (coordinate with Person 1):
   - `hindsight-sdk` (use latest stable version from hindsight.so docs)
   - `langchain==0.2.5`
   - `langgraph==0.1.5`
   - `langchain-groq==0.1.5`
   - `groq==0.9.0`
   - `chromadb==0.5.0`
2. `backend/app/memory/hindsight_client.py`:
   ```python
   class HindsightClient:
       def __init__(self, api_key: str): ...
       async def retrieve(self, user_id: str, query: str) -> list[dict]: ...
       async def update(self, user_id: str, query: str, response: str) -> None: ...
   ```
   - `retrieve` returns list of `{"content": str, "relevance_score": float, "memory_id": str}`
   - `update` stores the query+response pair as a new memory for that user

**Verification**:
```python
client = HindsightClient(api_key=settings.HINDSIGHT_API_KEY)
memories = await client.retrieve("test_user", "What is attention in transformers?")
print(memories)  # Should return [] or list of dicts
```

---

### Phase 2: ChromaDB RAG

**Goal**: Document ingestion and similarity search for the RAG step.

**Deliverables**:
1. `backend/app/rag/chroma_client.py`:
   - Connect to ChromaDB at `settings.CHROMA_HOST:settings.CHROMA_PORT`
   - Create/get collection `"eternomind_documents"`
2. `backend/app/rag/retriever.py`:
   ```python
   class RAGRetriever:
       async def ingest(self, documents: list[str], metadatas: list[dict]) -> None: ...
       async def similarity_search(self, query: str, k: int = 5) -> list[dict]: ...
   ```
   - `similarity_search` returns list of `{"content": str, "score": float, "metadata": dict}`
3. `backend/scripts/ingest_demo_docs.py` — ingest 5-10 sample documents about AI/transformers for the demo

**Verification**:
```python
retriever = RAGRetriever()
await retriever.ingest(["Transformers use attention mechanisms..."], [{"source": "demo"}])
results = await retriever.similarity_search("attention mechanism", k=3)
assert len(results) <= 3
```

---

### Phase 3: Prompt Optimizer & cascadeflow Router

**Goal**: Implement the two optimization steps that drive EternoMind's token reduction.

**Deliverables**:
1. `backend/app/optimization/prompt_optimizer.py`:
   ```python
   class PromptOptimizer:
       async def optimize(
           self,
           query: str,
           memories: list[dict],
           rag_docs: list[dict]
       ) -> tuple[str, int]:
           # Returns (optimized_prompt_text, estimated_token_count)
   ```
   - Strategy: if memory coverage is high (>= 5 hits), compress context aggressively
   - Use only the top-3 most relevant memories by `relevance_score`
   - Use only the top-2 RAG docs by score
   - Always include: system role, compressed context, user query
   - Estimate token count using `len(prompt.split()) * 1.3` as a rough heuristic
2. `backend/app/optimization/cascadeflow_router.py`:
   ```python
   class CascadeflowRouter:
       async def route(self, memory_hits: int, token_estimate: int) -> str:
           # Returns Groq model name: GROQ_LARGE_MODEL or GROQ_SMALL_MODEL
   ```
   - Routing logic: if `memory_hits >= 4` AND `token_estimate < 2000` → small model, else large model
   - Integrate with cascadeflow SDK if it exposes a routing API; fall back to the logic above if not

**Verification**:
```python
optimizer = PromptOptimizer()
prompt, tokens = await optimizer.optimize("Explain attention", memories[:3], docs[:2])
assert tokens < 3000

router = CascadeflowRouter()
model = await router.route(memory_hits=6, token_estimate=800)
assert model == settings.GROQ_SMALL_MODEL

model = await router.route(memory_hits=0, token_estimate=15000)
assert model == settings.GROQ_LARGE_MODEL
```

---

### Phase 4: LangGraph State Machine

**Goal**: Wire all nodes into a single executable LangGraph pipeline.

> **Requires**: Person 1's Phase 1 complete (FastAPI app running, `backend-core` branch pushed).

**Deliverables**:
1. `backend/app/agents/state.py` — `AgentState` TypedDict as defined above
2. `backend/app/agents/nodes/*.py` — one file per step, each as an async function `async def node_name(state: AgentState) -> AgentState`
3. `backend/app/agents/graph.py`:
   ```python
   from langgraph.graph import StateGraph, END

   def build_graph() -> StateGraph:
       graph = StateGraph(AgentState)
       graph.add_node("memory_retrieval", memory_retrieval_node)
       graph.add_node("context_relevancy", context_relevancy_node)
       graph.add_node("rag_retrieval", rag_retrieval_node)
       graph.add_node("prompt_optimizer", prompt_optimizer_node)
       graph.add_node("model_router", model_router_node)
       graph.add_node("llm_inference", llm_inference_node)
       graph.add_node("validator", validator_node)
       graph.add_node("memory_updater", memory_updater_node)
       graph.set_entry_point("memory_retrieval")
       # Conditional edge: if validation fails and retry_count < 1, go back to llm_inference
       return graph.compile()
   ```
4. `backend/app/runtime/pipeline.py`:
   ```python
   async def run_pipeline(
       session_id: str,
       message: str,
       user_id: str,
       event_callback: Callable[[str, dict], Awaitable[None]]
   ) -> AgentState:
       # Runs the graph, calls event_callback("pipeline_step"|"token", data) at each step
       # Returns final AgentState after memory update
   ```

**Verification**:
```python
final_state = await run_pipeline(
    session_id="test",
    message="What is a transformer?",
    user_id="test_user",
    event_callback=lambda e, d: print(e, d)
)
assert final_state["response_text"] != ""
assert final_state["selected_model"] in [settings.GROQ_LARGE_MODEL, settings.GROQ_SMALL_MODEL]
```

---

### Phase 5: Chat & Metrics API Endpoints

**Goal**: Expose the pipeline via HTTP with SSE streaming.

> **Requires**: Person 1's Phase 1 complete; Person 1 to add your routers to `main.py`.

**Deliverables**:
1. `backend/app/api/chat.py`:
   - `POST /api/v1/chat` using `StreamingResponse(media_type="text/event-stream")`
   - Call `run_pipeline()` with an `event_callback` that formats and yields SSE events
   - After pipeline completes, write a row to `interaction_logs` using Person 1's `get_db` + `InteractionLog` model
   - Emit the `done` event with final metrics
2. `backend/app/api/metrics.py`:
   - `GET /api/v1/metrics/{session_id}`
   - Query `interaction_logs` ordered by `interaction_number ASC`
   - Return the response shape from the contract above
3. Register both routers in `backend/app/main.py` (coordinate with Person 1)

**Verification**:
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"session_id":"s1","message":"hello","user_id":"u1"}' \
  --no-buffer
# Should stream SSE events ending with "event: done"

curl http://localhost:8000/api/v1/metrics/s1
# Should return interaction list with token counts
```

---

### Phase 6: Token Reduction Validation

**Goal**: Confirm the self-optimization effect works end-to-end before the demo.

**Deliverables**:
1. `backend/scripts/run_10_interactions.py` — script that sends 10 related messages to the pipeline and prints the token counts per interaction
2. Verify that by interaction 8-10, `token_count_input` is at least 50% lower than interaction 1

**Expected output** (approximate):
```
Interaction 1:  14800 input tokens, model=llama-3.3-70b-versatile, memory_hits=0
Interaction 2:  9200  input tokens, model=llama-3.3-70b-versatile, memory_hits=2
Interaction 5:  3100  input tokens, model=llama-3.1-8b-instant,    memory_hits=5
Interaction 10: 720   input tokens, model=llama-3.1-8b-instant,    memory_hits=8
```

When done, push: `git push -u origin ai-pipeline`

---

## Dependencies on Other Developers

| Phase | Depends on | What you need |
|-------|-----------|---------------|
| Phases 1-3 | Nobody | Fully independent |
| Phase 4 | Person 1, Phase 1 | `backend-core` branch: FastAPI running, `settings` importable |
| Phase 5 | Person 1, Phase 1-2 | `backend-core` branch: `get_db`, `InteractionLog`, `main.py` routers |
| Phase 6 | Person 1, Phase 5 | Full stack running via `docker compose up` |

**Coordinate with Person 3** on the SSE event format — the event names and data shapes above are agreed and final.

---

## Conventions

- All pipeline node functions must be **async** and accept/return `AgentState`
- Never call Hindsight or Groq synchronously — always `await`
- Log each pipeline step with `logging.getLogger(__name__).info(f"[{step_name}] ...")`
- The `GROQ_LARGE_MODEL` and `GROQ_SMALL_MODEL` values come from `settings` — never hardcode model names
- ChromaDB, Hindsight, and cascadeflow clients should be singletons initialized at app startup (use FastAPI lifespan)
- If the Hindsight SDK raises an exception, log it and continue with empty memories — never block the pipeline
- If cascadeflow is unavailable, fall back to the rule-based routing logic defined in Phase 3
- Write type hints everywhere — including return types on all async functions
