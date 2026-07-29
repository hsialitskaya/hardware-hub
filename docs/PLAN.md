# Hardware Hub – Final Project Plan

> This document describes the final implementation plan for the Hardware Hub project. It is based on the AI-suggested plan but includes my own decisions, adjustments, and additions.
>
> The original AI suggestions are preserved in [PLAN_AI_SUGGESTIONS.md](PLAN_AI_SUGGESTIONS.md).

---

## Project

**Name:** Hardware Hub  
**Goal:** Build an internal application for managing, renting, and maintaining company hardware while demonstrating an AI-first engineering workflow.

## Final Objectives

Deliver a stable MVP with three pillars:

1. **Management Engine** — Admin and user management.
2. **Rental Engine** — Rent/return flow with strict business-rule guards.
3. **AI-Native Layer** — Semantic search using an LLM.

The priority is clean architecture, good documentation, transparent decisions, and a working live demo.

## Implemented Must-Have Features

### 1. Authentication

- Login page for all users.
- Session-based authentication using Bearer tokens stored in `localStorage`.
- Only Admin can create user accounts.
- Only previously created users can log in.
- 401 responses redirect unauthenticated users to `/login`.

### 2. Hardware Management (Admin)

- Add new hardware with Name, Brand, Serial Number, Purchase Date, Status, and Notes.
- Edit hardware information.
- Delete hardware.
- Toggle Repair status, with a guard that prevents marking actively rented devices as Repair.
- View complete inventory.

### 3. User Management (Admin)

- Create new user accounts.
- View all users.
- Delete users, with three safeguards:
  - Cannot delete yourself.
  - Cannot delete the last admin.
  - Cannot delete a user with active rentals.

### 4. Hardware Dashboard

Table columns:

- Name
- Brand
- Purchase Date
- Status

Additional functionality:

- Sorting by Name, Brand, Purchase Date, and Status, with ascending/descending order.
- Filtering by status.
- Filtering by brand.
- Pagination.

### 5. Rental Engine

Users can:

- Rent available hardware.
- Return hardware they rented themselves.
- View personal rental history.

Business-rule guards:

- Only Available devices can be rented.
- Repair devices cannot be rented.
- In Use devices cannot be rented.
- Unknown statuses are rejected.
- Returning a device restores its Available status.
- Users cannot return rentals belonging to others.
- Already returned rentals cannot be returned again.

### 6. AI Feature

**Chosen feature:** Semantic Search.

Users type natural-language queries, for example:

> "I need something to test Android applications."

The backend sends the catalog to an LLM via OpenRouter and returns matching hardware with a reason for each match. If the AI service is unavailable or the API key is missing, the system falls back to keyword search.

### 7. Database

- SQLite for portability and ease of review.
- SQLAlchemy ORM with typed `Mapped` columns.
- Alembic migrations for schema versioning.
- Initial seed data including an admin user and sample hardware.

### 8. Testing

Critical tests implemented:

- Cannot rent repaired hardware.
- Cannot rent in-use hardware.
- Cannot rent the same hardware twice.
- Returning hardware restores Available status.
- Cannot return other users' rentals.
- Cannot return already returned rentals.
- Cannot delete users with active rentals.
- Cannot delete the last admin.
- Cannot delete yourself.

### 9. Documentation

- Root README with live demo link and feature overview.
- Frontend README.
- Backend README.
- Architecture overview.
- This final project plan.
- AI suggestions plan.
- Feature walkthrough.
- Testing guide.
- Deployment guide.
- AI feature roadmap.

### 10. Dataset Audit

Before importing the initial seed data, I reviewed the dataset and found several quality issues. The import process now validates and normalizes records so invalid data cannot enter the system.

Detected issues:

#### Duplicate IDs

- Duplicate ID = 4

#### Misspelled Brand

- `Appel` → corrected to `Apple`

#### Invalid Date Format

- `22-05-2023` → normalized to `2023-05-22`

#### Future Purchase Date

- `2027-10-10` — rejected as invalid.

#### Missing Purchase Date

- `purchaseDate = null` — rejected.

#### Empty Brand

- `brand = ""` — rejected.

#### Unknown Status

- `status = Unknown` — not supported by business rules, mapped to a valid status during import.

#### Historical Notes

Several devices contain notes or history. This could be a future improvement area, such as using AI to summarize hardware history.

## Nice-to-Have Items Implemented

- Responsive layout for mobile and desktop.
- Pagination on all list views.
- Loading states.
- Docker support for both frontend and backend.
- Railway deployment configuration.
- Rate limiting on public endpoints.
- Clean error messages on the frontend.

## Deferred Ideas

- Dark mode.
- Toast notifications.
- User profile page.
- Smart Assistant chat interface.
- Inventory Auditor.
- JWT authentication (kept session-based for MVP simplicity).
- Vector-based embeddings for search.

## Final Business Rules

### Authentication

- Only Admin can create users.
- Only registered users may access the system.
- Passwords are hashed with bcrypt and never returned by the API.

### Hardware

Every hardware item must have:

- Name
- Brand
- Purchase Date
- Status

Allowed statuses:

- Available
- In Use
- Repair

### Rental

A user can rent hardware only when:

- Status is Available.

A user cannot rent hardware when:

- Status is Repair.
- Status is In Use.
- Status is Unknown.

### Repair

Hardware marked as Repair:

- Cannot be rented.
- Remains visible in inventory.
- Can later be marked Available.
- Cannot be set to Repair while actively rented.

## Final Technical Stack

### Frontend

- React 19
- TypeScript
- Vite 8
- Tailwind CSS 4
- React Router 7
- Axios

### Backend

- FastAPI
- SQLAlchemy 2
- Pydantic 2
- Alembic
- Slowapi (rate limiting)

### Database

- SQLite (file-based)

### AI

- OpenRouter API using the OpenAI SDK
- Model: `google/gemini-2.5-flash-lite`
- Keyword fallback when AI is unavailable

### Testing

- pytest with in-memory SQLite fixtures

### Deployment

- Railway (full-stack)
- Docker for local and production builds

## Final Project Structure

```text
hardware-hub/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ...
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PLAN.md
│   ├── PLAN_AI_SUGGESTIONS.md
│   ├── FEATURES.md
│   ├── AI_FEATURES_PLAN.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
├── docker-compose.yml
├── railway.json
├── frontend/railway.json
└── README.md
```

## How This Plan Differs from the AI Suggestions

| Area             | AI Suggestion        | Final Decision                                          |
| ---------------- | -------------------- | ------------------------------------------------------- |
| Frontend table   | TanStack Table       | Plain HTML table with Tailwind CSS for simplicity       |
| Deployment       | Vercel for both      | Railway for full-stack deployment                       |
| AI feature scope | Semantic Search only | Semantic Search now, with Assistant and Auditor planned |
| Authentication   | JWT suggested        | Session-based tokens for MVP simplicity                 |
| Search approach  | LLM-based            | LLM-based with deterministic keyword fallback           |
| User deletion    | Optional             | Implemented with active-rental guard                    |

## Summary

The final plan keeps the core MVP lightweight and deployable while leaving clear extension points for future AI features. Every must-have requirement is implemented, tested, and documented.
