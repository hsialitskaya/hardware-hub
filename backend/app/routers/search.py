from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session as DBSession
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user, get_db
from app.schemas.search import (
    PaginatedSearchResponse,
    SearchRequest,
    SearchResult,
)
from app.services import ai_search_service

router = APIRouter(prefix="/search", tags=["search"], dependencies=[Depends(get_current_user)])
limiter = Limiter(key_func=get_remote_address)


@router.post("", response_model=PaginatedSearchResponse)
@limiter.limit("20/minute")
def search_hardware(
    request: Request,
    payload: SearchRequest,
    db: DBSession = Depends(get_db),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
):
    matches, used_ai = ai_search_service.semantic_search(db, payload.query)
    total = len(matches)
    start = (page - 1) * page_size
    end = start + page_size
    page_matches = matches[start:end]
    return PaginatedSearchResponse(
        results=[SearchResult(hardware=hw, reason=reason) for hw, reason in page_matches],
        used_ai=used_ai,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/cache-stats")
@limiter.limit("30/minute")
def search_cache_stats(request: Request) -> dict[str, int]:
    """Expose cache hit/miss statistics for monitoring."""
    return ai_search_service.get_cache_stats()
