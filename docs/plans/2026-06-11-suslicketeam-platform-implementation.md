# suslicketeam-platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the production backend platform (FastAPI API + aiogram webhook bot + arq worker + Next.js static admin UI + Postgres/Redis) that replaces the single-process lead-bot.

**Architecture:** New monorepo `suslicketeam-platform`. Business logic lives in `core/` and is called identically by the Telegram bot, the admin API, and the worker. One Docker image runs both `api` (uvicorn) and `worker` (arq) with different commands. Postgres holds settings/members/usage/operations; Twenty CRM stays the source of truth for leads. Everything binds to `127.0.0.1` on the 17xxx port block on the netcup CRM box.

**Tech Stack:** Python 3.12, uv, FastAPI, aiogram 3, arq, SQLAlchemy 2 (async) + Alembic, asyncpg, pydantic-settings, structlog, prometheus-fastapi-instrumentator, Next.js (static export) + Tailwind + shadcn/ui, Docker Compose, GitHub Actions → GHCR → SSH deploy.

**Design doc:** `docs/plans/2026-06-11-suslicketeam-platform-design.md` (in the `suslicketeam` website repo; copied into the new repo in Task 1). Read it first.

**Source material:** the existing bot at `/Users/suslicke/Documents/Programming/Python/lead-bot/` — read its `CLAUDE.md` and `TODO.md` before Phase 2. Its `app/twenty.py`, `app/llm.py`, `app/twogis.py`, `app/osm.py`, `app/osm_tags.py`, `app/card.py`, `app/timeutil.py`, `app/draft.py`, `app/reference.py`, `app/stats.py` and `tests/` port over nearly as-is. **Do not modify the lead-bot repo** — it stays live in prod until cutover.

**Ports (all 127.0.0.1):** API 17000 · worker metrics 17001 · Postgres 17432 · Redis 17379.

**Conventions:** Conventional Commits, plain `git commit` (no Co-Authored-By trailer — the owner keeps history clean). TDD per task. `uv run pytest` must be green before every commit.

---

## Phase 0 — Repo skeleton

### Task 1: Create the monorepo

**Files:**
- Create: `~/Documents/Programming/Python/suslicketeam-platform/` (git init)
- Create: `pyproject.toml`, `.gitignore`, `README.md`, `docs/`

**Step 1:** Create the project and copy the design doc:

```bash
mkdir -p ~/Documents/Programming/Python/suslicketeam-platform && cd $_
git init -b main
mkdir -p core/{db,domain,services,integrations} api/routes bot/handlers worker/tasks tests docs deploy scripts
cp ~/Documents/Programming/Python/suslicketeam/docs/plans/2026-06-11-suslicketeam-platform-design.md docs/DESIGN.md
cp ~/Documents/Programming/Python/suslicketeam/docs/plans/2026-06-11-suslicketeam-platform-implementation.md docs/PLAN.md
```

**Step 2:** Write `pyproject.toml`:

```toml
[project]
name = "suslicketeam-platform"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn[standard]>=0.34",
    "aiogram>=3.15",
    "arq>=0.26",
    "sqlalchemy[asyncio]>=2.0.36",
    "asyncpg>=0.30",
    "alembic>=1.14",
    "pydantic-settings>=2.7",
    "httpx>=0.28",
    "structlog>=24.4",
    "prometheus-fastapi-instrumentator>=7.0",
    "prometheus-client>=0.21",
    "sentry-sdk[fastapi]>=2.19",
    "pillow>=11",
    "pyjwt>=2.10",
]

[dependency-groups]
dev = [
    "pytest>=8.3",
    "pytest-asyncio>=0.25",
    "aiosqlite>=0.20",
    "respx>=0.22",
    "ruff>=0.8",
]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py312"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["core", "api", "bot", "worker"]
```

**Step 3:** `.gitignore`: `.venv/`, `__pycache__/`, `.env`, `*.key`, `data/`, `admin-ui/node_modules/`, `admin-ui/.next/`, `admin-ui/out/`.

**Step 4:** `uv sync` → resolves and creates `uv.lock` + `.venv`. Add empty `__init__.py` to every package dir (`core`, `core/db`, `core/domain`, `core/services`, `core/integrations`, `api`, `api/routes`, `bot`, `bot/handlers`, `worker`, `worker/tasks`, `tests`).

**Step 5:** Verify: `uv run python -c "import core, api, bot, worker"` → no error.

**Step 6:** Commit: `chore: scaffold suslicketeam-platform monorepo`

### Task 2: Local docker-compose (Postgres + Redis on 17xxx)

**Files:**
- Create: `docker-compose.yml`, `.env.example`

