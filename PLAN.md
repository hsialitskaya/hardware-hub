# Hardware Hub – Project Plan

> **Project:** AI-Native Hardware Hub
> **Goal:** Build an internal application for managing, renting, and maintaining company hardware while demonstrating an AI-first engineering workflow.

---

# Project Objectives

The project focuses on three main pillars:

1. Hardware & User Management
2. Rental Business Logic
3. AI-Native Feature

The priority is to deliver a stable MVP with clean architecture, good documentation, and transparent engineering decisions.

---

# Must Have Features

## 1. Authentication

- Login page
- Admin authentication
- Only Admin can create user accounts
- Only previously created users can log in
- Session persistence (MVP)

---

## 2. Hardware Management (Admin)

- Add new hardware
- Delete hardware
- Edit hardware information
- Change Repair status
- View complete inventory

---

## 3. User Management (Admin)

- Create user
- Delete user (optional if time allows)
- View users

---

## 4. Hardware Dashboard

Display a table containing:

- Name
- Brand
- Purchase Date
- Status

Additional functionality:

- Sorting
- Filtering
- Search

---

## 5. Rental Engine

Users should be able to:

- Rent hardware
- Return hardware

Business validation:

- Only Available devices can be rented
- Repair devices cannot be rented
- Unknown status cannot be rented
- Already rented devices cannot be rented
- Returning changes status back to Available

---

## 6. AI Feature

Chosen feature:

- Semantic Search

Example:

> "I need something to test Android applications."

Returns:

- Samsung Galaxy
- Pixel
- Android devices

---

## 7. Database

- SQLite
- Initial seed data
- SQLAlchemy ORM

---

## 8. Testing

Minimum three critical tests:

- Cannot rent repaired hardware
- Cannot rent unavailable hardware
- Returning hardware restores Available status

---

## 9. Documentation

- README
- Setup instructions
- Architecture overview
- AI Development Log
- Prompt history
- Trade-offs
- Future improvements

---

# Nice to Have

If time permits:

- Responsive layout
- Dark mode
- Pagination
- Better error messages
- Loading states
- Toast notifications
- Docker support
- Deployment
- User profile page

---

# Business Rules

## Authentication

- Only Admin can create users.
- Only registered users may access the system.

---

## Hardware

Every hardware item must have:

- Name
- Brand
- Purchase Date
- Status

Allowed statuses:

- Available
- In Use
- Repair

---

## Rental

A user can rent hardware only when:

- Status is Available.

A user cannot rent hardware when:

- Status is Repair
- Status is In Use
- Status is Unknown

---

## Repair

Hardware marked as Repair:

- cannot be rented
- remains visible in inventory
- can later be marked Available

---

## Dashboard

The dashboard should allow users to:

- browse equipment
- search equipment
- filter by status
- sort by any column

---

# AI Feature Plan

Chosen solution:

## Semantic Search

Users can search using natural language.

Examples:

- "I need a laptop."
- "Device for Android testing."
- "Apple hardware."
- "Wireless headphones."

The LLM converts the request into relevant hardware results.

---

# Dataset Audit

The initial dataset was reviewed before importing it into the database.
The data import process includes validation and normalization to prevent invalid records from entering the system.

AI helped identify potential data quality issues:

- duplicate IDs,
- incorrect brand names,
- inconsistent date formats,
- missing values.

Detected issues:

## Duplicate IDs

- Duplicate ID = 4

---

## Misspelled Brand

Appel

↓

Apple

---

## Invalid Date Format

22-05-2023

Expected:

2023-05-22

---

## Future Purchase Date

2027-10-10

Likely invalid.

---

## Missing Purchase Date

purchaseDate = null

---

## Empty Brand

brand = ""

---

## Unknown Status

status = Unknown

Not supported by business rules.

---

## Historical Notes

Several devices contain notes/history.

Potential future improvement:

Use AI to summarize hardware history.

---

# Technical Stack

## Frontend Technologies

- React  
  A JavaScript library for building user interfaces using reusable components.

- Vite  
  A fast tool for creating, running, and building frontend applications.

- TypeScript  
  A JavaScript extension that adds types and helps prevent errors in the code.

- React Router  
  A library used for navigation between pages in React applications.

- TanStack Table  
  A library for creating advanced and customizable tables with features like sorting, filtering, and pagi

---

## Backend Technologies

- FastAPI  
  A modern Python framework for building fast and simple web APIs.

- SQLAlchemy  
  A Python library for working with databases using objects instead of writing only SQL queries.

- Pydantic  
  A Python library used for data validation and managing data models with type checking.

---

## Database

- SQLite  
  A lightweight database stored in a single file, used for simple and fast data storage without requiring a separate database server.

---

## AI

OpenAI API

Semantic Search

---

## Testing

pytest

---

## Deployment

Frontend

- Vercel

Backend

- Vercel

---

# Planned Project Structure

```
hardware-hub/

├── backend/
│   ├── app/
│   ├── models/
│   ├── routers/
│   ├── services/
│   ├── database.py
│   └── main.py
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   └── services/
│
├── docs/
│   ├── prompts.md
│   └── architecture.png
│
├── README.md
└── PLAN.md
```

---

# Risks & Assumptions

Possible challenges:

- OpenAI integration
- Dataset inconsistencies
- Time limitation (4–5 hours)
- Authentication kept intentionally simple for MVP

---

# Future Improvements

If an additional 24 hours were available:

1. JWT authentication
2. User roles & permissions
3. Rental history
4. AI Inventory Auditor
5. Notifications
6. Better UI/UX
7. Full Docker setup
8. CI/CD pipeline
9. Logging & monitoring
10. Production deployment

---

# Open Questions

- Should Admin be able to rent hardware?
- Can one user rent multiple devices?
- Should duplicate IDs be automatically fixed?
- Should invalid records be imported or rejected?
- How should Unknown status be handled?
- Should purchase dates be validated during import?

---

# Notes During Development

## Decisions

- Keep MVP simple.
- Prioritize correctness over additional features.
- Document every shortcut.
- Commit frequently.
- Use AI as a development partner, not as an autopilot.

---

The goal is not to build the biggest application, but the best engineered MVP within the given time.
