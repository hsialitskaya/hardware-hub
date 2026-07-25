from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_current_user, get_db
from app.schemas.search import SearchRequest, SearchResponse, SearchResult
from app.services import ai_search_service

router = APIRouter(prefix="/search", tags=["search"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=SearchResponse)
def search_hardware(payload: SearchRequest, db: DBSession = Depends(get_db)):
    matches, used_ai = ai_search_service.semantic_search(db, payload.query)
    return SearchResponse(
        results=[SearchResult(hardware=hw, reason=reason) for hw, reason in matches],
        used_ai=used_ai,
    )
