# Progress Log — Person 2 (AI/Agent Pipeline)

> Auto-updated after every prompt / workflow change in this session.

---

## [2026-05-18] — Branch Created & Work Begins

- Read `person2.md` to understand full workstream scope
- Confirmed Person 1 (`backend-core`) is fully merged into `main` — Phases 1-4 complete
- Created and checked out branch `ai-pipeline`
- Created `progress2.md` (this file) and `project_structure2.md`

### What is now available from Person 1
- FastAPI app running at `http://localhost:8000`
- `get_db()` dependency available in `app.db.database`
- `InteractionLog`, `ChatSession`, `User` ORM models in `app.db.models`
- `settings` importable from `app.config` (includes `GROQ_API_KEY`, `HINDSIGHT_API_KEY`, `CASCADEFLOW_API_KEY`, `GROQ_LARGE_MODEL`, `GROQ_SMALL_MODEL`)
- Demo credentials: `username: demo`, `password: wW0-N87fP5lCJY2o`

---

## [2026-05-18] — Phases 1–3 Complete ✅

### What was built

**Phase 1 — Hindsight Memory Integration**
- Added AI/pipeline dependencies to `backend/requirements.txt`:
  - `hindsight-client`, `langchain==0.2.5`, `langgraph==0.1.5`, `langchain-groq==0.1.5`, `groq==0.9.0`, `chromadb==0.5.0`
- `backend/app/memory/__init__.py` — package init
- `backend/app/memory/hindsight_client.py` — `HindsightClient` wrapper:
  - `retrieve(user_id, query)` → `list[dict]` with `content`, `relevance_score`, `memory_id`
  - `update(user_id, query, response)` → stores new memory
  - Graceful fallback: logs error and returns `[]` if SDK raises

**Phase 2 — ChromaDB RAG**
- `backend/app/rag/__init__.py` — package init
- `backend/app/rag/chroma_client.py` — singleton ChromaDB client connecting to `settings.chroma_host:settings.chroma_port`
- `backend/app/rag/retriever.py` — `RAGRetriever`:
  - `ingest(documents, metadatas)` — batch upsert into `eternomind_documents` collection
  - `similarity_search(query, k=5)` → `list[dict]` with `content`, `score`, `metadata`
- `backend/scripts/ingest_demo_docs.py` — ingests 10 AI/transformer sample documents for demo

**Phase 3 — Prompt Optimizer & cascadeflow Router**
- `backend/app/optimization/__init__.py` — package init
- `backend/app/optimization/prompt_optimizer.py` — `PromptOptimizer`:
  - Compresses context: top-3 memories by relevance_score, top-2 RAG docs by score
  - Token estimate: `len(prompt.split()) * 1.3`
  - Returns `(optimized_prompt, token_estimate)`
- `backend/app/optimization/cascadeflow_router.py` — `CascadeflowRouter`:
  - Routes to `GROQ_SMALL_MODEL` if `memory_hits >= 4` AND `token_estimate < 2000`
  - Falls back to `GROQ_LARGE_MODEL` otherwise
  - Integrates cascadeflow SDK if available; falls back to rule-based logic

### ⚠️ Manual steps required before Phase 4

See `project_structure2.md` → "Manual Integration Steps Required" section:
1. Get API keys: `GROQ_API_KEY`, `HINDSIGHT_API_KEY`, `CASCADEFLOW_API_KEY`
2. Add them to `.env` file
3. Install new dependencies: `pip install -r requirements.txt`
4. Start ChromaDB (via Docker or standalone) before running the pipeline
5. Run `python scripts/ingest_demo_docs.py` to seed RAG documents

### Next step
- **Phase 4**: LangGraph State Machine — wire all nodes into a single executable pipeline
  - Requires Person 1's `backend-core` branch (already merged ✅)

---


## [2026-05-18] — Bugfix: cascadeflow SDK Integration ✅

### Issue raised by Person 3 (in TEAM_NOTES.md)
`backend/app/optimization/cascadeflow_router.py` was using a non-existent API:
```python
self._sdk_client = cascadeflow.Client(api_key=settings.cascadeflow_api_key)  # WRONG
```
The real cascadeflow API uses `cascadeflow.init()` + `CascadeAgent`. The fallback rule-based logic kept the demo working, but the SDK was never actually invoked.

### What was fixed
Rewrote `cascadeflow_router.py` to use the correct API per the official docs:
- `cascadeflow.init(mode="observe")` — activates the harness once at startup
- `CascadeAgent(models=[ModelConfig(...)], quality_config={...})` — built with both Groq models in cost order
- cascadeflow does NOT use its own API key — it uses `GROQ_API_KEY` from the environment
- Added explicit `os.environ["GROQ_API_KEY"]` export so the provider layer always finds it
- Routing decision still uses the deterministic rule (memory_hits >= 4 AND token_estimate < 2000 → small model) for the fast pre-execution path
- The harness now observes all downstream Groq calls for free, even when the SDK isn't strictly being asked to cascade

### Other changes
- Added `cascadeflow` to `backend/requirements.txt`

### References
- https://docs.cascadeflow.ai/api-reference/python/init
- https://docs.cascadeflow.ai/api-reference/python/cascade-agent
- https://docs.cascadeflow.ai/api-reference/python/environment

### Verification
- `python3 -m py_compile backend/app/optimization/cascadeflow_router.py` → OK
- Fallback path still triggers when `cascadeflow` is not installed (ImportError caught)

---
