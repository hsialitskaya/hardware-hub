# Hardware Hub - Architecture

## Overview

The application follows a client-server architecture:

```
                Frontend (React)
                       |
                       ↓
                 Backend API
                 (FastAPI)
                       |
        ┌──────────────┴──────────────┐
        ↓                             ↓
 SQLite Database              AI Service
                               (OpenAI)
```

---

# System Components

## Frontend

### Technology

- React
- TypeScript
- Vite
- React Router
- TanStack Table

### Responsibilities

The frontend is responsible for:

- Displaying hardware inventory.
- Providing login interface.
- Managing user interactions.
- Displaying admin panel.
- Handling sorting and filtering.
- Communicating with backend API.

### Main Views

```
Login Page

User Panel (Hardware Rent, My Rentals)

Admin Panel (Hardware Management, User Management)
```

---

# Backend

## Technology

- FastAPI
- SQLAlchemy
- Pydantic

## Responsibilities

The backend handles:

- Authentication.
- User management.
- Hardware management.
- Rental business logic.
- Data validation.
- AI integration.

## Backend Structure

```
API Routes
      |
      ↓
Services
      |
      ↓
Database Models
      |
      ↓
SQLite Database
```

---

# Database

## Technology

SQLite

## Reason

SQLite was selected because:

- It is simple to configure.
- It does not require external services.
- It is suitable for an MVP.
- It is easy to deploy and review.

---

# Main Entities

## User

Stores information about system users.

Fields:

- id
- email
- password
- role

---

## Hardware

Stores company equipment information.

Fields:

- id
- name
- brand
- purchase_date
- status
- notes

Possible statuses:

- Available
- In Use
- Repair

---

## Rental

Stores rental history.

Fields:

- id
- hardware_id
- user_id
- rented_at
- returned_at

---

## MVP Decision

For the first version:

- Simple session handling will be used.

Future improvement:

- Replace with JWT authentication.

---

# Hardware Rental Flow

## Successful Rental

```
User selects hardware

↓

Backend checks status

↓

Status = Available

↓

Hardware status changes:

Available → In Use

↓

Hardware assigned to user
```

---

## Invalid Rental Cases

The system prevents:

```
Repair → Cannot rent

In Use → Cannot rent

Unknown → Cannot rent
```

---

# Return Flow

```
User returns hardware

↓

Backend validates ownership

↓

Status changes:

In Use → Available

↓

Assignment removed
```

---

# AI Integration

## Selected Feature

### Semantic Search

The system allows users to search equipment using natural language.

Example:

User input:

```
I need something to test a mobile application
```

AI returns:

```
iPhone 13 Pro Max

Samsung Galaxy S21

iPad Pro
```

---

## AI Flow

```
User Query

↓

Backend API

↓

OpenAI Model

↓

Find Relevant Hardware

↓

Return Results
```

---

# Project Structure

```
hardware-hub/

├── frontend/
│
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── hooks/
│
├── backend/
│
│   └── app/
│       ├── models/
│       ├── schemas/
│       ├── routers/
│       ├── services/
│       └── database.py
│
├── docs/
│   └── prompts.md
│
├── README.md
├── PLAN.md
└── ARCHITECTURE.md
```

---

# Architectural Decisions

## Why React + FastAPI?

Chosen because:

- Fast development speed.
- Clear frontend/backend separation.
- Good ecosystem.
- Easy AI integration.

---

## Why SQLite?

Chosen because:

- Perfect for MVP.
- Minimal setup.
- Portable database.
- Easy testing.

---

## Why Semantic Search?

Chosen because:

- Demonstrates practical AI usage.
- Improves employee experience.
- Matches Booksy AI-native expectations.

---

# Future Improvements

If more time was available:

- PostgreSQL migration.
- JWT authentication.
- Role-based permissions.
- Rental history tracking.
- Audit logs.
- Better AI assistant.
- CI/CD pipeline.
- Production monitoring.

---

# AI Development Log

---

# Architecture Planning

## Tools Used

- Claude Sonnet 5

---

## Purpose

During the initial planning phase, AI was used to validate the proposed architecture of the Hardware Hub application.

The goal was to receive feedback about:

- frontend and backend structure,
- database design,
- API organization,
- separation of responsibilities,
- possible technical risks,
- MVP trade-offs.

---

## Prompt Used

```
I need to build an AI-Native Hardware Hub application for a recruitment assignment.

Requirements:
- Frontend: React + TypeScript
- Backend: FastAPI
- Database: SQLite
- Need authentication
- Admin hardware management
- Hardware rental workflow
- AI semantic search using LLM

Please propose a simple MVP architecture.

Focus on:
- folder structure
- database models
- API design
- separation of responsibilities
- possible risks
```

---

# AI Suggestions

The AI proposed a layered architecture with clear separation of responsibilities:

