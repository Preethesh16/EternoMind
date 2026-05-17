# Requirements Document

## Introduction

SOMA (Self-Optimizing Memory-Aware AI Runtime) is a hackathon project built for "Building AI Agents with Hindsight & cascadeflow". The core innovation is that memory itself IS the token optimization system — every interaction makes the AI smarter, cheaper, and faster. The system ships as five deliverables: a project README, and three developer workstream files (person1.md, person2.md, person3.md) that each developer can paste into Kiro with Claude Opus 4.7 to begin building their portion of the system independently.

This requirements document covers the planning and documentation deliverables — no implementation code is produced during this phase.

## Glossary

- **SOMA**: Self-Optimizing Memory-Aware AI Runtime — the overall hackathon project.
- **Hindsight**: Mandatory third-party persistent memory SDK used for memory storage and retrieval.
- **cascadeflow**: Mandatory third-party runtime intelligence library used for model routing and optimization.
- **Groq**: Mandatory LLM inference provider.
- **LangGraph**: Orchestration framework used for the 12-step agent pipeline.
- **12-Step_Pipeline**: The ordered processing sequence: Security → LangGraph Orchestration → Hindsight Memory Retrieval → Context Relevancy → RAG Retrieval → Prompt Optimizer → cascadeflow Routing → Groq LLM → Validation → Response → Memory Learning Update.
- **Token_Savings_Demo**: The visible progression from ~15,000 tokens on interaction 1 to ~720 tokens on interaction 10, demonstrating the self-optimization effect.
- **Developer_Workstream_File**: A self-contained Markdown file (person1.md, person2.md, or person3.md) a developer pastes into Kiro to receive complete build instructions for their portion of SOMA.
- **README**: The top-level project README.md describing SOMA's architecture, setup, and demo instructions.
- **Person_1**: Developer responsible for Backend Core (FastAPI foundation, database, security, auth, project setup).
- **Person_2**: Developer responsible for AI/Agent Pipeline (LangGraph orchestration, Hindsight memory, RAG, Prompt Optimizer, cascadeflow integration).
- **Person_3**: Developer responsible for Frontend and Integration (React dashboard, chat UI, token savings charts, SSE streaming, Docker Compose, demo).
- **Shared_Interface_Contract**: The agreed API shapes, data schemas, and WebSocket/SSE event formats that allow the three workstreams to integrate without conflict.

---

## Requirements

### Requirement 1: Project README

**User Story:** As a hackathon participant, I want a comprehensive README.md at the project root, so that any developer who clones the repo immediately understands SOMA, can set it up, and can run the demo.

#### Acceptance Criteria

1. THE README SHALL contain a project title, one-paragraph elevator pitch, and a list of the three mandatory technologies (Hindsight, cascadeflow, Groq).
2. THE README SHALL describe the pipeline steps in a numbered list with a one-sentence description of each step.
3. THE README SHALL include a Token_Savings_Demo section containing a table with columns for interaction number, approximate token count, model used, and a causal explanation of why token count drops (e.g., "Hindsight returned N relevant memories, reducing context reconstruction cost").
4. THE README SHALL provide a Prerequisites section listing required software versions (Python 3.11+, Node.js 18+, Docker, Docker Compose v2+).
5. THE README SHALL provide a Quick Start section with the exact shell commands to clone the repo, copy environment variable templates, and launch all services via Docker Compose.
6. THE README SHALL include an Architecture section with a directory tree showing backend/app/ and frontend/src/ sub-directories and their purpose.
7. THE README SHALL list the three developer workstream files (person1.md, person2.md, person3.md) and one sentence describing each developer's ownership.
8. THE README SHALL contain a note in the Prerequisites or Quick Start section directing the user to .env.example for the full list of required environment variables and their descriptions.

---

### Requirement 2: Developer Workstream Files Are Self-Contained

**User Story:** As a developer using Kiro, I want my workstream file to be entirely self-contained, so that I can paste it into Kiro and start building without needing to read any other file first.

#### Acceptance Criteria

1. WHEN a Developer_Workstream_File is opened in Kiro, THE Developer_Workstream_File SHALL include each of the following context elements inline: (a) the hackathon name and theme, (b) the three mandatory technology names and their roles, (c) the full tech stack table, (d) the complete directory layout for the files that developer owns, and (e) the project's core value proposition (memory-driven token optimization).
2. THE Developer_Workstream_File SHALL specify the exact Kiro model to use: Claude Opus 4.7.
3. THE Developer_Workstream_File SHALL list every file path and directory the developer owns under a dedicated "What You Own" section, AND list at least three file paths or directories the developer does NOT own, so ownership boundaries are unambiguous.
4. THE Developer_Workstream_File SHALL define the Shared_Interface_Contract relevant to that developer (API endpoints, request/response schemas, SSE event names, database table names) so integration is unambiguous, referencing the Integration Contracts section of the README as the canonical source.
5. THE Developer_Workstream_File SHALL organize build tasks into numbered phases ordered by dependency, with each phase listing named files or artifacts (identified by file path or script name) as specific deliverables.
6. IF a phase depends on work from another developer's workstream, THE Developer_Workstream_File SHALL identify that dependency by developer number, phase number, and the specific artifact or contract that must be available before the phase can begin.

