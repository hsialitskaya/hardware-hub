# Hardware Hub - Architecture

## Overview

The application follows a client-server architecture:

```
Frontend (React)
        |
        ↓
Backend API (FastAPI)
        |
        ↓
Database (SQLite)
        |
        ↓
AI Service (OpenAI)
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

Dashboard

Admin Panel

Hardware Management

User Management

AI Search
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
