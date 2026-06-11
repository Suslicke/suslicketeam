# suslicketeam-platform — production backend design

**Date:** 2026-06-11
**Status:** validated with owner, ready for implementation planning
**Supersedes:** the single-process `lead-bot` (stays live in `/opt/lead-bot` until cutover)

## Why

The lead-bot grew into the studio's sales-ops backbone (capture → LLM → Twenty,
/harvest, /convert, digests, KPI), but it is still a single aiogram process with
state in `config.json` + flat files. Four drivers, all confirmed by the owner:

1. **Web admin / second client** — manage settings, watch operations, and run
   actions (capture, harvest, digest) from a browser, not only Telegram.
2. **Reliable settings storage** — Postgres with migrations instead of a
   race-prone `config.json`.
3. **Monitoring & observability** — metrics, dashboards, alerts (the TODO's
   "OTel → Grafana on netcup-observ" item, made concrete).
4. **Scale & new features** — background pipelines (auto-harvest, enrichment)
   on a real task queue.

Decision: a **new monorepo `suslicketeam-platform`** with separated services.
The Telegram bot becomes one client of the platform, not the platform itself.
The Next.js website (`Suslicke/suslicketeam`, Cloudflare) stays separate — a
different runtime and deploy target.

## Architecture

Separate services, one repo, one compose, one CI:

```
suslicketeam-platform/
├── core/            # shared library (not a service)
│   ├── domain/      # models: lead draft, capture, harvest run, settings
│   ├── services/    # business logic: capture, convert, harvest, kpi, digest
│   ├── integrations/# twenty.py, llm.py, twogis.py, osm.py, card.py (ported from lead-bot)
│   └── db/          # SQLAlchemy 2.0 async models + Alembic migrations
├── api/             # FastAPI: admin API + Telegram webhook + /metrics + /health
├── bot/             # aiogram UI layer only (handlers, keyboards, cards)
├── worker/          # arq: background tasks (harvest, digests, LLM extraction)
└── admin-ui/        # Next.js (App Router, output:'export') + Tailwind + shadcn/ui
```

Key principle: business logic lives in `core/services/` and does not know its
caller — Telegram handler, admin API, or worker all call the same functions.
`twenty.py`, `llm.py`, `osm.py`, `twogis.py`, `card.py` and their tests port
over nearly as-is (~60% of existing value); the refactor extracts logic out of
handlers, it does not rewrite it.

Flows:

- Telegram → nginx → `api` (webhook route) → aiogram Dispatcher → handler →
  `core.services`; heavy work (LLM, harvest) is enqueued to **arq** (Redis) →
  worker executes → replies via Bot API. No separate bot container: in webhook
  mode the aiogram dispatcher lives inside `api`.
- Browser → nginx (`lead.suslicketeam.com`) → static admin-ui + `/api` proxy →
  same `core.services`.

Queue: **arq** over Celery — the whole codebase is asyncio (aiogram, httpx);
arq is asyncio-native, Redis-brokered, and tasks can await existing
integrations directly.

## Placement & ports

Deployed on the **netcup CRM box** (next to Twenty: nginx + wildcard
`*.suslicketeam.com` cert + `/opt/...` compose pattern already there). RAM is
tight, so containers are tuned small (Postgres `shared_buffers=128MB`, Redis
`maxmemory 64mb`); the whole stack fits in ~600 MB.

Fresh **17xxx port block** (everything bound to `127.0.0.1`; the 8xxx range on
the box is crowded — checked live):

| Service              | Port  | Mnemonic            |
|----------------------|-------|---------------------|
| API (FastAPI)        | 17000 | platform entrypoint |
| Worker health/metrics| 17001 | API + 1             |
| Postgres             | 17432 | 17 + 5432           |
| Redis                | 17379 | 17 + 6379           |

nginx vhost `lead.suslicketeam.com` → admin-ui static + proxy `/api`,
`/telegram` → `127.0.0.1:17000`. Nothing public except via nginx.

Docker compose: `api`, `worker`, `postgres:16-alpine`, `redis:alpine`
(4 containers; admin-ui is static files, no Node runtime on the box).

## Data model (Postgres)

Split rule: **state & settings in DB, secrets in `.env`, leads in Twenty.**
Bot/Twenty/LLM tokens never go into the DB (a DB backup must not leak keys).
Leads are not mirrored — Twenty stays the source of truth.

- **`settings`** — key-value with JSONB value (`key, value, updated_at,
  updated_by`). Absorbs all of `config.json`: KPI metric/goal, digest
  schedule, deal currency, LLM caps. Admin UI edits; bot and worker read live.
- **`members`** — `telegram_id, role (admin|member), added_by, added_at`.
  Replaces the runtime allowlist; env `ALLOWED_TELEGRAM_IDS` remains only as
  the first-admin bootstrap seed.
