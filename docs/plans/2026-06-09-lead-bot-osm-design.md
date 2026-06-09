# lead-bot — OpenStreetMap integration (harvest + enrichment)

**Date:** 2026-06-09
**Status:** Design (validated, pre-implementation)
**Scope:** `github.com/Suslicke/lead-bot` (separate private repo) + Overpass infra on the netcup VPS + small Twenty schema change. **Not** the Next.js website repo.

## Goal

Make the lead-bot a *source* of leads, not just a logger of manually-found ones. Two modes:

- **Harvest (discovery):** `/harvest` finds businesses in bulk by niche + city via a self-hosted Overpass instance and creates `Lead` records at `Stage=TO_CONTACT`.
- **Enrichment:** when a lead is entered manually, the bot backfills missing fields (address, phone, website, coordinates) from OSM.

### Honest limitations (kept in mind by design)

- **OSM has no reviews/ratings.** Harvest seeds the funnel with *volume*; prioritisation by demand/quality still comes from 2GIS (manual flow). OSM does not replace 2GIS — it feeds it.
- **Small-business coverage is patchy** — chains/notable venues are present, tiny venues may be missing.
- **Gaming clubs are poorly tagged in OSM** — PC-club coverage will likely be thin (see niche map note).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Modes | Both harvest **and** enrichment |
| OSM infra | **Self-hosted Overpass only** (no Nominatim — enrichment matches by name+area via Overpass) |
| Dedup | `osmId` exact key **+** soft normalized name+city match for OSM↔2GIS overlap |
| Harvest UX | Preview + configurable limit + explicit confirmation (like `/convert`) |
| Niche map: cafe | `amenity=cafe` only (no restaurant/fast_food) |
| Niche map: beauty | `shop=beauty` + `shop=hairdresser` + `leisure=spa` + `shop=massage` |
| Niche map: gaming | draft (`leisure=adult_gaming_centre`, `amenity=internet_cafe`) — weak OSM coverage |

---

## 1. Infrastructure (Overpass on netcup)

- One `wiktorn/overpass-api` container alongside lead-bot on netcup. Bot reaches it over `127.0.0.1` (`network_mode: host`) or by compose service name — same pattern as the bot → Twenty (`127.0.0.1:4000`) link.
- Initialised from the Geofabrik extract **`kazakhstan-latest.osm.pbf`** (~200 MB). Container builds its DB from the pbf on first start (one-off CPU, tens of minutes; several GB disk).
- **Updates:** manual re-import every few weeks for v1 (business data changes slowly). Auto-diffs are YAGNI for now.
- **Resources:** not an LLM workload — does not hit the netcup memory-bandwidth bottleneck. Disk + one-off build CPU are the cost; runtime queries are light.
- **Config:** new `OVERPASS_URL` in `lead-bot/.env`. Unset → OSM features soft-disable (like Sentry without a DSN); the bot still boots.

## 2. Twenty schema (via Metadata API)

Honor known gotchas: `createOneField` wraps the field in `{field:{…}}`; one field per request; `updateOneField` on a Select must round-trip existing options *with their ids*.

1. **New field `osmId` on `Lead`** (TEXT). Stable key like `node/123456789`. Survives `prospectLink` being swapped from an OSM URL to a 2GIS link. Not a reserved name → no internal rename.
2. **Extend the dynamic `Source` Select** with an `OSM` option (so harvested leads are visibly "auto-harvested, no reviews/rating yet"). 2GIS leads keep their `Source`.
3. **Fields harvest fills from OSM tags:** `Contact`←`phone`/`contact:phone`; `prospectLink`←`openstreetmap.org/...` (temporary, until 2GIS); `Address`(`addressText`)←`addr:*`; `Has website`←presence of `website` tag; `Niche`←tag map (§4); `Language`←heuristic from `name:ru`/`name:kk` or default. `Reviews`/`Rating` stay **empty** (not in OSM; filled later by the manual 2GIS flow).
4. **Not touched (YAGNI):** the relational layer (`Company`/`Opportunity`). Harvest creates flat `Lead`s only; promotion stays with the existing `/convert` once a lead engages.

## 3. Bot components

Fits the existing structure (`app/` services + DI, `handlers/` router-per-feature).

