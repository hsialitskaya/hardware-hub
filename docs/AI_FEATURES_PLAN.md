# Smart Assistant and Inventory Auditor — Implementation Plan

> This document describes how to implement two new AI features in the **Hardware Hub** project without breaking the existing architecture. The backend remains FastAPI + SQLAlchemy, and the frontend remains React + TypeScript + Vite.

---

## 1. Smart Assistant — Chat Interface

### 1.1 What it does

Smart Assistant is a chat panel where users ask natural-language questions and the system answers based on the current database state. Example questions:

- "I need something to test Android apps. What is available?"
- "Summarize rental history for MacBook Pro M3."
- "Which devices are currently in repair?"
- "Who rented the iPhone 15 last?"
- "Show me my active rentals."
- "When was the Dell monitor purchased and what is its serial number?"

The answer can be plain text, a list of devices, or a history summary. The assistant never performs destructive actions (no renting, returning, or deleting) — it is a read-only data interface with optional action suggestions.

### 1.2 Architecture

```text
User (chat panel)
       ↓
Frontend: POST /assistant/chat { message, history? }
       ↓
Backend: assistant_router → assistant_service
       ↓
SQLAlchemy (read hardware + rentals + users)
       ↓
LLM (OpenRouter / OpenAI-compatible)
       ↓
Frontend: render markdown / cards
```

### 1.3 Backend — New Files

#### `backend/app/schemas/assistant.py`

```python
from pydantic import BaseModel, Field


class AssistantMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str


class AssistantRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=20)


class AssistantResponse(BaseModel):
    reply: str
    used_ai: bool
```

#### `backend/app/services/assistant_service.py`

The service loads the required data from the database, builds a safe prompt, and calls the LLM. Main principles:

- Always read the current database state — do not rely on the LLM as the source of truth.
- Limit the number of records in the context (e.g., max 200 devices, 500 recent rentals).
- If `openrouter_api_key` is not configured, return a deterministic SQL-based answer.
- Do not allow the LLM to generate SQL, system commands, or role changes.

Example structure:

```python
def ask_assistant(
    db: DBSession, user: User, message: str, history: list[dict]
) -> tuple[str, bool]:
    settings = get_settings()
    context = build_context(db, user)

    if not settings.openrouter_api_key:
        return (rule_based_reply(context, message), False)

    try:
        reply = call_llm(context, message, history, settings)
        return (reply, True)
    except Exception:
        logger.exception("Assistant LLM call failed")
        return (rule_based_reply(context, message), False)


def build_context(db: DBSession, user: User) -> dict:
    """Load small, structured snapshots of inventory and history."""
    hardware = db.query(Hardware).limit(200).all()
    active_rentals = (
        db.query(Rental)
        .filter(Rental.returned_at.is_(None))
        .order_by(Rental.rented_at.desc())
        .limit(200)
        .all()
    )
    my_active_rentals = [r for r in active_rentals if r.user_id == user.id]
    return {
        "current_user": {"id": user.id, "email": user.email, "role": user.role.value},
        "hardware_count": db.query(Hardware).count(),
        "available_count": db.query(Hardware)
        .filter(Hardware.status == HardwareStatus.AVAILABLE)
        .count(),
        "in_repair_count": db.query(Hardware)
        .filter(Hardware.status == HardwareStatus.REPAIR)
        .count(),
        "in_use_count": db.query(Hardware)
        .filter(Hardware.status == HardwareStatus.IN_USE)
        .count(),
        "my_active_rentals": format_rentals(my_active_rentals),
        "recent_rentals": format_rentals(active_rentals[:20]),
        "hardware_sample": format_hardware(hardware[:50]),
    }
```

Example system prompt:

```text
You are a helpful assistant for an internal hardware inventory app called Hardware Hub.
You answer questions about company equipment and rental history using ONLY the provided database context.
Do not invent devices, users, or dates. Do not execute commands or write code.
Keep answers concise (max 3-4 sentences unless the user asks for a list).
If the context is insufficient, say you need more information.

Current user: {email} (role: {role})
Inventory snapshot: {context_json}

User question: {message}
```

#### `backend/app/routers/assistant.py`

