# Prompt Trail

This file contains the most important prompts that shaped the Hardware Hub project. The wording is reconstructed from the actual conversation flow; some prompts were typed in Polish, some in English, and some started as short ideas that were expanded in follow-ups. Context notes in parentheses explain why each prompt mattered.

---

## 1. Project Kick-off

> "Zrób mi plan na aplikację do zarządzania wypożyczeniem sprzętu firmy. To zadanie rekrutacyjne. Ma mieć admina, użytkowników, wypożyczanie sprzętu i jeden feature AI."

(Polish, first planning prompt. Established the MVP scope and led to the three-pillar structure: Management Engine, Rental Engine, AI-Native Layer.)

Follow-up:

> "Napisz to w osobnym pliku PLAN.md po angielsku."

(Polish. Forced the plan into a readable document instead of keeping it scattered in chat.)

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

> "Napisz dlaczego JWT to overkill na MVP w dokumentacji trade-offs."

(Polish. Led to the explicit JWT trade-off section in `docs/TRADE_OFFS.md`.)

---

## 5. Rental Business Rules

> "I need tests for rental rules: cannot rent repaired hardware, cannot rent in-use hardware, cannot return someone else's rental, etc."

(English. Started the pytest suite that became `backend/tests/test_rental_rules.py`.)

Follow-up:

> "Add a test that the same device cannot be rented twice."

(English. Closed an edge case discovered while writing tests.)

---

## 6. AI Semantic Search

> "Chcę wyszukiwanie naturalne po sprzęcie przez LLM. Jak to zrobić bezpiecznie?"

(Polish. Started the AI search design discussion.)

Follow-up:

> "The model must return only JSON IDs, never free text. Add input sanitization and a keyword fallback."

(English. Constrained the design to the safe ID-matching approach documented in `docs/AI_IMPLEMENTATION.md`.)

Follow-up:

> "Write a separate doc explaining the prompt, validation, and why we do not send secrets to the LLM."

(English. Led to `docs/AI_IMPLEMENTATION.md`.)

---

## 7. Frontend API Client

> "Frontend na Vite nie widzi zmiennej VITE_API_URL w Dockerze. Jak to poprawić?"

(Polish. Debugged the production frontend calling localhost.)

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

## 9. User Deletion Guard

> "Admin nie może usunąć użytkownika, który ma aktywne wypożyczenia. Dodaj to z testami."

(Polish. Added the active-rental guard and pytest coverage in `backend/tests/test_users.py`.)

Follow-up:

> "Make sure deleting a user also removes their returned rental history, but not active rentals."

(English. Clarified the cascade behavior in `backend/app/services/user_service.py`.)

## 10. Documentation Restructure

> "Rozbij README na mniejsze pliki w folderze docs. Mam za dużo treści."

(Polish. Led to creating `docs/ARCHITECTURE.md`, `docs/PLAN.md`, `docs/FEATURES.md`, `docs/TESTING.md`, `docs/DEPLOYMENT.md`, etc.)

Follow-up:

> "Add a file that maps every recruitment requirement to implementation artifacts."

(English. Led to `docs/RECRUITMENT_REQUIREMENTS.md`.)

## Notes

- Polish prompts were common for quick ideas and fixes; English prompts were used for architecture and documentation that had to stay in the repo.
- Many prompts were iterative: an initial high-level request followed by one or two follow-ups that constrained scope or corrected direction.
- The most useful follow-ups were the ones that added constraints: "only JSON IDs", "bind to `$PORT`", "do not reveal secrets in the prompt".
