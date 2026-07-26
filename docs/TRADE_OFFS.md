# Implementation Status & Trade-offs

This document is a transparent summary of what is fully implemented, what shortcuts were taken to ship the MVP on time, what remains partial or missing, and what would be improved next.

## Fully Implemented

These features are stable, tested, and deployed.

| Feature                   | Status | Notes                                                                      |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| Authentication            |        | Session-based Bearer token auth with bcrypt password hashing.              |
| Admin hardware management |        | Create, edit, delete, toggle Repair, sort/filter/paginate inventory.       |
| Admin user management     |        | Create users, delete with self-delete / last-admin / active-rental guards. |
| Hardware dashboard        |        | Sorting, status/brand filters, pagination.                                 |
| Rental engine             |        | Rent/return flow with business-rule guards. Covered by backend tests.      |
| Semantic search           |        | LLM search via OpenRouter with deterministic keyword fallback.             |
| Database                  |        | SQLite + SQLAlchemy 2 + Alembic migrations.                                |
| Backend tests             |        | 14 pytest tests covering rental rules and user-deletion guards.            |
| Docker support            |        | Separate Dockerfiles for backend and frontend, plus docker-compose.        |
| Railway deployment        |        | Live demo hosted at https://hardware-hub-production-3c1d.up.railway.app.   |
| Rate limiting             |        | Slowapi applied to public endpoints.                                       |
| Dataset audit             |        | Seed data validated and normalized before import.                          |

---

## Shortcuts & Hacks

These are deliberate, documented compromises made to keep the MVP small, testable, and shipped within the deadline.

### 1. Session tokens stored in `localStorage`

**What:** Authenticated sessions are stored as Bearer tokens in `localStorage`. The frontend attaches the token to every request and the backend validates it against an in-memory session store.

**Why this shortcut was acceptable:**

- It removes the need for refresh tokens, CSRF protection, and cookie infrastructure.
- For a small internal tool with a single trusted domain, it is the fastest path to a working auth flow.
- It allowed more time to be spent on rental business rules, testing, and deployment.

**Future refactor:**

- Move to HTTP-only, SameSite cookies or short-lived JWT access tokens with a refresh-token rotation.
- Add CSRF protection if cookies are used.
- Track token metadata (created at, last used, IP) and allow users/admin to revoke sessions.

### 2. SQLite in production

**What:** The deployed backend uses a file-based SQLite database on Railway.

**Why this shortcut was acceptable:**

- SQLite is zero-config, review-friendly, and portable for a demo.
- The data volume is low (users, hardware, rentals) and concurrent writes are rare.
- It avoids the operational overhead of PostgreSQL for an MVP.

**Future refactor:**

- Migrate to PostgreSQL or MySQL once concurrency, backups, or multi-instance scaling become requirements.
- Add managed backups and connection pooling (e.g., `asyncpg` with SQLAlchemy async support).

### 3. AI search calls the full hardware catalog on every query

**What:** Semantic search sends the entire inventory list to the LLM and lets it decide what matches.

**Why this shortcut was acceptable:**

- The catalog is small, so the cost and latency are still acceptable.
- It avoids building embeddings and a vector database for an MVP.
- The deterministic keyword fallback keeps search working if the LLM is unavailable.

**Future refactor:**

- Pre-compute embeddings for hardware descriptions and store them in a vector database (e.g., pgvector, Pinecone, Qdrant).
- Move to similarity search for faster, cheaper, and scalable retrieval.

### 4. Frontend environment variable is baked in at build time

**What:** `VITE_API_URL` is passed as a Docker `ARG`/`ENV` and embedded into the built frontend bundle.

**Why this shortcut was acceptable:**

- Vite requires build-time env variables by design.
- It is straightforward to set per-environment values in Railway.

**Future refactor:**

- Serve a small runtime config endpoint from the backend (e.g., `/config`) so the same frontend bundle can be deployed to any environment without rebuilding.

---

## Partial / Missing

These items were started or considered but did not make it into the final MVP.

| Item                         | Status  | Reason it was deferred                                                                                  |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| Smart Assistant chat         | Missing | Defined in [AI_FEATURES_PLAN.md](AI_FEATURES_PLAN.md) but not implemented to keep scope tight.          |
| Inventory Auditor            | Missing | Defined in [AI_FEATURES_PLAN.md](AI_FEATURES_PLAN.md) but not implemented.                              |
| Toast notifications          | Missing | Error feedback currently uses inline text and alerts; toast library adds dependency without core value. |
| Dark mode                    | Missing | Nice-to-have UI enhancement; deferred to focus on functionality.                                        |
| User profile page            | Missing | Admins manage users; users only need rental history, which already exists on My Rentals.                |
| Vector-based semantic search | Missing | LLM search covers current needs; vector DB is planned for scale.                                        |
| Full e2e tests               | Missing | Only backend unit tests exist. e2e would require a Playwright/Cypress setup and more time.              |

---

## Next Steps (The 24h Roadmap)

If I had one more day, these would be the top priorities:

### 1. PostgreSQL + persistent storage on Railway

SQLite works for a demo but is risky for real use. I would migrate to PostgreSQL, update Alembic config, and switch to SQLAlchemy async with connection pooling. This unblocks backups, scaling, and safer concurrency.

### 2. End-to-end test coverage with Playwright

The backend has strong unit tests, but the frontend is only tested manually. I would add Playwright tests for the critical flows: login, renting hardware, returning hardware, admin creating a user, and admin deleting hardware. This prevents UI regressions and gives confidence before adding new features.

### 3. Feature improvements at scale

These improvements become relevant once the user base or catalog grows beyond the MVP size:

- **OAuth provider support** — Add Google / GitHub SSO so employees do not need separate credentials. Keeps user onboarding fast and centralizes identity management.
- **Vector database for semantic search** — With ~1,000 hardware items, sending the full catalog to the LLM on every query becomes expensive. Pre-compute embeddings and store them in pgvector or a dedicated vector store, then retrieve the top-k matches before asking the LLM for a short explanation.
- **Redis for AI search caching** — Cache common search queries (e.g., "laptop for presentations") to reduce LLM cost and latency. TTL-based invalidation keeps results fresh when inventory changes.
- **General API caching** — Cache frequently read endpoints such as the hardware dashboard and rental history. Redis or an in-memory cache would cut database load and improve response times.
- **WebSockets for real-time reload** — Push inventory status updates and rental events to connected clients so the dashboard refreshes without manual reload.
- **Async LLM processing with a queue** — Move LLM calls out of the request path and into a background worker (Celery, RQ, or FastAPI background tasks backed by Redis). This prevents long waits under load and lets the system handle many concurrent users gracefully.

---

## Closing Thought

The goal of this MVP was to prove a solid core: a clean rental engine, admin controls, working AI search, real tests, and a live demo. The shortcuts above are known, bounded, and documented. None of them block the product from being demonstrated, reviewed, or extended.