```python
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_current_user, get_db
from app.schemas.assistant import AssistantRequest, AssistantResponse
from app.services import assistant_service

router = APIRouter(prefix="/assistant", tags=["assistant"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/chat", response_model=AssistantResponse)
@limiter.limit("30/minute")
def chat(
    request: Request,
    payload: AssistantRequest,
    db: DBSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    history = [m.model_dump() for m in payload.history]
    reply, used_ai = assistant_service.ask_assistant(
        db, user, payload.message, history
    )
    return AssistantResponse(reply=reply, used_ai=used_ai)
```

Register the router in `backend/app/main.py`:

```python
from app.routers import assistant

app.include_router(assistant.router)
```

### 1.4 Frontend — New Files

#### `frontend/src/api/assistant.ts`

```typescript
import { client } from "./client";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantRequest {
  message: string;
  history: AssistantMessage[];
}

export interface AssistantResponse {
  reply: string;
  used_ai: boolean;
}

export async function sendAssistantMessage(
  payload: AssistantRequest,
): Promise<AssistantResponse> {
  const { data } = await client.post<AssistantResponse>(
    "/assistant/chat",
    payload,
  );
  return data;
}
```

#### `frontend/src/components/AssistantPanel.tsx`

A side panel or modal containing:

- a text input for the question,
- local conversation history state,
- a send button,
- a "powered by AI" / "offline mode" indicator based on `used_ai`.

You can embed it on `DashboardPage` or add a floating action button (FAB) that opens the panel.

#### `frontend/src/pages/AssistantPage.tsx` (optional)

A separate `/assistant` page for a more elaborate chat. Add the route inside `<ProtectedRoute>` in `App.tsx`.

### 1.5 Security

- Validate message length (`max_length=500`).
- Restrict allowed characters — same as in `ai_search_service.py` (`ALLOWED_CHARS_RE`).
- The system prompt must forbid jailbreaks and system instructions.
- Do not send passwords, hashes, or session tokens to the LLM.
- Rate limit `30/minute` per IP.
- Log only queries, never full LLM responses containing sensitive data.

### 1.6 Non-AI Fallback

When the API key is missing or the service is unavailable, the system answers deterministically:

- for questions about available devices — SQL query `status == available`,
- for user / device history — SQL query on the `rentals` table,
- for simple aggregations — count queries.

This ensures the chat panel works even without AI configuration.

---

## 2. Inventory Auditor — AI-Driven Inventory Check

### 2.1 What it does

Inventory Auditor analyzes the entire inventory and rental history, then reports potential issues. An admin can trigger the audit with one button. Examples of detected issues:

| Category                | Description                                                        | Example                                                                     |
| ----------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `LONG_REPAIR`           | Device in repair for more than 14 days.                            | "iPhone 12 — in repair for 30 days."                                        |
| `OVERDUE_RENTAL`        | Rental has been active for more than 60 days.                      | "MacBook Pro — rented 75 days ago."                                         |
| `MISSING_SERIAL`        | Serial number is missing.                                          | "Dell XPS 13 — serial_number field is empty."                               |
| `MISSING_PURCHASE_DATE` | Purchase date is missing.                                          | "LG monitor — purchase_date is missing."                                    |
| `OLD_AVAILABLE`         | Device is available but last used more than 180 days ago or never. | "iPad Air — available, last rental 200 days ago."                           |
| `HEAVY_USER`            | User has more than 3 active rentals.                               | "anna@example.com — 5 active rentals."                                      |
| `AI_SUGGESTED`          | Issue suggested by the LLM based on context.                       | "Note says 'battery dead' but status is available — may need verification." |

### 2.2 Architecture

```text
Admin clicks "Run audit"
       ↓
Frontend: POST /auditor/run
       ↓
Backend: auditor_router → auditor_service
       ├─ deterministic rules (SQL)
       └─ LLM reasoning (optional)
       ↓
Response: list of flags with severity, entity, message, recommendation
       ↓
Frontend: table with filters by severity/category
```

### 2.3 Backend — New Files

#### `backend/app/schemas/auditor.py`

```python
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class FlagSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class FlagCategory(str, Enum):
    LONG_REPAIR = "long_repair"
    OVERDUE_RENTAL = "overdue_rental"
    MISSING_SERIAL = "missing_serial"
    MISSING_PURCHASE_DATE = "missing_purchase_date"
    OLD_AVAILABLE = "old_available"
    HEAVY_USER = "heavy_user"
    AI_SUGGESTED = "ai_suggested"


class InventoryFlag(BaseModel):
    category: FlagCategory
    severity: FlagSeverity
    entity_type: str  # "hardware" | "rental" | "user"
    entity_id: int
    title: str
    message: str
    recommendation: str
    detected_at: datetime


class AuditorResponse(BaseModel):
    flags: list[InventoryFlag]
    used_ai: bool
    generated_at: datetime
```

