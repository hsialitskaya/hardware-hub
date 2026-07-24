from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, hardware, rentals, search, users

# Database schema is managed by Alembic migrations (see backend/alembic/).
# Run `alembic upgrade head` before starting the app for the first time.

app = FastAPI(title="Hardware Hub API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(hardware.router)
app.include_router(rentals.router)
app.include_router(search.router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
