# AI Development Log

This document records how AI tools were used during the Hardware Hub project, how the initial dataset was handled, which prompts shaped the system, and where AI suggestions had to be corrected.

---

## Tooling

I used **GitHub Copilot** inside Visual Studio Code as the main AI assistant during this project. It helped with:

- scaffolding FastAPI routers, SQLAlchemy models, and Pydantic schemas,
- drafting React components and page layouts,
- suggesting pytest test cases for rental business rules,
- generating Dockerfiles, and Railway configuration.

I treated Copilot as a sparring partner, not an authority. Every suggestion was reviewed, tested, and often simplified or rewritten to match the MVP scope.

---

## Data Strategy

### Initial Dataset

The project did not ship with a raw CSV or JSON dataset. Instead, the seed data lives directly in `backend/app/seed.py` as validated Python objects. This made it easy to guarantee that every record matches the SQLAlchemy model and business rules from the start.

Before writing the seed, I audited the data I wanted to import. I identified several quality issues that could break the application or confuse users:

| Issue                 | Example               | How it was handled                                                        |
| --------------------- | --------------------- | ------------------------------------------------------------------------- |
| Duplicate IDs         | Duplicate ID = 4      | Removed duplicates; IDs are auto-incremented by the database.             |
| Misspelled brand      | `Appel`               | Corrected to `Apple`.                                                     |
| Invalid date format   | `22-05-2023`          | Normalized to ISO `2023-05-22`.                                           |
| Future purchase date  | `2027-10-10`          | Rejected as invalid.                                                      |
| Missing purchase date | `purchaseDate = null` | Rejected; all seeded records have a real date.                            |
| Empty brand           | `brand = ""`          | Rejected.                                                                 |
| Unknown status        | `status = Unknown`    | Mapped to one of the valid enum values (`Available`, `In Use`, `Repair`). |

### Why the Seed File Is Code, Not a Migrated Spreadsheet

Using a Python seed script instead of a raw import gave three advantages:

1. **Validation at the model level** — every value passes through SQLAlchemy and Pydantic types.
2. **No brittle migrations** — the dataset does not live in Alembic; it is idempotent (`if count == 0`) and can be re-run safely.
3. **Easy environment overrides** — admin credentials come from environment variables, so the same seed works locally, in tests, and on Railway.

### AI's Role in the Dataset Audit

Copilot helped structure the audit checklist and suggested categories to look for (duplicates, date formats, nulls). I then manually verified each record and decided which corrections to apply. The final decisions are documented in [PLAN.md](PLAN.md) and [PLAN_AI_SUGGESTIONS.md](PLAN_AI_SUGGESTIONS.md).

---

## Prompt Trail

The following prompts shaped the architecture and design of the system. They are paraphrased from the actual conversation to avoid noise, but they capture the intent and decisions that followed.

### 1. Initial Planning

> "I need to build an internal hardware rental app with admin controls, rental rules, and one AI feature. Help me plan the MVP."

Outcome:

- Copilot proposed three pillars: Management Engine, Rental Engine, AI-Native Layer.
- I kept the pillars but narrowed the AI scope to semantic search and deferred the Smart Assistant and Inventory Auditor.

### 2. Architecture

> "Suggest a backend architecture for FastAPI + SQLAlchemy + Alembic with routers, services, and models. Keep it simple."

Outcome:

- Copilot suggested a layered structure.
- I adopted the layers but kept services stateless and models simple, without over-abstracting repositories.

### 3. Authentication

> "Should I use JWT or session tokens for this MVP?"

Outcome:

- Copilot recommended JWT with refresh tokens.
- I chose random session tokens stored in the database to save time and avoid refresh-token complexity. This is documented as a deliberate trade-off in [TRADE_OFFS.md](TRADE_OFFS.md).

### 4. AI Semantic Search

> "I want natural-language search over the hardware catalog. How can I do it safely with an external LLM?"

Outcome:

- Copilot suggested sending the catalog to an LLM and asking for matching IDs.
- I added strict input sanitization, output validation, and a keyword fallback. The full design is in [AI_IMPLEMENTATION.md](AI_IMPLEMENTATION.md).

### 5. Deployment

> "How do I deploy FastAPI + React to Railway with Docker?"

Outcome:

- Copilot generated a starting `railway.json` and Dockerfile pair.
- I had to fix the backend healthcheck port and the frontend build-time API URL myself after the first deploy failed. Details are below under "Corrections."

### 6. Documentation & Requirements

> "Help me write a professional README and map the project requirements."

Outcome:

- Copilot produced drafts for README, backend README, frontend README, and a requirements checklist.
- I rewrote them to reflect my own decisions and added the transparent trade-offs document.

---

## Corrections

This section describes moments where an AI suggestion was suboptimal, buggy, or insecure, and how I fixed it.

### Correction 1: JWT Authentication Suggestion

**AI suggestion:** Implement full JWT authentication with access and refresh tokens.

**Why it was suboptimal for this MVP:**

- Refresh tokens require secure storage, rotation, and revocation logic.
- JWTs cannot be easily invalidated server-side, which complicates admin user deletion and session revocation.
- The extra complexity would consume time better spent on rental business rules and deployment.