#### `backend/app/services/auditor_service.py`

The service has two layers:

1. **Deterministic rules** — always run, regardless of AI availability.
2. **AI layer** — optional, runs only when an API key is configured and the database is not too large.

```python
THRESHOLDS = {
    "repair_days": 14,
    "rental_overdue_days": 60,
    "old_available_days": 180,
    "heavy_user_active_rentals": 3,
}


def run_audit(db: DBSession) -> tuple[list[InventoryFlag], bool]:
    flags = []
    flags.extend(_check_long_repairs(db))
    flags.extend(_check_overdue_rentals(db))
    flags.extend(_check_missing_serials(db))
    flags.extend(_check_missing_purchase_dates(db))
    flags.extend(_check_old_available(db))
    flags.extend(_check_heavy_users(db))

    used_ai = False
    if settings.openrouter_api_key:
        try:
            ai_flags = _run_ai_audit(db, flags)
            flags.extend(ai_flags)
            used_ai = True
        except Exception:
            logger.exception("AI audit failed, returning deterministic flags only")

    return flags, used_ai


def _check_long_repairs(db: DBSession) -> list[InventoryFlag]:
    """Devices in repair longer than threshold."""
    # Requires storing repair_start_date or inferring from rental/notes.
    # MVP: if notes contain a date, parse it; otherwise skip or use AI.
    return []
```

Note: the `repair` status has no start date in the current model. For the MVP you can either:

- add a `repair_started_at` column to the `hardware` table,
- parse the date from the `notes` field (e.g., "Sent to repair on 2025-12-01"),
- or mark `LONG_REPAIR` as AI-suggested where the LLM evaluates notes.

Recommended approach: add `repair_started_at: Mapped[datetime | None]` to the `Hardware` model and update it in `update_hardware` when the status changes to `REPAIR`.

#### Example Deterministic Rule

```python
def _check_overdue_rentals(db: DBSession) -> list[InventoryFlag]:
    flags = []
    threshold = datetime.now(timezone.utc) - timedelta(
        days=THRESHOLDS["rental_overdue_days"]
    )
    rentals = (
        db.query(Rental)
        .filter(Rental.returned_at.is_(None), Rental.rented_at < threshold)
        .options(joinedload(Rental.hardware), joinedload(Rental.user))
        .all()
    )
    for rental in rentals:
        days = (datetime.now(timezone.utc) - rental.rented_at).days
        flags.append(
            InventoryFlag(
                category=FlagCategory.OVERDUE_RENTAL,
                severity=FlagSeverity.HIGH,
                entity_type="rental",
                entity_id=rental.id,
                title="Overdue rental",
                message=f"{rental.hardware.name} rented by {rental.user.email} {days} days ago.",
                recommendation="Contact the user and verify if the device is still needed.",
                detected_at=datetime.now(timezone.utc),
            )
        )
    return flags
```

#### AI Layer

```python
def _run_ai_audit(
    db: DBSession, existing_flags: list[InventoryFlag]
) -> list[InventoryFlag]:
    hardware = db.query(Hardware).limit(200).all()
    context = format_hardware_for_audit(hardware)
    prompt = (
        "You are an inventory auditor. Review the hardware list and existing flags.\n"
        "Return ONLY a JSON array of additional issues. Each item must have:\n"
        "category (string), severity (low|medium|high), entity_type (hardware|rental|user),\n"
        "entity_id (int), title, message, recommendation.\n"
        "Do not repeat existing flags. Existing flags: {existing}\n"
        "Hardware: {context}\n"
    )
    # call LLM, parse JSON, validate against schema
    return parsed_flags
```

#### `backend/app/routers/auditor.py`

