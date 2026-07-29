# Development Challenges & Solutions

This document captures the real problems encountered while building **Hardware Hub**, how they were diagnosed, and the decisions made to resolve them. It is intended as a practical learning log for anyone reviewing or extending the project.

---

## Table of Contents

1. [Authentication: JWT vs. Session Tokens](#1-authentication-jwt-vs-session-tokens)
2. [AI Search Safety & Robustness](#2-ai-search-safety--robustness)
3. [Deployment to Railway](#3-deployment-to-railway)
   - [3.1 Dynamic Backend Port](#31-dynamic-backend-port)
   - [3.2 Frontend Calling Localhost in Production](#32-frontend-calling-localhost-in-production)
4. [Data Quality & SQLite Pitfalls](#4-data-quality--sqlite-pitfalls)
   - [4.1 Auditing Seed Data](#41-auditing-seed-data)
   - [4.2 SQLite Working Directory Traps](#42-sqlite-working-directory-traps)
5. [Business Logic Guards](#5-business-logic-guards)
   - [5.1 Deleting Users with Active Rentals](#51-deleting-users-with-active-rentals)
   - [5.2 Rental State Machine](#52-rental-state-machine)
6. [Working Effectively with AI Assistants](#6-working-effectively-with-ai-assistants)
7. [Frontend-Backend Session Handling](#7-frontend-backend-session-handling)
8. [Summary](#8-summary)

---

## 1. Authentication: JWT vs. Session Tokens

### Problem

The initial AI suggestion was to implement full **JWT authentication** with access and refresh tokens. While common, this would have added significant complexity for an MVP:

- Refresh tokens require secure storage, rotation, and revocation logic.
- JWTs cannot be easily invalidated server-side, complicating admin user deletion and session revocation.
- The extra implementation time would have pulled focus away from core rental business rules and deployment.

### Solution

I replaced JWTs with random **session tokens** generated via `secrets.token_urlsafe(32)` and stored in a `sessions` database table.

- On login, the backend returns a Bearer token.
- The frontend stores the token in `localStorage` and attaches it to every request.
- The backend validates the token against the database on every protected call.

This gives the backend full control over active sessions and makes logout or user deletion trivial.

### Files Involved

- [backend/app/security.py](backend/app/security.py)
- [backend/app/services/auth_service.py](backend/app/services/auth_service.py)
- [backend/app/dependencies.py](backend/app/dependencies.py)
- [docs/TRADE_OFFS.md](docs/TRADE_OFFS.md)

---

## 2. AI Search Safety & Robustness

### Problem

The first proposal for semantic search asked the LLM to return free-text explanations for each match. This introduced several risks:

- Free-form output is hard to validate and render safely in the UI.
- The prompt lacked explicit boundaries against role-changing instructions or attempts to reveal hidden files.
- Without validation, the model could hallucinate device IDs or leak unexpected content.

### Solution

I constrained the LLM to return **only a JSON array of hardware IDs**, for example `[1, 4, 7]`.

Additional safeguards added:

- **Input sanitization:** query is trimmed, length-limited to 200 characters, and rejected if it contains characters outside an allowed set.
- **Instruction defense:** the prompt explicitly tells the model to ignore role-changing or code-generation requests.
- **Output validation:** the response is parsed as JSON, must be a list, and every returned ID is checked against the real hardware catalog.
- **Keyword fallback:** if the LLM is unavailable, the API key is missing, sanitization fails, or the response is malformed, the system falls back to deterministic keyword search.

### Files Involved

- [backend/app/services/ai_search_service.py](backend/app/services/ai_search_service.py)
- [docs/AI_IMPLEMENTATION.md](docs/AI_IMPLEMENTATION.md)

---

## 3. Deployment to Railway

### 3.1 Dynamic Backend Port

#### Problem

The first version of the backend Dockerfile and `railway.json` exposed port `8000`. Railway, however, assigns a dynamic port via the `$PORT` environment variable. The container started on `8000`, but Railway's healthcheck expected it on `$PORT`, causing the service to fail and restart continuously.

#### Solution

Updated the backend to bind to `$PORT` with a default fallback of `8000` for local development, and adjusted `railway.json` accordingly.

### Files Involved

- [railway.json](railway.json)
- [backend/app/main.py](backend/app/main.py)

### 3.2 Frontend Calling Localhost in Production

#### Problem

After deploying the frontend to Railway, it still tried to reach `http://localhost:8000`, so all API requests failed.

#### Solution

Vite embeds environment variables at build time, so I added `ARG VITE_API_URL` and `ENV VITE_API_URL=$VITE_API_URL` to the frontend Dockerfile. The production URL is supplied as a build argument in `docker-compose.yml` and as an environment variable in the Railway frontend service configuration.

### Files Involved

- [frontend/Dockerfile](frontend/Dockerfile)
- [frontend/src/api/client.ts](frontend/src/api/client.ts)
- [docker-compose.yml](docker-compose.yml)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 4. Data Quality & SQLite Pitfalls

### 4.1 Auditing Seed Data

#### Problem

The original dataset contained quality issues that could break the app or confuse users:

| Issue                 | Example                 | Resolution                                   |
| --------------------- | ----------------------- | -------------------------------------------- |
| Duplicate IDs         | `id = 4` appeared twice | IDs made auto-incrementing                   |
| Misspelled brand      | `Appel`                 | Corrected to `Apple`                         |
| Invalid date format   | `22-05-2023`            | Normalized to ISO `2023-05-22`               |
| Future purchase date  | `2027-10-10`            | Rejected as invalid                          |
| Missing purchase date | `purchaseDate = null`   | Rejected; all records seeded with real dates |
| Empty brand           | `brand = ""`            | Rejected                                     |
| Unknown status        | `status = Unknown`      | Mapped to valid enum value                   |

#### Solution

Instead of importing a raw CSV or JSON file, the seed data lives as validated Python objects in [backend/app/seed.py](backend/app/seed.py). This guarantees that every record passes through SQLAlchemy and Pydantic validation, and the seed script is idempotent (`if count == 0`) so it can be re-run safely.

### Files Involved

- [backend/app/seed.py](backend/app/seed.py)
- [docs/AI_DEVELOPMENT_LOG.md](docs/AI_DEVELOPMENT_LOG.md)

---

## 5. Business Logic Guards

### 5.1 Deleting Users with Active Rentals

#### Problem

The initial suggestion was to rely on foreign-key cascade deletion for rentals when a user is deleted. This would have:

- Silently erased valuable rental history needed for audits.
- Left hardware in an inconsistent `In Use` state without an owner.

#### Solution

Added explicit deletion guards:

- Users with active rentals cannot be deleted.
- Admins cannot delete their own account.
- The last admin cannot be deleted.
- When deletion is allowed, historical rentals are removed first, then the user.

This logic is covered by backend tests.

### Files Involved

- [backend/app/services/user_service.py](backend/app/services/user_service.py)
- [backend/tests/test_users.py](backend/tests/test_users.py)

---

## 6. Summary

The biggest challenges clustered around three areas:

1. **Security** — simplifying auth to session tokens, constraining the LLM to JSON IDs, and sanitizing user input.
2. **Deployment** — handling Railway's dynamic `$PORT` and Vite's build-time environment variables.
3. **Data consistency & business logic** — auditing seed data, enforcing rental rules, and protecting user-deletion invariants.

Each issue was resolved not only in code but also through documented decisions in [TRADE_OFFS.md](TRADE_OFFS.md), [AI_IMPLEMENTATION.md](AI_IMPLEMENTATION.md), and [AI_DEVELOPMENT_LOG.md](AI_DEVELOPMENT_LOG.md). This keeps the project transparent, reviewable, and easy to extend.
