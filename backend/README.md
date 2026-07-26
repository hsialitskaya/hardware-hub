# Hardware Hub Backend

A FastAPI-powered REST API for the Hardware Hub internal inventory system. It handles authentication, hardware management, rental workflows, user administration, and AI-powered search.

## Overview

The backend follows a layered architecture: API routers validate HTTP requests, services encapsulate business logic, and SQLAlchemy models interact with the database. This separation keeps the codebase testable, maintainable, and easy to extend.

## Key Features

### Authentication and Users

- Session-based authentication with Bearer tokens
- Secure password hashing using bcrypt
- Admin-only user creation
- Role-based access control for protected endpoints

### Hardware Management

- Create, read, update, and delete hardware records
- Track device status: Available, In Use, Repair
- Enforce business rules, such as preventing repair status for actively rented devices
- Validate unique serial numbers

### Rental Engine

- Rent available hardware with strict status validation
- Return rented hardware and restore Available status
- List active and historical rentals per user
- Prevent double rentals, unauthorized returns, and returns of already returned items

### AI Search

- Semantic search over the hardware catalog using natural language
- LLM integration via OpenRouter with deterministic keyword fallback
- In-memory response caching and rate limiting

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2 |
| Validation | Pydantic 2 |
| Migrations | Alembic |
| Database | SQLite (configurable to PostgreSQL) |
| AI Client | OpenAI SDK with OpenRouter |
| Rate Limiting | Slowapi |
| Testing | pytest |

## Project Structure

```text
backend/
├── alembic/            # Database migrations
├── app/
│   ├── config.py       # Application settings
│   ├── database.py     # SQLAlchemy engine and session
│   ├── dependencies.py # Auth and DB session dependencies
│   ├── exceptions.py   # Custom business exceptions
│   ├── main.py         # FastAPI application entry point
│   ├── models/         # Database models
│   ├── routers/        # API route handlers
│   ├── schemas/        # Pydantic request/response models
│   ├── security.py     # Password hashing utilities
│   ├── seed.py         # Initial admin and sample data
│   └── services/       # Business logic layer
├── tests/              # pytest test suite
├── .env.example        # Example environment variables
├── alembic.ini         # Alembic configuration
├── Dockerfile          # Production container image
└── requirements.txt    # Python dependencies
```

## Getting Started

### Prerequisites

- Python 3.12 or newer
- A running local environment or Docker

### Installation

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and adjust the values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./hardware_hub.db` | SQLAlchemy database URL |
| `SECRET_KEY` | `change-me-in-production` | Secret key for session signing |
| `OPENROUTER_API_KEY` | none | API key for AI search |
| `ADMIN_EMAIL` | `admin@booksy.com` | Initial admin email |
| `ADMIN_PASSWORD` | `ChangeMe123!` | Initial admin password |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |

### Database Setup

```bash
alembic upgrade head
python -m app.seed
```

### Run Development Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

Interactive documentation is automatically generated at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Run with Docker

```bash
docker build -t hardware-hub-backend .
docker run -p 8000:8000 --env-file .env hardware-hub-backend
```

## Testing

The test suite covers the most critical business rules for the rental engine. Tests use an in-memory SQLite database and pytest fixtures for fast, isolated execution.

### Run Tests

```bash
pytest
```

### Run with Coverage

```bash
pytest --cov=app --cov-report=term-missing
```

### Critical Test Scenarios

| Test | File | Description |
|------|------|-------------|
| Cannot rent repaired hardware | `tests/test_rental_rules.py` | Devices marked Repair cannot be rented |
| Cannot rent in-use hardware | `tests/test_rental_rules.py` | Devices already rented cannot be rented again |
| Cannot rent same hardware twice | `tests/test_rental_rules.py` | Sequential rental attempts on the same device fail |
| Returning restores available status | `tests/test_rental_rules.py` | A returned device becomes Available again |
| Cannot return other user's rental | `tests/test_rental_rules.py` | Users may only return their own rentals |
| Cannot return already returned rental | `tests/test_rental_rules.py` | Double returns are rejected |

### Adding New Tests

Tests are organized in `backend/tests/`. Use the existing fixtures from `conftest.py` and follow the naming convention `test_<action>_<expected_behavior>`. Each test should remain independent and clean up after itself through the database transaction fixtures.

## Design Decisions

- **Services over fat routers**: business rules live in `app/services/`, not in API controllers, which makes the logic reusable and easy to unit test.
- **Pydantic schemas**: request and response shapes are explicit, enabling automatic OpenAPI documentation and frontend type generation.
- **Alembic migrations**: all schema changes are versioned, ensuring consistent deployments across environments.
- **Deterministic AI fallback**: if the LLM is unavailable or the API key is missing, semantic search falls back to keyword matching.
- **Rate limiting**: public endpoints use Slowapi to protect against abuse.

## API Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/auth/login` | Authenticate and receive session token | Public |
| GET | `/users` | List all users | Admin |
| POST | `/users` | Create a new user | Admin |
| GET | `/hardware` | List hardware with filters | Authenticated |
| POST | `/hardware` | Add new hardware | Admin |
| PATCH | `/hardware/{id}` | Update hardware | Admin |
| DELETE | `/hardware/{id}` | Delete hardware | Admin |
| GET | `/rentals/me` | List my rentals | Authenticated |
| POST | `/rentals` | Rent hardware | Authenticated |
| POST | `/rentals/{id}/return` | Return rented hardware | Authenticated |
| POST | `/search` | AI semantic search | Authenticated |
| GET | `/health` | Health check | Public |

## Related Documentation

- [Frontend README](../frontend/README.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Project Plan](../PLAN.md)
- [Deployment Guide](../README.md#deployment)