```python
from fastapi import APIRouter, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.dependencies import get_db, require_admin
from app.schemas.auditor import AuditorResponse
from app.services import auditor_service

router = APIRouter(prefix="/auditor", tags=["auditor"])
limiter = Limiter(key_func=get_remote_address)


@router.post("/run", response_model=AuditorResponse)
@limiter.limit("10/minute")
def run_audit(
    request: Request,
    db: DBSession = Depends(get_db),
    _: User = Depends(require_admin),
):
    flags, used_ai = auditor_service.run_audit(db)
    return AuditorResponse(
        flags=flags,
        used_ai=used_ai,
        generated_at=datetime.now(timezone.utc),
    )
```

Register in `main.py`:

```python
from app.routers import auditor

app.include_router(auditor.router)
```

### 2.4 Frontend — New Files

#### `frontend/src/api/auditor.ts`

```typescript
import { client } from "./client";

export type FlagSeverity = "low" | "medium" | "high";
export type FlagCategory =
  | "long_repair"
  | "overdue_rental"
  | "missing_serial"
  | "missing_purchase_date"
  | "old_available"
  | "heavy_user"
  | "ai_suggested";

export interface InventoryFlag {
  category: FlagCategory;
  severity: FlagSeverity;
  entity_type: "hardware" | "rental" | "user";
  entity_id: number;
  title: string;
  message: string;
  recommendation: string;
  detected_at: string;
}

export interface AuditorResponse {
  flags: InventoryFlag[];
  used_ai: boolean;
  generated_at: string;
}

export async function runAudit(): Promise<AuditorResponse> {
  const { data } = await client.post<AuditorResponse>("/auditor/run");
  return data;
}
```

#### `frontend/src/pages/InventoryAuditorPage.tsx`

An admin-only page (`AdminRoute`) containing:

- a "Run Audit" button,
- counters for flags by category and severity,
- a table with columns: severity, category, title, message, recommendation,
- filters: severity, category,
- links to device / user details.

Add a link in `Layout.tsx` in the admin section:

```tsx
<NavLink to="/admin/auditor" className={navClass}>
  Auditor
</NavLink>
```

and a route in `App.tsx`:

```tsx
<Route
  path="/admin/auditor"
  element={
    <AdminRoute>
      <InventoryAuditorPage />
    </AdminRoute>
  }
/>
```

### 2.5 Caching Results

Audits can be expensive (LLM + many SQL queries). Add a simple in-memory cache:

```python
_audit_cache: dict[str, tuple[AuditorResponse, datetime]] = {}


def get_cached_audit(cache_key: str, ttl_seconds: int = 300) -> AuditorResponse | None:
    if cache_key in _audit_cache:
        response, generated_at = _audit_cache[cache_key]
        if datetime.now(timezone.utc) - generated_at < timedelta(seconds=ttl_seconds):
            return response
    return None
```

The `POST /auditor/run` endpoint can check the cache first and generate a new audit only after it expires.

---

## 3. Common Recommendations

### 3.1 Backend Dependencies

Both features use the already-installed `openai` package. No new packages are needed unless you choose to add:

- `markdown` — for sanitizing LLM output (optional),
- `python-dateutil` — for parsing dates from notes (optional).

### 3.2 Configuration

The existing `openrouter_api_key` setting in `backend/app/config.py` is sufficient. For the auditor, you may add optional thresholds:

```python
audit_repair_days: int = 14
audit_overdue_days: int = 60
audit_old_available_days: int = 180
audit_heavy_user_limit: int = 3
```

### 3.3 Rate Limiting

- `/assistant/chat` — `30/minute` per IP.
- `/auditor/run` — `10/minute` per IP (audits are more expensive).

Use the existing `Limiter` from `slowapi`.

### 3.4 Error Handling

- Every AI endpoint must have a fallback (keyword search / deterministic rules).
- Log exceptions but do not expose LLM details in HTTP responses.
- Return `used_ai: bool` so the frontend can inform the user about offline mode.

### 3.5 Tests

Add tests in `backend/tests/`:

```python
def test_assistant_returns_rule_based_reply_without_api_key(client, db):
    ...


def test_assistant_rejects_empty_message(client):
    ...


def test_auditor_detects_overdue_rental(client, admin_user, rented_hardware):
    ...


def test_auditor_requires_admin(client, normal_user_token):
    ...


def test_auditor_detects_missing_serial(client, hardware_without_serial):
    ...
```

### 3.6 Data Privacy

Do not send to the LLM:

- passwords or password hashes,
- session tokens,
- personal data beyond work email and internal name.

For the MVP, sending the user's `email` is acceptable because this is an internal system.
