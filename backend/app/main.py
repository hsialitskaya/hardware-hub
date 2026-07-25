from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, hardware, rentals, search, users

# Database schema is managed by Alembic migrations (see backend/alembic/).
# Run `alembic upgrade head` before starting the app for the first time.

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Hardware Hub API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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


@app.get("/test-limiter")
@limiter.limit("5/minute")
def test_limiter(request: Request) -> dict[str, str]:
    return {"status": "ok"}