**Step 1:** `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    command: ["postgres", "-c", "shared_buffers=128MB", "-c", "max_connections=50"]
    environment:
      POSTGRES_USER: platform
      POSTGRES_PASSWORD: platform
      POSTGRES_DB: platform
    ports: ["127.0.0.1:17432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    restart: unless-stopped
  redis:
    image: redis:7-alpine
    command: ["redis-server", "--maxmemory", "64mb", "--maxmemory-policy", "noeviction"]
    ports: ["127.0.0.1:17379:6379"]
    restart: unless-stopped
volumes:
  pgdata:
```

(`noeviction` because Redis carries the arq queue — evicting jobs silently loses work.)

**Step 2:** `.env.example` — every variable the platform reads, with comments (see Task 3 for the list; keep this file in sync from now on).

**Step 3:** Verify: `docker compose up -d && docker compose exec postgres pg_isready -U platform` → `accepting connections`.

**Step 4:** Commit: `chore: local compose — postgres 17432, redis 17379`

### Task 3: Typed settings (pydantic-settings)

**Files:**
- Create: `core/config.py`
- Test: `tests/test_config.py`

**Step 1:** Failing test:

```python
from core.config import Settings

def test_defaults_point_at_17xxx():
    s = Settings(_env_file=None)
    assert "17432" in s.database_url
    assert "17379" in s.redis_url

def test_bootstrap_admin_ids_parse():
    s = Settings(_env_file=None, allowed_telegram_ids="1, 2,3")
    assert s.bootstrap_admin_ids == [1, 2, 3]
```

**Step 2:** Run `uv run pytest tests/test_config.py -v` → FAIL (no module).

**Step 3:** Implement `core/config.py`:

```python
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "dev"
    database_url: str = "postgresql+asyncpg://platform:platform@127.0.0.1:17432/platform"
    redis_url: str = "redis://127.0.0.1:17379/0"

    telegram_bot_token: str = ""             # lead-bot env name — prod .env migrates by copy
    telegram_webhook_secret: str = ""        # random path + header secret
    public_base_url: str = "https://lead.suslicketeam.com"
    admin_session_secret: str = ""           # JWT signing key
    allowed_telegram_ids: str = ""           # bootstrap admins, comma-separated

    twenty_api_url: str = "http://127.0.0.1:4000"   # lead-bot env name
    twenty_api_key: str = ""

    llm_provider: str = "cloudflare"
    llm_api_key: str = ""
    cloudflare_account_id: str = ""          # lead-bot env name
    cloudflare_api_token: str = ""           # lead-bot env name
    model: str = ""

    twogis_api_key: str = ""
    overpass_url: str = ""
    sentry_dsn: str = ""

    @property
    def bootstrap_admin_ids(self) -> list[int]:
        return [int(x) for x in self.allowed_telegram_ids.split(",") if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

(Env names are already aligned with lead-bot's `app/config.py` and the committed `.env.example` — pydantic-settings maps field `telegram_bot_token` → env `TELEGRAM_BOT_TOKEN` automatically. Cross-check `.env.example` for any var added there in Task 2 that the Settings class must read, e.g. `TWENTY_PUBLIC_URL`, `AIG_GATEWAY_ID`, `CF_AIG_TOKEN`, `ANTHROPIC_API_KEY`, `OLLAMA_BASE_URL`.)

**Step 4:** Tests pass. **Step 5:** Commit: `feat(core): typed settings via pydantic-settings`

### Task 4: Structured logging

**Files:**
- Create: `core/logging.py`
- Test: `tests/test_logging.py` (smoke: configure + log doesn't raise; JSON in prod mode)

structlog config: console renderer when `environment == "dev"`, JSON renderer otherwise; include timestamp, level, logger name. One public function `setup_logging(settings)` called from api/worker entrypoints.

Commit: `feat(core): structlog JSON logging`

---

## Phase 1 — Database layer

### Task 5: Models + async engine

**Files:**
- Create: `core/db/base.py`, `core/db/models.py`, `core/db/engine.py`
- Test: `tests/db/test_models.py`

**Step 1:** Failing test (in-memory aiosqlite):

```python
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from core.db.base import Base
from core.db.models import Setting, Member, Operation

@pytest.fixture
async def session():
    engine = create_async_engine("sqlite+aiosqlite://")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine)() as s:
        yield s

async def test_setting_roundtrip(session):
    session.add(Setting(key="kpi", value={"metric": "new_leads", "goal": 5}))
    await session.commit()
    got = await session.get(Setting, "kpi")
    assert got.value["goal"] == 5

async def test_member_roles(session):
    session.add(Member(telegram_id=42, role="admin", added_by=42))
    await session.commit()
    assert (await session.get(Member, 42)).role == "admin"
