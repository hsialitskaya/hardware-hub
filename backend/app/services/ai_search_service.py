import json
import logging

from sqlalchemy.orm import Session as DBSession

from app.config import get_settings
from app.models.hardware import Hardware

logger = logging.getLogger(__name__)


KEYWORD_REASON = "Matched by keyword search"
AI_REASON = "Matched by AI search"


def _keyword_fallback(db: DBSession, query: str) -> list[tuple[Hardware, str]]:
    """Simple case-insensitive search used when the AI service is
    unavailable or no API key is configured, so the search feature keeps
    working end-to-end even if OpenAI is down (see ARCHITECTURE.md risks).
    """
    like = f"%{query}%"
    matches = (
        db.query(Hardware)
        .filter(
            (Hardware.name.ilike(like))
            | (Hardware.brand.ilike(like))
            | (Hardware.notes.ilike(like))
        )
        .all()
    )
    return [(hw, KEYWORD_REASON) for hw in matches]


def semantic_search(db: DBSession, query: str) -> tuple[list[tuple[Hardware, str]], bool]:
    """Returns (matching hardware with reasons, used_ai).

    MVP approach: send the whole (small) catalog to the LLM and ask it to
    return matching ids, instead of building an embeddings/vector-search
    pipeline (see ARCHITECTURE.md "AI Search Decision").
    """
    settings = get_settings()
    all_hardware = db.query(Hardware).all()

    if not settings.openai_api_key or not all_hardware:
        return _keyword_fallback(db, query), False

    try:
        from openai import OpenAI

        client = OpenAI(api_key=settings.openai_api_key)
        catalog = [
            {"id": hw.id, "name": hw.name, "brand": hw.brand, "notes": hw.notes}
            for hw in all_hardware
        ]
        prompt = (
            "You are matching a user request to available hardware.\n"
            f"User request: {query!r}\n"
            f"Catalog: {json.dumps(catalog)}\n"
            "Return ONLY a JSON array of matching hardware ids, e.g. [1, 4, 7]. "
            "Return an empty array if nothing matches."
        )
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        content = response.choices[0].message.content or "[]"
        matched_ids = set(json.loads(content))
        matched = [hw for hw in all_hardware if hw.id in matched_ids]
        return [(hw, AI_REASON) for hw in matched], True
    except Exception:
        logger.exception("AI semantic search failed, falling back to keyword search")
        return _keyword_fallback(db, query), False
