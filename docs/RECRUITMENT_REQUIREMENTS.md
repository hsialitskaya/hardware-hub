# Recruitment Requirements Checklist

This document maps every requirement recruitment task to the corresponding implementation, documentation, or deployment artifact in this repository.

## 1. Repository with Clean Commit History

**Requirement:** Link to a public GitHub/GitLab repo with a clean commit history. A clean commit history showing incremental "collaboration" with AI is much better than one giant "initial commit".

**Status:** Satisfied.

- Public repository: https://github.com/hsialitskaya/hardware-hub
- Commit history shows incremental, scoped changes with conventional-commit-style messages:
  - `feat(hardware): ...`
  - `feat(ui): ...`
  - `feat(deploy): ...`
  - `docs(...): ...`
  - `fix(...): ...`
- The history reflects the real development flow, including iterative planning, a manual dataset audit, and incremental fixes.

## 2. Comprehensive README.md with Setup Instructions

**Requirement:** A comprehensive README.md with setup instructions.

**Status:** Satisfied.

- [README.md](../README.md) — project overview, live demo link, feature summary, tech stack, quick start for backend and frontend, testing instructions, and links to all documentation.
- [backend/README.md](../backend/README.md) — backend installation, configuration, database setup, API endpoints, and design decisions.
- [frontend/README.md](../frontend/README.md) — frontend installation, environment variables, available scripts, and design decisions.

## 3. Live Demo Link

**Requirement:** A live demo link (Vercel, Railway, Fly.io, etc.) is a huge plus.

**Status:** Satisfied.

- Live demo: https://hardware-hub-production-3c1d.up.railway.app
- API docs: https://hardware-hub-production-6b8f.up.railway.app/docs
- Demo credentials: `admin@example.com` / `ChangeMe123!`
- Deployment is configured for Railway via `railway.json` and Dockerfiles.
- Detailed deployment steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

## 4. Timeline

**Requirement:** The preparation of this assignment should take about 4–5 hours. Please share the results at least 48 hours before the interview.

**Status:** Noted.

- The work was completed incrementally within the suggested timeframe.
- The repository is ready for review before the interview.

## 5. Results Walkthrough

**Requirement:** Be prepared to walk through the assignment results in detail during the final interview. We will dive deep into your documentation and decision-making process.

**Status:** Prepared.

- The following documents support a detailed walkthrough:
  - [ARCHITECTURE.md](ARCHITECTURE.md) — architecture and design decisions.
  - [PLAN.md](PLAN.md) — final implementation plan.
  - [PLAN_AI_SUGGESTIONS.md](PLAN_AI_SUGGESTIONS.md) — original AI-suggested plan.
  - [FEATURES.md](FEATURES.md) — detailed feature walkthrough.
  - [TESTING.md](TESTING.md) — test coverage and critical scenarios.
  - [DEPLOYMENT.md](DEPLOYMENT.md) — deployment process and security checklist.
  - [AI_FEATURES_PLAN.md](AI_FEATURES_PLAN.md) — roadmap for future AI features.

## Scope Coverage

### The Management Engine (Admin & Users)

| Requirement                                             | Where it is implemented                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------- |
| Admin Command Center for managing hardware              | `frontend/src/pages/AdminHardwarePage.tsx`                        |
| Admin can add hardware                                  | `backend/app/services/hardware_service.py` → `create_hardware`    |
| Admin can delete hardware                               | `backend/app/services/hardware_service.py` → `delete_hardware`    |
| Admin can toggle Repair status                          | `backend/app/services/hardware_service.py` → `update_hardware`    |
| Admin can create user accounts                          | `backend/app/services/user_service.py` → `create_user`            |
| Login screen for previously created users               | `frontend/src/pages/LoginPage.tsx`, `backend/app/routers/auth.py` |
| Smart Dashboard with Name, Brand, Purchase Date, Status | `frontend/src/pages/DashboardPage.tsx`                            |
| Sorting and filtering on the dashboard                  | `backend/app/services/hardware_service.py` → `list_hardware`      |

### The Rental Engine (Business Logic)

| Requirement                         | Where it is implemented                                      |
| ----------------------------------- | ------------------------------------------------------------ |
| Rent flow with status → In Use      | `backend/app/services/rental_service.py` → `rent_hardware`   |
| Return flow with status → Available | `backend/app/services/rental_service.py` → `return_hardware` |
| Cannot rent unavailable hardware    | `backend/tests/test_rental_rules.py`                         |
| Cannot rent repaired hardware       | `backend/tests/test_rental_rules.py`                         |
| Cannot rent already rented hardware | `backend/tests/test_rental_rules.py`                         |
| Cannot return someone else's rental | `backend/tests/test_rental_rules.py`                         |

### Hardware Management Guards

| Requirement                                     | Where it is implemented                |
| ----------------------------------------------- | -------------------------------------- |
| Cannot add hardware with a future purchase date | `backend/tests/test_hardware_rules.py` |
| Cannot edit hardware while it is rented         | `backend/tests/test_hardware_rules.py` |
| Cannot delete hardware while it is rented       | `backend/tests/test_hardware_rules.py` |

### The AI-Native Layer

| Requirement                             | Where it is implemented                                           |
| --------------------------------------- | ----------------------------------------------------------------- |
| Semantic search using natural language  | `backend/app/services/ai_search_service.py`                       |
| LLM integration via OpenRouter          | `backend/app/services/ai_search_service.py`                       |
| Keyword fallback when AI is unavailable | `backend/app/services/ai_search_service.py` → `_keyword_fallback` |
| Future AI features planned              | [AI_FEATURES_PLAN.md](AI_FEATURES_PLAN.md)                        |

## Additional Highlights

- **Testing:** 21 backend tests covering rental, hardware-management, and user-management critical paths.
- **Rate limiting:** Slowapi protects public endpoints.
- **Responsive UI:** Works on mobile, tablet, and desktop.
- **Docker support:** Both frontend and backend have Dockerfiles and a `docker-compose.yml`.
- **Security:** CORS origins are configurable, passwords are hashed, secrets are environment-driven.

## What to Show During the Interview

1. Open the live demo and log in.
2. Show the Admin hardware and user management flows.
3. Demonstrate renting and returning a device.
4. Try the AI semantic search.
5. Walk through the test suite and explain the critical guards.
6. Discuss the architecture and why certain AI suggestions were accepted or adjusted.
7. Explain the deployment process on Railway.