```

**Step 2:** FAIL. **Step 3:** Implement.

`core/db/base.py`:

```python
from datetime import datetime

from sqlalchemy import JSON, DateTime, MetaData
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase

JSONVariant = JSON(none_as_null=True).with_variant(JSONB(none_as_null=True), "postgresql")

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    type_annotation_map = {dict: JSONVariant, datetime: DateTime(timezone=True)}
```

`core/db/models.py` — all five tables from the design doc:

```python
import uuid
from datetime import datetime, timezone
from sqlalchemy import BigInteger, String, Text, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column
from core.db.base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Setting(Base):
    __tablename__ = "settings"
    key: Mapped[str] = mapped_column(String(64), primary_key=True)
    value: Mapped[dict]
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    updated_by: Mapped[str | None] = mapped_column(String(64))


class Member(Base):
    __tablename__ = "members"
    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    role: Mapped[str] = mapped_column(String(16))  # admin | member
    display_name: Mapped[str | None] = mapped_column(String(128))
    added_by: Mapped[int] = mapped_column(BigInteger)
    added_at: Mapped[datetime] = mapped_column(default=utcnow)


class LlmUsage(Base):
    __tablename__ = "llm_usage"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger)  # leading column of uq_usage
    date: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD (Asia/Almaty day)
    provider: Mapped[str] = mapped_column(String(32))
    model: Mapped[str] = mapped_column(String(128))
    requests: Mapped[int] = mapped_column(default=0)
    tokens_in: Mapped[int] = mapped_column(default=0)
    tokens_out: Mapped[int] = mapped_column(default=0)
    __table_args__ = (Index("uq_usage", "user_id", "date", "provider", "model", unique=True),)


class Operation(Base):
    __tablename__ = "operations"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    type: Mapped[str] = mapped_column(String(32))               # capture|harvest|convert|digest
    actor: Mapped[str] = mapped_column(String(64))              # "tg:123" | "web:123"
    status: Mapped[str] = mapped_column(String(16), default="pending")
    payload: Mapped[dict] = mapped_column(default=dict)
    result: Mapped[dict | None]
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utcnow, index=True)
    finished_at: Mapped[datetime | None]
    __table_args__ = (Index("ix_operations_feed", "type", "status", "created_at"),)


class HarvestRun(Base):
    __tablename__ = "harvest_runs"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    operation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("operations.id"), index=True)
    niche: Mapped[str] = mapped_column(String(64))
    city: Mapped[str] = mapped_column(String(64))
    found: Mapped[int] = mapped_column(default=0)
    created: Mapped[int] = mapped_column(default=0)
    skipped: Mapped[int] = mapped_column(default=0)
```

`core/db/engine.py` — `create_async_engine(settings.database_url, pool_pre_ping=True)`, module-level `async_sessionmaker`, `get_session()` async context helper.

**Step 4:** Tests pass. **Step 5:** Commit: `feat(db): SQLAlchemy models — settings, members, llm_usage, operations, harvest_runs`

### Task 6: Alembic baseline migration

**Files:**
- Create: `alembic.ini`, `migrations/` (async template)

**Step 1:** `uv run alembic init -t async migrations`. Point `migrations/env.py` at `core.db.base.Base.metadata` and `get_settings().database_url`.

**Step 2:** `docker compose up -d` then `uv run alembic revision --autogenerate -m "baseline"` → inspect the generated file (5 tables).

**Step 3:** `uv run alembic upgrade head` → verify: `docker compose exec postgres psql -U platform -c '\dt'` lists 5 tables + `alembic_version`.

**Step 4:** Commit: `feat(db): alembic baseline migration`

### Task 7: Stores (repositories)

**Files:**
- Create: `core/db/stores.py`
- Test: `tests/db/test_stores.py`

TDD each store against the aiosqlite fixture:

- `SettingsStore` — `get(key, default)`, `set(key, value, updated_by)`, `all()`. Plus typed accessors used everywhere: `kpi()`, `digest_schedule()`, `deal_currency()`, `llm_caps()` (mirror the shape of lead-bot's `config.json` — read it on the box or in `app/config.py` defaults).
- `MembersStore` — `is_allowed(tg_id)`, `role(tg_id)`, `add(tg_id, role, added_by)`, `remove(tg_id)`, `list()`. `is_allowed` = member row exists **or** id in `settings.bootstrap_admin_ids` (bootstrap admins work before any DB row exists).
- `UsageStore` — `record(user_id, provider, model, tokens_in, tokens_out)` (UPSERT on the unique index), `today(user_id)`, `check_caps(user_id, caps) -> bool` (hard-stop pre-call, same semantics as lead-bot).
- `OperationsStore` — `create(type, actor, payload) -> Operation`, `mark_running(id)`, `finish(id, result)`, `fail(id, error)`, `list(filters, limit, offset)`.

Commit: `feat(db): settings/members/usage/operations stores`

---

## Phase 2 — Port the core from lead-bot

> Read `/Users/suslicke/Documents/Programming/Python/lead-bot/CLAUDE.md` and skim `DESIGN.md` before starting. Port = copy file, fix imports (`app.` → `core.integrations.` / `core.config`), adapt config access to `Settings`, keep behavior identical. Port the matching tests from `lead-bot/tests/` in the same task.

### Task 8: Port integrations

**Files:**
- Create: `core/integrations/{twenty,llm,twogis,osm,osm_tags,card,timeutil,draft,reference,stats}.py` (from `lead-bot/app/` same names)
- Test: `tests/integrations/` (ported from `lead-bot/tests/`)

Steps: copy → fix imports → `uv run pytest tests/integrations -v` green → commit per logical group if large:
`feat(core): port twenty/llm/2gis/osm/card integrations from lead-bot`

Notes:
- `llm.py` keeps the `@provider` Strategy registry untouched (cloudflare/aigateway/anthropic/ollama).
- `reference.py` (OptionsRegistry — dynamic niche/source Selects off Twenty's Metadata API) is an integration, port as-is.
- Anything importing aiogram does NOT belong in core — leave those parts for Phase 5 (`bot/`).

### Task 9: Capture service

**Files:**
- Create: `core/services/capture.py`
- Test: `tests/services/test_capture.py`

Extract from `lead-bot/app/handlers/capture.py` the transport-free pipeline:

```python
async def extract_draft(text: str, *, registry, llm, twogis, osm) -> Draft
    # 2GIS link → Catalog API enrichment; else LLM extraction; OSM backfill of empty address/contact