**My fix:**

I replaced the proposed JWT flow with random session tokens generated by `secrets.token_urlsafe(32)` and stored in a `sessions` table. The token is returned on login, kept in `localStorage` by the frontend, and validated against the database on every request. This gives the backend full control over active sessions and makes logout/deletion trivial.

Files:

- [backend/app/security.py](backend/app/security.py)
- [backend/app/services/auth_service.py](backend/app/services/auth_service.py)
- [backend/app/dependencies.py](backend/app/dependencies.py)

### Correction 2: AI Search Prompt Injection Risk

**AI suggestion:** Build a prompt that asks the LLM to explain why each hardware item matches the user's request, then return natural-language results.

**Why it was risky:**

- Free-form text output is harder to validate and could leak unexpected content into the UI.
- The prompt did not include an explicit boundary against role-changing instructions or attempts to reveal hidden files.
- Returning explanations from the LLM directly could be used to display unsanitized content.

**My fix:**

- Constrained the LLM to return **only a JSON array of hardware IDs**.
- Added an explicit instruction to ignore role-changing or code-generation requests.
- Validated every returned ID against the real database catalog before returning it to the frontend.
- Added input sanitization and a deterministic keyword fallback so search works even if the LLM is compromised or down.

Files:

- [backend/app/services/ai_search_service.py](backend/app/services/ai_search_service.py)
- [docs/AI_IMPLEMENTATION.md](docs/AI_IMPLEMENTATION.md)

### Correction 3: Railway Backend Healthcheck Failure

**AI suggestion:** The generated `railway.json` and Dockerfile exposed port `8000` directly.

**What went wrong:**

Railary assigns a dynamic `$PORT` at runtime. The container started on `8000`, but Railway's healthcheck expected it on `$PORT`, so the service failed and kept restarting.

**My fix:**

- Changed the backend to bind to `$PORT` with a default fallback to `8000` for local development.
- Updated `railway.json` healthcheck path and start command accordingly.

Files:

- [backend/app/main.py](backend/app/main.py)
- [railway.json](railway.json)

### Correction 4: Frontend Calling Localhost in Production

**AI suggestion:** Configure the frontend API client with a hardcoded localhost URL for development.

**What went wrong:**

After deploying to Railway, the production frontend tried to reach `http://localhost:8000`, so every API request failed.

**My fix:**

- Added `ARG VITE_API_URL` and `ENV VITE_API_URL=$VITE_API_URL` to the frontend Dockerfile so Vite can embed the production URL at build time.
- Set the correct `VITE_API_URL` in the Railway frontend service environment variables and triggered a redeploy.

Files:

- [frontend/Dockerfile](frontend/Dockerfile)
- [frontend/src/api/client.ts](frontend/src/api/client.ts)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Correction 5: User Deletion With Active Rentals

**AI suggestion:** Allow admins to delete any user; rely on a foreign-key cascade to clean up rentals.

**Why it was suboptimal:**

- Cascading deletion of rentals would silently erase rental history, which is valuable for audits.
- Deleting a user who still has rented hardware would leave hardware in an inconsistent `In Use` state without an owner.

**My fix:**

- Added a guard that prevents deleting a user with active rentals.
- When deletion is allowed, the user's past rentals are deleted first, then the user is removed.
- Added tests for active rentals, returned rentals, self-delete, last-admin, and nonexistent user cases.

Files:

- [backend/app/services/user_service.py](backend/app/services/user_service.py)
- [backend/tests/test_users.py](backend/tests/test_users.py)

### Correction 6: AI Hallucination During Admin-to-Hardware Context Switch

**What happened:**

I asked Copilot to adjust the admin dashboard context so the admin view could manage hardware directly instead of going through a separate abstraction. The model kept proposing changes that did not match the actual React Router structure and insisted on a navigation pattern that would have broken the `/admin/hardware` route.

**Why it failed:**

The conversation context had drifted from the frontend routing setup to backend admin logic. Copilot started hallucinating an extra "admin hardware context" layer that did not exist in the codebase and generated code referencing non-existent components and state slices.

**How I fixed it:**

- I stopped the thread, opened the actual files (`frontend/src/App.tsx`, `frontend/src/pages/AdminHardwarePage.tsx`, `frontend/src/components/Layout.tsx`), and re-read the current routing and state flow.
- I reset the context by starting a fresh, focused prompt: "Here is the current router config and the admin hardware page. How do I move the admin hardware management directly into the dashboard view without adding a new context?"
- With the trimmed context, Copilot gave a correct suggestion: reuse the existing `hardware.ts` API client and lift the admin controls into a conditional section on the dashboard instead of inventing a new abstraction.

Lesson: when the model starts repeating incorrect assumptions, the fastest fix is to clear the conversation context and feed it only the relevant, current code.

## Summary

AI tools accelerated scaffolding, testing ideas, and documentation, but the final architecture and every critical decision were reviewed and often corrected. The most valuable AI contribution was not code generation — it was forcing me to articulate trade-offs clearly and remember edge cases (active rentals, prompt injection, deployment ports) that I might have overlooked.