---

### Requirement 3: Person 1 Workstream — Backend Core

**User Story:** As Person_1, I want a complete workstream file describing the backend foundation, so that I can scaffold the FastAPI project, configure the database, and implement security and auth for the team to build on.

#### Acceptance Criteria

1. THE person1.md SHALL instruct Person_1 to create the top-level project scaffold including docker-compose.yml, .env.example, and backend/app/ directory layout.
2. THE person1.md SHALL specify creation of SQLite database models and Alembic migration setup for sessions, users, and interaction_logs tables.
3. THE person1.md SHALL specify implementation of the security pipeline step: input sanitization, prompt injection detection, and rate limiting middleware enforcing a limit of 60 requests/minute per IP on /api/v1/chat and 10 requests/minute per IP on /api/v1/auth/login, returning HTTP 429 with a Retry-After header when exceeded.
4. THE person1.md SHALL specify JWT-based authentication with login, refresh, and logout endpoints under /api/v1/auth/, where access tokens expire in 30 minutes and refresh tokens expire in 7 days.
5. THE person1.md SHALL specify a health-check endpoint (GET /api/v1/health) that returns service status for backend, Redis, and ChromaDB.
6. THE person1.md SHALL specify a sessions endpoint (POST /api/v1/sessions, GET /api/v1/sessions/{id}) for Person_3's frontend to consume.
7. THE person1.md SHALL define the exact request and response schemas for every endpoint Person_1 owns, referencing the Integration Contracts section of the README as the canonical source.
8. WHEN Person_1 completes each phase, THE person1.md SHALL instruct Person_1 to run pytest and verify: POST /api/v1/auth/login returns 200 on valid credentials and 401 on invalid credentials; POST /api/v1/sessions returns 201; GET /api/v1/sessions/{id} returns 200 for existing sessions and 404 for unknown IDs; GET /api/v1/health returns 200.
9. THE person1.md SHALL specify that the rate limiter returns HTTP 429 with a Retry-After header (value in seconds) whenever a per-IP request limit is exceeded.

---

### Requirement 4: Person 2 Workstream — AI/Agent Pipeline

**User Story:** As Person_2, I want a complete workstream file describing the AI pipeline, so that I can implement the LangGraph orchestration, Hindsight memory, RAG, Prompt Optimizer, and cascadeflow routing that form SOMA's core intelligence.

#### Acceptance Criteria

1. THE person2.md SHALL instruct Person_2 to implement the LangGraph state machine covering nodes for Memory Retrieval, Context Relevancy, RAG Retrieval, Prompt Optimizer, Model Router, LLM Inference, Validator, and Memory Updater (steps 3 through 9 and step 11 of the pipeline).
2. THE person2.md SHALL specify integration with the Hindsight SDK for persistent memory storage and retrieval using user_id-scoped memory namespaces (not session-scoped), storing only compressed summaries rather than raw conversation history.
3. THE person2.md SHALL specify a Context_Relevancy scorer that filters retrieved memories to only those with a relevance_score of 0.65 or higher before including them in the prompt.
4. THE person2.md SHALL specify a ChromaDB-backed RAG retrieval step with document ingestion and similarity search returning at most k=5 chunks.
5. THE person2.md SHALL specify a Prompt_Optimizer step that uses the top-3 memories by relevance_score and the top-2 RAG documents by score, and that estimates token count using len(prompt.split()) * 1.3.
6. THE person2.md SHALL specify cascadeflow integration for model routing: route to GROQ_SMALL_MODEL when memory_hits >= 4 AND token_estimate < 2000; route to GROQ_LARGE_MODEL in all other cases. IF cascadeflow SDK is unavailable, THE person2.md SHALL instruct Person_2 to fall back to this rule-based logic.
7. THE person2.md SHALL specify Groq as the sole LLM inference provider with model names read from the GROQ_LARGE_MODEL and GROQ_SMALL_MODEL environment variables.
8. THE person2.md SHALL define the chat endpoint (POST /api/v1/chat) with request schema {session_id: string, message: string, user_id: string} and the following four SSE event types emitted in wire format `event: <name>\ndata: <json>\n\n`: (a) `pipeline_step` with data `{"step": "<step_name>", "status": "running"}`, (b) `token` with data `{"step": "response", "token_delta": "<chunk>"}`, (c) `done` with data `{"total_tokens": int, "model": string, "latency_ms": float, "memory_hits": int}`, (d) `error` with data `{"step": "<step_name>", "message": "<error_text>"}`.
9. THE person2.md SHALL specify a pipeline metrics endpoint (GET /api/v1/metrics/{session_id}) returning per-interaction token counts (token_count_input, token_count_output), model_used, latency_ms, and memory_hits as an integer count.
10. WHEN the pipeline processes an interaction, THE person2.md SHALL instruct Person_2 to INSERT a row into interaction_logs with columns: session_id, user_id, interaction_number (COUNT of prior rows for this session + 1), token_count_input, token_count_output, model_used, memory_hits, latency_ms, and created_at (UTC).

