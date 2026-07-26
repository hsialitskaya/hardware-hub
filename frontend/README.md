# Hardware Hub Frontend

A clean, responsive web interface for the Hardware Hub internal inventory system. Built with modern React, TypeScript, and Vite, it provides an intuitive experience for both regular users and administrators.

## Overview

This frontend application communicates with the Hardware Hub FastAPI backend to deliver a complete hardware rental and management experience. It supports authentication, inventory browsing, rental workflows, admin operations, and AI-powered search.

## Key Features

### For All Users

- Secure login with session-based authentication
- Browse available hardware with sorting, filtering, and pagination
- Rent available devices in a single action
- View personal rental history and return active rentals
- AI semantic search for discovering equipment using natural language

### For Administrators

- Manage hardware inventory: add, edit, delete, and change repair status
- Manage user accounts: create users and view the user directory
- Full visibility into inventory status across all devices

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 |
| Language | TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 4 |
| Routing | React Router 7 |
| HTTP Client | Axios |
| Linting | Oxlint |

## Project Structure

```text
frontend/src/
├── api/              # Backend API clients
├── components/       # Reusable UI components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── pages/            # Route-level page components
├── types/            # Shared TypeScript types
└── utils/            # Helper functions and validators
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- Running Hardware Hub backend on port 8000

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The application will start at `http://localhost:5173` and proxy API requests to `http://localhost:8000` by default.

### Build for Production

```bash
npm run build
```

To point the build at a different backend API, set the `VITE_API_URL` environment variable:

```bash
VITE_API_URL=https://hardware-hub-api.example.com npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the Hardware Hub backend API |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Compile TypeScript and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run Oxlint across the source code |

## Design Decisions

- **TypeScript first**: every component, hook, and API call is fully typed for reliability and maintainability.
- **Tailwind CSS**: utility-first styling keeps the UI consistent and easy to extend without writing custom CSS.
- **Axios interceptor**: authentication tokens are attached automatically, and 401 responses redirect users to the login page.
- **Route guards**: `ProtectedRoute` and `AdminRoute` components enforce role-based access control declaratively.
- **Responsive layout**: the navigation and tables adapt to mobile, tablet, and desktop screens.

## Related Documentation

- [Backend README](../backend/README.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [Project Plan](../PLAN.md)
- [Deployment Guide](../README.md#deployment)