```
Frontend (React)
        |
        ↓
Backend API (FastAPI)
        |
        ↓
Services Layer
        |
        ↓
Database Layer (SQLite)
        |
        ↓
AI Integration
```

The main recommendation was to avoid placing business logic directly inside API controllers and instead separate responsibilities into dedicated layers.

---

# Backend Architecture Feedback

AI suggested organizing the backend into:

```
backend/

app/

├── models/
├── schemas/
├── routers/
├── services/
├── database.py
└── main.py
```

Responsibilities:

## Routers

Responsible for:

- HTTP endpoints.
- Request validation.
- Returning responses.

---

## Services

Responsible for:

- Business logic.
- Rental rules.
- Hardware operations.
- AI integration.

Example:

The rental validation should not be handled directly inside an API endpoint.

Instead:

```
Router

↓

Rental Service

↓

Database
```

This keeps the application easier to test and maintain.

---

## Database Models

AI recommended three main entities.

---

# User Entity

Purpose:

Stores users who can access the system.

Fields:

```
id
email
password
role
created_at
```

---

# Hardware Entity

Purpose:

Stores company equipment.

Fields:

```
id
name
brand
purchase_date
status
notes
```

Supported statuses:

```
Available
In Use
Repair
```

---

# Rental Entity

Purpose:

Stores rental history.

Fields:

```
id
hardware_id
user_id
rented_at
returned_at
```

The rental table allows tracking both:

- active rentals,
- previous rental history.

---

# API Design Feedback

AI suggested separating API endpoints by responsibility.

Example:

```
POST   /auth/login

GET    /hardware

POST   /hardware

PATCH  /hardware/{id}

DELETE /hardware/{id}

POST   /rentals

POST   /rentals/{id}/return

POST   /search
```

This structure keeps the API predictable and easy to extend.

---

# AI Semantic Search Planning

For the AI-native feature, AI suggested two possible approaches.

---

## Option 1: LLM-Based Search

The application sends:

- user query,
- available hardware information

to the LLM.

Example:

User:

```
I need something to test Android applications
```

AI:

```
Samsung Galaxy S21
iPhone 13 Pro Max
iPad Pro
```

Advantages:

- Fast implementation.
- Suitable for a small inventory.
- No additional infrastructure required.

---

## Option 2: Embedding-Based Search

The system creates embeddings for hardware descriptions and compares them with the user's query.

Advantages:

- More scalable.
- Better for large inventories.
- More production-oriented.

---

# Final Architecture Decision

After reviewing AI suggestions, I decided to use a simplified architecture suitable for an MVP.

Final technology choices:

## Frontend

- React
- TypeScript
- Vite

## Backend

- FastAPI
- SQLAlchemy
- Pydantic

## Database

- SQLite

## AI

- LLM-powered semantic search

---

# Changes From AI Suggestions

AI recommendations were reviewed and adjusted based on:

- assignment time limitations,
- MVP requirements,
- implementation complexity,
- maintainability.

---

## Authentication Decision

AI suggested implementing a full JWT authentication system.

Decision:

For the MVP, authentication is intentionally simplified to focus development time on core business features.

Future improvement:

- JWT authentication
- Refresh tokens
- Role-based permissions

Reason:

The main focus of the assignment is:

- hardware management,
- rental workflow,
- AI integration.

Future improvement:

Implement:

- JWT authentication.
- Refresh tokens.
- Advanced permissions.

---

## AI Search Decision

AI suggested using embeddings and vector search.

Decision:

Start with a lightweight LLM-based semantic search.

Reason:

The provided dataset is small, so a simpler solution provides enough value while reducing unnecessary complexity.

Future improvement:

Implement:

- embeddings,
- vector database,
- scalable semantic retrieval.

---

# Risks Identified During Planning

During the architecture discussion, I identified possible technical risks and documented them.

## Data Quality Issues

Problems found in the provided dataset:

- duplicate IDs,
- incorrect brand names,
- invalid dates,
- missing values,
- unknown statuses.

Solution:

- validate imported data,
- normalize records,
- log corrections.

---

## AI Availability

Risk:

The external AI service may be unavailable.

Solution:

- handle API errors,
- provide fallback behavior,
- avoid making the whole application dependent on AI availability.

---

# AI Correction Example

During architecture planning, AI suggested implementing full JWT authentication and embedding-based semantic search.

I decided not to use these approaches for the first MVP because they increased implementation complexity.

Instead:

- I selected a simpler authentication flow.
- I selected a lightweight LLM-based search approach.

The decision was based on project scope, available time, and the need to deliver a stable working application.

---

# Reflection

AI was used as an engineering assistant during architecture planning.

The generated suggestions were not copied directly into the project.

Each recommendation was evaluated based on:

- project requirements,
- development time,
- code simplicity,
- future maintainability.

The final architecture represents a balance between delivering a working MVP and keeping the system ready for future improvements.
