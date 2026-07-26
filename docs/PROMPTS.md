# Prompt Trail

This file contains the most important prompts that shaped the Hardware Hub project. The wording is reconstructed from the actual conversation flow; some prompts were typed in Polish, some in English, and some started as short ideas that were expanded in follow-ups. Context notes in parentheses explain why each prompt mattered.

---

## 1. Project Kick-off

> "Create a plan for a company hardware rental management app. This is a recruitment task. It needs an admin, users, hardware rental, and one AI feature."

(Original prompt was in Polish. Established the MVP scope and led to the three-pillar structure: Management Engine, Rental Engine, AI-Native Layer.)

Follow-up:

> "Write it in a separate PLAN.md file."

(Original prompt was in Polish. Forced the plan into a readable document instead of keeping it scattered in chat.)

---

## 2. Architecture

> "Help me design a FastAPI + SQLAlchemy backend. I want routers, services, and models as separate layers."

(English. Established the layered backend architecture used in `backend/app/`.)

Follow-up:

> "Keep services stateless and don't over-engineer with repository classes."

(English. Pushed the design toward simplicity and away from unnecessary abstraction.)

---

## 3. Authentication Decision

> "Should I use JWT or simple session tokens for this MVP?"

(English. AI suggested JWT; I chose session tokens to save time.)

Follow-up:

> "Explain why JWT is overkill for an MVP in the trade-offs documentation."

(Original prompt was in Polish. Led to the explicit JWT trade-off section in `docs/TRADE_OFFS.md`.)

---

## 4. Admin UX & Domain Validation

> "After logging in as an admin, redirect to hardware instead of rentals."

(English. Changed post-login redirect so admins land on Hardware Management instead of the user dashboard.)

---

## 5. Rental Business Rules

> "I need tests for rental rules: cannot rent repaired hardware, cannot rent in-use hardware, cannot return someone else's rental, etc."

(English. Started the pytest suite that became `backend/tests/test_rental_rules.py`.)

Follow-up:

> "Add a test that the same device cannot be rented twice."

(English. Closed an edge case discovered while writing tests.)

---

## 6. AI Semantic Search

> "I want natural-language hardware search using an LLM. How do I do it safely?"

(English. Started the AI search design discussion.)

Follow-up:

> "The model must return only JSON IDs, never free text. Add input sanitization and a keyword fallback."

(English. Constrained the design to the safe ID-matching approach documented in `docs/AI_IMPLEMENTATION.md`.)

Follow-up:

> "How do I protect AI search from attacks where someone sends an invalid or malicious prompt?"

(English. Hardened AI search with input length/character validation, prompt injection resistance, and strict response parsing that only accepts known hardware IDs.)

Follow-up:

> "Don't show the table when AI returns nothing."

(English. Changed dashboard behavior so the hardware table is hidden and a reset button is shown when AI returns no matches.)

---

## 7. Frontend API Client

> "The Vite frontend doesn't see VITE_API_URL in Docker. How do I fix it?"

(Original prompt was in Polish. Debugged the production frontend calling localhost.)

Follow-up:

> "Show me the exact Dockerfile change and the Railway env setup."

(English. Resulted in adding `ARG VITE_API_URL` / `ENV VITE_API_URL=$VITE_API_URL` to `frontend/Dockerfile`.)

---

## 8. Railway Deployment

> "Deploy FastAPI + React to Railway using Docker. My healthcheck is failing."

(English. AI suggested port 8000; Railway uses dynamic `$PORT`.)

Follow-up:

> "Fix it so the backend binds to `$PORT` and still works locally on 8000."

(English. Resulted in `backend/app/main.py` reading `$PORT` with fallback to 8000.)

---

## 8.5. Pagination & Rate Limiting

> "Add pagination everywhere possible."

(English. Original prompt was in Polish. Added paginated responses to hardware, users, rentals, and AI search endpoints, plus a shared `Pagination` component on the frontend.)

Follow-up:

> "Add rate limiting."

(English. Added per-route rate limits using `slowapi` with IP-based keys for auth, hardware, rentals, users, and search endpoints.)

---

## 9. User Deletion Guard

> "An admin cannot delete a user who has active rentals. Add this with tests."

(English. Added the active-rental guard and pytest coverage in `backend/tests/test_users.py`.)

Follow-up:

> "Make sure deleting a user also removes their returned rental history, but not active rentals."

(English. Clarified the cascade behavior in `backend/app/services/user_service.py`.)

---

## 10. Hardware Management Rules

> "Handle the error when I add or update a device with the same serial number."

(English. Original prompt was in Polish. Added case-insensitive duplicate serial number validation on hardware create and update, returning HTTP 409.)

Follow-up:

> "The logic is wrong: when a device is in_use, the admin can still mark it as repair, but for the user it stays in_use. Better to prevent the admin from repairing it."

(English. Blocked admins from setting `in_use` hardware to `repair`; the device must be returned first.)

---

## 12. Documentation Restructure

> "Split the README into smaller files in a docs folder. It has too much content."

(Original prompt was in Polish. Led to creating `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/FEATURES.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, etc.)

Follow-up:

## Notes

- Polish prompts were common for quick ideas and fixes; English prompts were used for architecture and documentation that had to stay in the repo. This trail translates Polish prompts to English for consistency.
- Many prompts were iterative: an initial high-level request followed by one or two follow-ups that constrained scope or corrected direction.
- The most useful follow-ups added concrete constraints: "only JSON IDs", "bind to `$PORT`", "do not reveal secrets in the prompt", "company domain only", "no table when AI returns nothing".