async def save_draft(draft: Draft, *, twenty, actor: str) -> SaveResult
    # dedup by prospectLink/osmId → create or update (update keeps stage/nextStep/notes)
```

Test with mocked integrations (respx for HTTP or fake objects): dedup-found→update path, dedup-miss→create path, 2GIS link path skips LLM. Telegram-specific bits (FSM, confirm keyboards) stay out — they call these functions in Phase 5.

**IMPORTANT (from Task 8 review):** `Extractor.extract()` is synchronous httpx (60s × 2 attempts) — lead-bot wraps it in `asyncio.to_thread` at the handler layer. The capture service MUST preserve that (`await asyncio.to_thread(extractor.extract, ...)`) or the arq worker / API event loop stalls for minutes per extraction. Same for Pillow card rendering later.

Commit: `feat(core): capture service — extract + dedup-aware save`

### Task 10: Convert, KPI, digest services

**Files:**
- Create: `core/services/{convert,kpi,digest}.py`
- Test: `tests/services/test_{convert,kpi,digest}.py`

- `convert.py` ← from `handlers/convert.py`: Lead → dedup Company by link → create/reuse → Opportunity → link → forward-only stage bump.
- `kpi.py` ← from `handlers/kpi.py` + `stats.py`: read KPI config from `SettingsStore` (not config.json), compute progress.
- `digest.py` ← from `handlers/digest.py` + `scheduler.py`: `build_digest() -> str` and `due_now(schedule, now) -> bool` (pure function — the worker cron calls it every minute; replaces APScheduler).

Commit each: `feat(core): convert/kpi/digest services`

### Task 11: Harvest service

**Files:**
- Create: `core/services/harvest.py`
- Test: `tests/services/test_harvest.py`

From `handlers/harvest.py`: `run_harvest(niche, city, *, twenty, osm, ops, progress_cb) -> HarvestResult` — pulls by `NICHE_TAG_MAP`, dedups by `osmId`, creates Leads (`Source=OSM`), reports found/created/skipped through `progress_cb` (worker will push these into `operations.result` so the UI sees live counts).

**Dedup horizon (from Task 9 review):** TwentyClient.all_leads() defaults to limit=200 — harvest-scale dedup MUST paginate all_leads (or raise the limit and log loudly when len==limit), else re-harvests duplicate leads once the CRM exceeds 200.

Commit: `feat(core): harvest service`

---

## Phase 3 — API service

### Task 12: App factory, /health, /metrics

**Files:**
- Create: `api/main.py`, `api/deps.py`
- Test: `tests/api/test_health.py`

```python
# api/main.py
def create_app(settings: Settings | None = None) -> FastAPI:
    # lifespan: init db engine, arq redis pool (arq.create_pool), aiogram Bot/Dispatcher (Phase 5)
    # mount routers; Instrumentator().instrument(app).expose(app)  -> /metrics
    # sentry_sdk.init if dsn