1. **`app/osm.py` — `OverpassClient`** (mirrors how the LLM provider is wrapped):
   - `harvest(niche, area, limit) -> list[OsmPlace]` — builds Overpass-QL (`area[name=...]` + niche tags), parses into an `OsmPlace` dataclass (`osm_id`, `name`, `name_ru`/`kk`, `phone`, `website`, `addr`, `lat`/`lon`, `tags`).
   - `find_by_name(name, area) -> list[OsmPlace]` — enrichment match by name within an area.
   - `OsmPlace.to_lead_fields(options_registry)` — maps to a `Lead` payload, using `OptionsRegistry` to map an OSM tag to the *live* `Niche` option.
   - httpx client on `OVERPASS_URL`, ~30 s timeout + 1 retry (mirrors the LLM 60 s + retry).
2. **`app/osm_tags.py` — `NICHE_TAG_MAP`** — niche→OSM-tag dictionary (§4). A product decision, not config.
3. **Handlers** (mirror `/convert`):
   - `handlers/harvest.py` — `/harvest` command, FSM: niche → city → preview → confirm.
   - Enrichment is **not** a separate command — it hooks into the existing lead-creation flow after LLM extraction.
4. **Gating:** if `OVERPASS_URL` is unset, both routers are not registered and `/harvest` is absent from `set_my_commands`.
5. **`/start`+`/menu` hub:** add a "Добыча лидов" button → `/harvest`.

## 4. `/harvest` flow and niche map

**FSM (aiogram), like `/convert`:**

1. `/harvest` → bot asks niche via inline buttons from *live* `Niche` options (`OptionsRegistry`).
2. City/district as text (`Алматы`, `Алматы Медеуский`) → Overpass `area[name=...]`.
3. Overpass query → parse → dedup by `osmId` (§5) → **preview**: "Found 240, 198 new. Create first 50?" + a 3–5 sample (name, address, has-phone/site). Limit configurable (default 50).
4. Confirm → bulk-create `Lead`s at `Stage=TO_CONTACT`, `Source=OSM`. Progress "created N/N" (Core API creates one record per call).

**`NICHE_TAG_MAP` (decided):**

| Niche | OSM tags |
|---|---|
| кафе | `amenity=cafe` |
| бьюти | `shop=beauty`, `shop=hairdresser`, `leisure=spa`, `shop=massage` |
| гейминг-клуб | `leisure=adult_gaming_centre`, `amenity=internet_cafe` *(draft — weak/inconsistent OSM coverage; expect few results)* |

The map is editable as harvested-lead quality is observed: too broad → pipeline noise; too narrow → missed leads.

## 5. Enrichment, dedup, error handling, testing

**Enrichment** (inside the existing lead-creation flow):
- 0 matches → silently skip.
- 1 confident match → fill **only empty** fields (address, phone, website, coords), show "дополнено из OSM: …" in preview. Never overwrite LLM/2GIS values.
- >1 → do not guess, do not touch.

**Dedup (`osmId` + soft name+city):**
1. **Exact:** before creating a harvest lead, check for a `Lead` with that `osmId` (Core API filter) → skip/update.
2. **Soft cross-source:** no `osmId` but a `Lead` with a matching normalized `name` (lower, punctuation/legal-form stripped) in the same `City` → flag as a possible 2GIS-lead duplicate; offer "attach osmId to existing / create new". This collapses OSM↔2GIS.

**Error handling** (mirrors LLM/qr-survey hardening): Overpass timeout (30 s) + 1 retry → on failure "Overpass недоступен, попробуй позже", handler does not crash; preview + `limit` guards against mass insert; partial bulk success is reported ("created 47/50, 3 errors").

**Testing (TDD, as in the bot repo):**
- Unit: Overpass response parser + `to_lead_fields` (JSON fixtures, no network).
- Unit: name normalization for dedup.
- Mock `OverpassClient` in FSM handler tests.
- One optional manual integration smoke against the live instance.

## Implementation notes

- Clone `lead-bot` via `gh` and verify this design against the real code before building — exact Twenty-client method names and DI wiring may differ from the docs.
- Build order: (1) Overpass infra on netcup; (2) `osmId` field + `Source=OSM` option in Twenty; (3) `OverpassClient` + tests; (4) `/harvest` handler; (5) enrichment hook; (6) menu button + `set_my_commands`.
