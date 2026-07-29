# Deployment Guide

Instructions for deploying Hardware Hub to Railway and updating the live demo link.

## Prerequisites

- Git repository pushed to GitHub.
- Railway account connected to GitHub.
- OpenRouter API key for AI search (optional but recommended).

## Backend Deployment

1. In Railway, create a new project from the GitHub repo.
2. Add a service with root directory set to `backend/`.
3. Add a **Volume** mounted at `/app/data` for SQLite persistence.
4. Set environment variables:

```bash
DATABASE_URL=sqlite:///./data/hardware_hub.db
SECRET_KEY=<random-32-char-secret>
OPENROUTER_API_KEY=<your-key>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>
CORS_ORIGINS=https://your-frontend-url.up.railway.app
```

5. Deploy and copy the public backend URL.

## Frontend Deployment

1. Add a second service with root directory set to `frontend/`.
2. Set environment variable:

```bash
VITE_API_URL=https://your-backend-url.up.railway.app
```

3. Deploy and copy the public frontend URL.

## Updating the Demo Link

After a successful deploy, update the following files with the real URLs:

- [README.md](README.md) — live demo badge and section
- [frontend/package.json](frontend/package.json) — `homepage` field

## Security Checklist

- Change `SECRET_KEY` to a long random string.
- Change the default admin password.
- Restrict `CORS_ORIGINS` to the exact frontend URL.
- Do not commit `.env` files.