- **`llm_usage`** — `user_id, date, requests, tokens_in, tokens_out, provider,
  model`. Replaces the file-based UsageStore; feeds admin charts.
- **`operations`** — append-only journal of everything the system does:
  `id, type (capture|harvest|convert|digest), actor, status
  (pending|running|done|failed), payload JSONB, result JSONB, error,
  created_at, finished_at`. One table serves three needs: admin activity feed,
  arq task status for the UI, and debugging material.
- **`harvest_runs`** — harvest detail (niche, city, found/created/skipped),
  references `operations`.

**Alembic from day one** — schema changes only via migrations.

## API, auth, admin UI

FastAPI route groups:

- `/api/v1/*` — settings CRUD, members, operations feed, usage stats, and
  **actions**: `POST /captures`, `POST /harvests`, `POST /digests/run`.
  Actions are async: create an `operations` row, enqueue to arq, return
  `operation_id`; the frontend polls status (the Stripe/GitHub-Actions
  long-running-operation pattern — no held-open requests).
- `/telegram/webhook/<secret-path>` — Telegram updates, guarded by the path
  secret + `X-Telegram-Bot-Api-Secret-Token`.
- `/health`, `/metrics` — internal only.

OpenAPI/Swagger enabled.

**Auth: Telegram Login Widget.** Login page shows "Sign in with Telegram";
the returned payload is HMAC-verified against the bot token; `telegram_id` is
checked against `members` — **the same allowlist governs bot and admin UI**.
Session = signed httpOnly cookie (JWT); `role` gates admin-only sections.
No passwords, no signup.

**admin-ui: Next.js with `output: 'export'`** — keeps the website's familiar
toolchain (App Router, Tailwind v4, shadcn/ui) but builds to pure static
served by nginx; no Node process on the RAM-tight box. SSR/middleware are not
needed behind auth (data is protected by the API cookie; auth redirect happens
client-side on 401). If SSR is ever needed, drop the export flag and add a
node container.

Four screens: **Dashboard** (KPI progress, usage charts), **Operations**
(feed + live task status, 2s polling — SSE/WS is overkill), **Settings**,
**Members**; plus Capture and Harvest modals.

## Monitoring

1. **Metrics:** `prometheus-fastapi-instrumentator` in `api` (RPS, latency,
   status codes) + custom counters: captures, harvest results, LLM
   tokens/errors/latency per provider, arq queue depth. Worker exposes its own
   mini-endpoint (17001).
2. **Collection & dashboards on netcup-observ** (formalizes the existing TODO):
   Grafana + Prometheus (scraping the CRM box over the private interface or an
   SSH tunnel — the Overpass pattern) + **Loki** for logs. All services emit
   structured JSON logs (structlog) to stdout → Promtail/Alloy → Loki.
   One dashboard: API traffic, lead pipeline, LLM spend, both boxes' resources
   (node_exporter).
3. **Errors: Sentry** (already wired) in all three services, with
   `environment=production` and CI-stamped releases.

Alerts: Grafana alerting → Telegram (API down, queue growth, LLM error rate,
disk/RAM). Monitoring watches the CRM box from outside — a total box failure
still alerts.

## Migration & CI/CD

Parallel run, no big bang; old lead-bot keeps serving until cutover:

1. Monorepo skeleton: `core/` + `api/` + `worker/` + `admin-ui/`, compose on
   17xxx, Alembic, CI.
2. Port the core: integrations + tests move to `core/integrations/`; business
   logic extracted from handlers into `core/services/`.
3. Bot in webhook mode inside `api` — under a **new test token** (@BotFather)
   so it runs alongside the prod bot.
4. One-shot import script: `config.json` + usage files → Postgres
   (`settings`, `members`, `llm_usage`).
5. Cutover: prod token moves to the platform (webhook replaces polling), old
   container stops. Rollback = hand the token back to the old bot (~1 min).

CI/CD mirrors the proven lead-bot pipeline: push to `main` → GitHub Actions →
build `platform-api`, `platform-worker` images + admin-ui static →
`ghcr.io/suslicke/*` → SSH deploy (restricted forced-command key) →
`alembic upgrade head` → `docker compose up -d` in `/opt/platform`.

## Out of scope (deliberate)

- **Lead browsing/editing in the admin UI** — Twenty already is the web UI for
  leads; duplicating it means two UIs over one dataset.
- **Mirroring lead data into the platform DB** — Twenty stays authoritative.
- **Repo-per-service** — at this team size, a shared `core/` as a versioned
  private package costs more than it buys.
- **Website integration** — different runtime (Cloudflare Workers), stays in
  its own repo.
