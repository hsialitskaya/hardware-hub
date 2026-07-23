from pydantic import BaseModel

from app.schemas.hardware import HardwareOut


class SearchRequest(BaseModel):
    query: str


class SearchResult(BaseModel):
    hardware: HardwareOut
    reason: str | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    used_ai: bool