---

### Requirement 5: Person 3 Workstream — Frontend and Integration

**User Story:** As Person_3, I want a complete workstream file describing the frontend and integration layer, so that I can build the React dashboard, chat UI, token savings visualization, and wire everything together for the demo.

#### Acceptance Criteria

1. THE person3.md SHALL instruct Person_3 to build the React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui project under frontend/src/.
2. THE person3.md SHALL specify a ChatInterface component that sends messages to POST /api/v1/chat using fetch with ReadableStream (not EventSource, which does not support POST), and appends each token_delta string from `token` SSE events to the assistant message currently in progress.
3. THE person3.md SHALL specify a TokenSavingsChart component using Recharts that plots token_count_input and token_count_output per interaction_number, with a reference line at y=720 labeled "Memory-optimized baseline".
4. THE person3.md SHALL specify a PipelineStepsPanel component that renders the following 11 named steps: Security, LangGraph, Memory Retrieval, Context Relevancy, RAG Retrieval, Prompt Optimizer, cascadeflow Routing, Groq LLM, Validation, Response, Memory Update — each transitioning from idle (grey) to running (animated blue) on receiving a `pipeline_step` SSE event matching that step name.
5. THE person3.md SHALL specify Zustand stores for chat state (messages, streaming state, currentPipelineStep), session state (userId, sessionId, accessToken, isAuthenticated), and metrics state (interactions array).
6. THE person3.md SHALL specify the Docker Compose configuration (docker-compose.yml) that maps backend to port 8000, frontend to port 5173, Redis to port 6379 (internal only), and ChromaDB to port 8001 (internal only), with all services reading environment variables from the root .env file.
7. THE person3.md SHALL define the SSE event schema as four event types — `pipeline_step`, `token`, `done`, `error` — each with fields `event: string`, `data: object`, and `token_delta: string`; specifically the `done` event data SHALL include the `memory_hits` integer field.
8. WHEN the demo is run, THE person3.md SHALL include a demo script section with numbered steps showing at minimum: sending an initial query (interaction 1, ~15,000 tokens), sending 9 follow-up queries on the same topic, and pointing judges to the TokenSavingsChart showing the downward curve on interaction 10 (~720 tokens).
9. IF a network error occurs when calling POST /api/v1/chat, THE person3.md SHALL instruct Person_3 to display a red banner in the ChatInterface with the text "Could not connect to SOMA backend. Retrying..." and a spinner, without crashing or losing the existing message history.

---

### Requirement 6: Shared Interface Contracts Are Consistent Across All Files

**User Story:** As the team lead, I want all shared API contracts to be identical across all three workstream files, so that developers can integrate their work without conflicts.

#### Acceptance Criteria

1. THE README SHALL contain an Integration Contracts section listing every shared endpoint URL, HTTP method, and full request/response schema — including POST /api/v1/chat, GET /api/v1/metrics/{session_id}, POST /api/v1/sessions, GET /api/v1/sessions/{session_id}, GET /api/v1/health, and the POST /api/v1/auth/* endpoints — as defined in the three workstream files.
2. WHEN the same endpoint is referenced in multiple Developer_Workstream_Files, THE endpoint URL, HTTP method, and field names SHALL be identical across all files.
3. THE SSE event schema in person3.md and the SSE emission specification in person2.md SHALL use the same four event type strings (`pipeline_step`, `token`, `done`, `error`) and the same field names; specifically both SHALL include `memory_hits` as an integer field in the `done` event data, and both SHALL show `pipeline_step` event data as `{"step": "<step_name>", "status": "running"}` (not an empty object).
4. THE interaction_logs table schema in person1.md and the INSERT specification in person2.md SHALL use the same column names: id, session_id, user_id, interaction_number, token_count_input, token_count_output, model_used, memory_hits, latency_ms, created_at.
