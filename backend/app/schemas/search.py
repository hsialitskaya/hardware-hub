from pydantic import BaseModel, Field

from app.schemas.hardware import HardwareOut

MAX_SEARCH_QUERY_LENGTH = 200


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_SEARCH_QUERY_LENGTH)


class SearchResult(BaseModel):
    hardware: HardwareOut
    reason: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    used_ai: bool


class PaginatedSearchResponse(BaseModel):
    results: list[SearchResult]
    used_ai: bool
    total: int
    page: int
    page_size: int
