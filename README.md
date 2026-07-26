# Hardware Hub

Internal inventory and rental management system built for the Booksy Early Careers recruitment task. The application helps employees manage company equipment, rent available gear, and leverage AI for semantic search.

- **Live demo:** https://hardware-hub-production-3c1d.up.railway.app
- **API docs:** https://hardware-hub-api.up.railway.app/docs
- **Demo credentials:** `admin@booksy.com` / `ChangeMe123!`

## What was built

### Management Engine

- **Admin Command Center** for managing hardware and user accounts.
- **Login System** where only users created by an Admin can access the Hub.
- **Smart Dashboard** showing Name, Brand, Purchase Date, and Status with sorting and filtering.

### Rental Engine

- **Rent and Return** flow with status transitions.
- **Business-rule guards** that prevent impossible states, such as renting a device that is already In Use or marked as Repair.

### AI-Native Layer

- **Semantic Search** that lets users find gear with natural language, e.g. _"I need something to test a mobile app on"_.
- Deterministic keyword fallback when the LLM is unavailable.

## Tech Stack

| Layer      | Technology                                          |
| ---------- | --------------------------------------------------- |
| Backend    | FastAPI, SQLAlchemy 2, Pydantic 2, Alembic          |
| Frontend   | React, TypeScript, Vite, Tailwind CSS, React Router |
| Database   | SQLite (file-based, portable)                       |
| AI         | OpenRouter-compatible LLM (Gemini Flash Lite)       |
| Deployment | Railway, Docker                                     |

## Repository Structure

```text
hardware-hub/
├── backend/           # FastAPI REST API
├── frontend/          # React + TypeScript UI
├── docs/              # Project documentation
│   ├── ARCHITECTURE.md
│   ├── PLAN.md
│   ├── FEATURES.md
│   ├── AI_FEATURES_PLAN.md
│   ├── TESTING.md
│   └── DEPLOYMENT.md
├── alembic/           # Database migrations
├── README.md
└── railway.json
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and connects to `http://localhost:8000`.

## Testing

```bash
cd backend
pytest
```

The suite includes critical rental business-rule tests plus user-management guards. See [docs/TESTING.md](docs/TESTING.md) for a full list and coverage instructions.

## Documentation

| File                                                 | What it covers                                                                |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)         | System architecture, technology choices, data models, and design decisions.   |
| [docs/PLAN.md](docs/PLAN.md)                         | Original project plan, must-have features, business rules, and MVP decisions. |
| [docs/FEATURES.md](docs/FEATURES.md)                 | Detailed walkthrough of implemented features mapped to the recruitment scope. |
| [docs/AI_FEATURES_PLAN.md](docs/AI_FEATURES_PLAN.md) | Roadmap for Smart Assistant and Inventory Auditor features.                   |
| [docs/TESTING.md](docs/TESTING.md)                   | Test suite overview, critical tests, and instructions for running pytest.     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)             | Step-by-step Railway deployment guide and security checklist.                 |
| [frontend/README.md](frontend/README.md)             | Frontend stack, structure, scripts, and design decisions.                     |
| [backend/README.md](backend/README.md)               | Backend stack, API endpoints, setup, and configuration.                       |

## License

MIT