```

Test via `httpx.AsyncClient(transport=ASGITransport(app))`: `GET /health` → `{"status":"ok"}`; `GET /metrics` → 200, contains `http_request`.

Commit: `feat(api): app factory with health + prometheus metrics`

### Task 13: Telegram Login auth

**Files:**
- Create: `api/auth.py`, `api/routes/auth.py`
- Test: `tests/api/test_auth.py`

**Step 1:** Failing tests: valid widget payload (build HMAC in test with a known token) → 200 + sets cookie; tampered hash → 401; non-member telegram_id → 403; `GET /api/v1/me` with cookie → role.

**Step 2:** Implement:

```python
# api/auth.py
def verify_telegram_login(data: dict[str, str], bot_token: str, max_age: int = 86400) -> int:
    data = dict(data)
    received = data.pop("hash", "")
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret = hashlib.sha256(bot_token.encode()).digest()
    expected = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, received):
        raise InvalidLogin()
    if time.time() - int(data.get("auth_date", 0)) > max_age:
        raise InvalidLogin()
    return int(data["id"])

def issue_session(telegram_id: int, role: str, secret: str) -> str:   # JWT, 7d exp
def session_cookie(response, token): ...                              # httpOnly, Secure, SameSite=Lax
```

Routes: `POST /api/v1/auth/telegram` (widget payload → verify → MembersStore check → cookie), `POST /api/v1/auth/logout`, `GET /api/v1/me`. Deps in `api/deps.py`: `current_member` (cookie → JWT → Member), `require_admin`.

Commit: `feat(api): telegram login widget auth + session cookie`

### Task 14: Settings / members / usage / operations routes

**Files:**
- Create: `api/routes/{settings,members,usage,operations}.py`
- Test: `tests/api/test_admin_routes.py`

- `GET/PUT /api/v1/settings` (PUT admin-only; `updated_by="web:<tg_id>"`)
- `GET/POST/DELETE /api/v1/members` (admin-only; cannot remove last admin — test this)
- `GET /api/v1/usage?days=30` — aggregates for charts
- `GET /api/v1/operations?type=&status=&limit=&offset=` and `GET /api/v1/operations/{id}`

TDD each with the auth cookie fixture. Commit: `feat(api): admin CRUD routes`

### Task 15: Action routes (enqueue pattern)

**Files:**
- Create: `api/routes/actions.py`
- Test: `tests/api/test_actions.py`

`POST /api/v1/captures {text}`, `POST /api/v1/harvests {niche, city}`, `POST /api/v1/digests/run` — each: create `Operation(status=pending)` → `await arq_pool.enqueue_job("capture_extract", op_id, ...)` → `202 {"operation_id": ...}`. Test with a stub arq pool (assert enqueue called with op id); no waiting in the request path.

Commit: `feat(api): async action endpoints — capture/harvest/digest`

### Task 16: Dockerfile (single image)

**Files:**
- Create: `Dockerfile`, `.dockerignore`

Multi-stage: `uv sync --frozen --no-dev` into a slim 3.12 image. Default CMD `uvicorn api.main:app --host 0.0.0.0 --port 8000` (compose maps `127.0.0.1:17000:8000`); worker service overrides command to `arq worker.main.WorkerSettings`. Verify `docker build .` succeeds.

Commit: `chore: production Dockerfile (api+worker single image)`

---

## Phase 4 — Worker

### Task 17: arq worker + operation-tracked tasks

**Files:**
- Create: `worker/main.py`, `worker/tasks/{capture,harvest,digest}.py`
- Test: `tests/worker/test_tasks.py`

```python
# worker/main.py
class WorkerSettings:
    functions = [capture_extract, harvest_run, digest_send]
    cron_jobs = [cron(digest_tick, minute=set(range(60)))]  # reads digest schedule from SettingsStore
    redis_settings = RedisSettings.from_dsn(get_settings().redis_url)
    on_startup / on_shutdown  # db engine, aiogram Bot for replies, sentry
```

**Enqueue contract (from Task 15, see `api/routes/actions.py`):** task names are `capture_extract` / `harvest_run` / `digest_send`; each job receives exactly one positional arg — the Operation id as `str` — and reads its input payload from the operations row (single source of truth; nothing duplicated into job args). Tasks must tolerate a not-yet-visible operation row (the API enqueues before its transaction commits) — implement as bounded retry (~0.5s/1s/2s, ≤5s total) then **graceful drop with a warning log** if the row never appears (enqueue-succeeded-but-commit-failed orphan; the client already saw a 500). Enqueue idempotency: routes may pass `_job_id=str(op.id)` later — tasks must be safe under arq job-id dedup..

Task pattern (test it once, reuse): wrap body in `ops.mark_running` → … → `ops.finish(result)` / `ops.fail(str(e))`; capture/harvest tasks notify the Telegram actor via Bot API when done (actor `tg:*`), web actors just see the operation status. `digest_tick` cron: `if due_now(schedule, now): enqueue digest_send` — runtime-configurable digests without restarts.

Test tasks directly as async functions with fakes (arq context dict).

**Note (from Task 8 review):** the worker entrypoint — and ONLY the worker, not the API — calls `core.integrations.metrics.init(path, tz)` once at startup (file-based 2GIS/Overpass call counters; two processes init'ing the same path would lose each other's counts).

**Digest idempotency (from Task 10 review):** `digest_tick` must enqueue `digest_send` with a deterministic job id for the matched slot — `_job_id=f"digest_send:{local_date}T{hh_mm}"` — making double-send structurally impossible (arq dedups by job id; ensure `keep_result` > 60s). Evaluate `due_now` against the tick's minute truncated to :00 seconds, not raw now(). Convert/API note: `convert_lead` now raises typed `LeadNotFound`/`AlreadyConverted`/`NotConvertible` — map them at the edges.

Commit: `feat(worker): arq tasks with operations tracking + digest cron`

### Task 18: Worker metrics endpoint

**Files:**
- Modify: `worker/main.py`

`prometheus_client.start_http_server(17001)` in `on_startup` (compose: `127.0.0.1:17001:17001`); counters: `platform_tasks_total{task,status}`, `platform_llm_tokens_total{provider,direction}`. Smoke-test locally: `curl 127.0.0.1:17001` shows counters.

Commit: `feat(worker): prometheus metrics on 17001`

---

## Phase 5 — Bot (webhook mode)

### Task 19: Port handlers onto core services

**Files:**
- Create: `bot/dispatcher.py`, `bot/keyboards.py`, `bot/handlers/*` (from `lead-bot/app/handlers/*` + `app/keyboards.py` + `app/filters.py`)
- Test: `tests/bot/` (port lead-bot's handler tests)

Rules for the port:
- Handlers keep their router-per-feature layout, but every business action calls `core.services.*`; direct Twenty/LLM calls from handlers are gone.
- `filters.py` Whitelist → reads `MembersStore.is_allowed` (live, no restart) instead of config.json.
- Heavy paths (capture extraction, harvest) now enqueue arq jobs and answer "⏳ — пришлю результат"; the worker replies with the draft/result. Light reads (`/today /pipeline /leads /kpi`) stay inline.
- `/members`, `/kpi`, `/digest`, `/currency`, `/niche add`, `/source add` write through `SettingsStore`/`MembersStore`.

Commit: `feat(bot): handlers ported onto core services`

### Task 20: Webhook wiring in the API

**Files:**
- Create: `api/routes/telegram.py`
- Modify: `api/main.py` (lifespan: Bot, Dispatcher, set_webhook)

```python
# POST /telegram/webhook/{secret}
# 404 if secret != settings.telegram_webhook_secret
# 401 if X-Telegram-Bot-Api-Secret-Token header mismatch
# else: update = Update.model_validate(await request.json()); await dp.feed_update(bot, update); return {"ok": True}
```

Lifespan on startup (prod only): `await bot.set_webhook(f"{settings.public_base_url}/telegram/webhook/{secret}", secret_token=secret, drop_pending_updates=False)`.

Test: wrong secret → 404; correct secret + stub dispatcher → feed_update called.

Commit: `feat(api): telegram webhook endpoint + set_webhook lifecycle`

### Task 21: E2E smoke with a test bot token

Manual checkpoint (no code):
1. Create a **test bot** via @BotFather; put its token in local `.env`.
2. `docker compose up` everything + `uvicorn` + `arq` locally; expose via `ssh -R` or set webhook to a temporary tunnel (or run polling fallback locally: `python -m bot.polling` — add a 10-line dev entrypoint if needed).
3. Verify in Telegram: `/start` hub renders → text capture → draft preview → confirm → Lead appears in Twenty (use a throwaway niche) → `/kpi` → `/today` card PNG.
4. Fix whatever broke; commit fixes individually.

---

## Phase 6 — admin-ui (Next.js static export)

### Task 22: Scaffold

**Files:**
- Create: `admin-ui/` via `pnpm create next-app@latest admin-ui --ts --tailwind --app --no-src-dir`

`next.config.ts`: `output: 'export'`, `images: { unoptimized: true }`. Add shadcn/ui. Dev proxy: `async rewrites()` doesn't work with export — instead the API client uses `NEXT_PUBLIC_API_BASE` (empty string in prod = same-origin; `http://127.0.0.1:17000` in dev). `lib/api.ts`: thin `fetch` wrapper, `credentials: "include"`, on 401 → redirect `/login`.

Verify: `pnpm build` produces `out/`. Commit: `feat(admin-ui): next.js static-export scaffold`

### Task 23: Login + session

**Files:**
- Create: `admin-ui/app/login/page.tsx`, `admin-ui/lib/auth.ts`

Telegram Login Widget (`<script src="https://telegram.org/js/telegram-widget.js?22" data-telegram-login="<bot_username>" data-onauth="onTelegramAuth(user)">`) → POST payload to `/api/v1/auth/telegram` → on 200 redirect `/`. Security note: pin the versioned widget URL (`?22`) and add `integrity="sha384-<hash>" crossorigin="anonymous"` — compute the hash at build time (`curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`). If Telegram ever republishes the same version in place the widget stops loading (fail-closed) — that's the right failure mode for an auth script; bump the version + hash to fix. The server-side HMAC check in Task 13 remains the actual security boundary either way. Root layout: client guard that calls `/api/v1/me`, redirects to `/login` on 401. NOTE: the widget requires the bot's domain set via @BotFather `/setdomain` → `lead.suslicketeam.com` (and your tunnel domain for dev testing).

Commit: `feat(admin-ui): telegram login + session guard`

### Task 24: Dashboard + Operations screens

**Files:**
- Create: `admin-ui/app/(app)/page.tsx` (Dashboard), `admin-ui/app/(app)/operations/page.tsx`

Dashboard: KPI progress (from `/api/v1/usage` + kpi settings), usage chart (recharts), pipeline snapshot. Operations: table (type/status/actor/created), filter chips, auto-refresh every 2s while any visible op is pending/running; row click → payload/result/error detail.

Commit: `feat(admin-ui): dashboard + operations feed`

### Task 25: Settings, Members, action modals

**Files:**
- Create: `admin-ui/app/(app)/settings/page.tsx`, `.../members/page.tsx`, `admin-ui/components/{capture,harvest}-modal.tsx`

Settings: form per settings group (KPI metric/goal, digest times, currency, LLM caps) → PUT. Members: list/add/remove (admin-only UI). Capture modal: textarea → `POST /captures` → jump to the operation row. Harvest modal: niche + city selects (niches from Twenty options via a small `/api/v1/reference` endpoint — add it if missing) → `POST /harvests`.

Commit: `feat(admin-ui): settings, members, capture/harvest actions`

---

## Phase 7 — Deploy & cutover

### Task 26: Legacy import script

**Files:**
- Create: `scripts/import_legacy.py`
- Test: `tests/test_import_legacy.py` (fixture copies of config.json/usage shapes)

Reads lead-bot's `data/config.json` + usage files (check real shapes on the box: `ssh netcup "cat /opt/lead-bot/data/config.json"`), writes `settings`, `members`, `llm_usage` rows. Idempotent (UPSERT). Run later on the box inside the api container: `docker compose exec api python scripts/import_legacy.py /import/config.json`.

**Key remap (lead-bot config.json → platform settings rows; NOT a 1:1 copy):**
| lead-bot (flat)                        | platform `settings` row                      |
|----------------------------------------|----------------------------------------------|
| `kpi_goal`, `kpi_metric`               | `kpi` → `{"metric": ..., "goal": ...}`       |
| `digest_times: [...]`                  | `digest_schedule` → `{"times": [...]}`       |
| `llm_max_requests`, `llm_max_tokens`   | `llm_caps` → `{"max_requests": ..., "max_tokens": ...}` |
| `deal_currency: "KZT"`                 | `deal_currency` → `{"code": "KZT"}`          |
| `members: [ids]`                       | `members` TABLE rows (role=member), not a setting |

Commit: `feat(scripts): one-shot legacy config/usage import`

### Task 27: Production compose + nginx

**Files:**
- Create: `deploy/docker-compose.prod.yml`, `deploy/nginx-lead.suslicketeam.com.conf`, `deploy/README.md`

Prod compose: `api` (image `ghcr.io/suslicke/platform:latest`, `127.0.0.1:17000:8000`), `worker` (same image, arq command, `127.0.0.1:17001:17001`), `postgres` (17432, tuned, named volume), `redis` (17379), `restart: always`, `env_file: .env`. nginx vhost: `lead.suslicketeam.com` → `root /opt/platform/admin-ui` (static, `try_files $uri /index.html`), `location /api/ { proxy_pass http://127.0.0.1:17000; }`, same for `/telegram/`; SSL from the existing wildcard cert dir `/etc/nginx/ssl/suslicketeam.com/` (same include pattern as the Twenty vhost — read `/etc/nginx/conf.d/crm.suslicketeam.com.conf` for reference). deploy/README.md: first-install runbook (`/opt/platform`, `.env` with chmod 600, DNS A-record for `lead`, `alembic upgrade head`).

Commit: `chore(deploy): prod compose + nginx vhost`

### Task 28: CI/CD (GitHub Actions)

**Files:**
- Create: `.github/workflows/deploy.yml`

Mirror the proven lead-bot pipeline (read `/Users/suslicke/Documents/Programming/Python/lead-bot/.github/workflows/` for the SSH/forced-command pattern). Jobs on push to `main`:
1. `test`: `uv sync && uv run pytest && uv run ruff check`.
2. `build`: docker build+push `ghcr.io/suslicke/platform:{latest,sha}`; `pnpm build` admin-ui → upload `out/` artifact.
3. `deploy` (needs 1+2): SSH to netcup (new restricted deploy key, separate from lead-bot's) → `docker compose pull` → `docker compose run --rm api alembic upgrade head` → `docker compose up -d` → rsync admin-ui `out/` → `/opt/platform/admin-ui`.

Repo secrets: `DEPLOY_SSH_KEY`, `GHCR` uses `GITHUB_TOKEN`. New private repo `Suslicke/suslicketeam-platform`; owner pushes straight to `main` (no PR flow — his stated preference).

Commit: `ci: build, migrate, deploy pipeline`

### Task 29: Production bring-up (test token)

Manual checkpoint on the box:
1. Create `/opt/platform` + `.env` (prod values; **test bot token**; webhook secret = `openssl rand -hex 24`; Twenty key — issue a NEW API key in Twenty settings for the platform, don't reuse lead-bot's).
2. DNS: `lead.suslicketeam.com` A-record → netcup IP; nginx conf + `nginx -t && systemctl reload nginx`.
3. First deploy via CI push; check `/health` through nginx, webhook set (`getWebhookInfo`), admin UI loads, Telegram login works (after `/setdomain`).
4. Run `import_legacy.py`. Verify settings/members/usage appear in the admin UI.
5. Full smoke: capture from web + from Telegram test bot; harvest dry-run; digest manual run.

### Task 30: Cutover + rollback

1. Announce to members; pick a quiet hour.
2. On the box: stop lead-bot (`cd /opt/lead-bot && docker compose down`) — its polling releases the prod token.
3. Swap `BOT_TOKEN` in `/opt/platform/.env` to the **prod** token, `docker compose up -d api worker` (startup sets the webhook; `drop_pending_updates=False` keeps queued updates).
4. Re-run `/setdomain` for the prod bot → `lead.suslicketeam.com` (login widget).
5. Verify: hub, capture→Twenty, `/kpi`, digest tick, admin UI under prod bot login.
6. **Rollback** (if anything is wrong): restore test token in platform `.env`, `docker compose up -d` old lead-bot — it re-polls with the prod token within a minute. Old bot stays installed but stopped for 2 weeks, then archive the repo with a README pointer to the platform.

---

## Phase 8 — Monitoring (netcup-observ)

### Task 31: Observability stack on observ

**Files (on observ box, kept in repo under `deploy/observ/`):**
- Create: `deploy/observ/docker-compose.yml` (Grafana, Prometheus, Loki, Alloy), `deploy/observ/prometheus.yml`

Prometheus scrape targets: platform api (17000/metrics) + worker (17001) + node_exporter on both boxes — over the boxes' private interface if available, else an SSH tunnel systemd unit (copy the `overpass-tunnel.service` pattern in reverse). Alloy tails Docker logs on the CRM box → Loki (or run Alloy on the CRM box shipping to observ — pick whichever the boxes' network allows; document the choice).

Commit: `feat(observ): grafana+prometheus+loki stack`

### Task 32: Dashboard + alerts

Grafana provisioning files in `deploy/observ/grafana/`: one "Platform" dashboard (API RPS/latency/5xx, arq queue depth, task success/fail, LLM tokens by provider, captures/harvests per day, box RAM/disk) + alert rules → Telegram contact point (bot token, owner chat id): API down 2m, worker silent 10m, 5xx > 5%/10m, disk > 85%, RAM > 90%.

Commit: `feat(observ): platform dashboard + telegram alerts`

---

## Done criteria

- Old lead-bot stopped; prod bot served by the platform via webhook.
- Admin UI live at `lead.suslicketeam.com` (Telegram login, settings/members/operations/usage, capture+harvest from browser).
- `config.json` is gone from the runtime path; settings only in Postgres via Alembic-managed schema.
- Push to `main` → tests → image → migration → deploy, hands-free.
- Grafana shows the platform dashboard; a test alert reaches Telegram.
