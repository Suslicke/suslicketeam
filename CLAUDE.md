# CLAUDE.md

Technical context for AI assistants working in this repository. Read this before making changes.

## Project

**suslicketeam** — a multilingual (RU / KK / EN) marketing & portfolio website for a small **development studio** led by **Andrei Pustovoi** (founder & tech lead). **LIVE in production at https://suslicketeam.com** (Cloudflare). Target: businesses in Kazakhstan (Almaty), CIS, and international. **Positioning: "development studio" (web + mobile + AI — deliberately NOT "web studio"/web-only); hero eyebrow = "Studio разработки / Development studio".** **Code-first** (no designers, no static design mockups): process step + case copy say "prototype in code, align on the live version" — keep that framing.

**Primary goal:** convert visitors into a messenger conversation. The CTA is a WhatsApp / Telegram click (tracked as a conversion). **There is no lead form** (removed — see Conversion). Team = developers only (no designers).

## Tech stack

- **Next.js 15.5.19** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`; no `tailwind.config.js`)
- **next-intl** — i18n, `localePrefix: 'always'`, locales `['ru','kk','en']`, **default `en`**
- **next-themes** — dark default + toggle, FOUC-free
- **motion** v12 (`motion/react`) — animations
- **shadcn/ui** primitives (`src/components/ui/`) + `cn` (`src/lib/utils.ts`)
- **zod** (validation, used by the dormant lead form), **react-hook-form** (dormant)
- Analytics: **GA4** + **PostHog** (EU) + **Cloudflare Web Analytics** (auto on prod) + **Yandex Metrika** (KZ audience — Yandex ~25–28% of KZ search; consent-gated)
- **pnpm 11.5.2** (pinned via `packageManager`; needs **Node ≥ 22.13**). Corepack.
- Deploy: **Cloudflare Workers** via **`@opennextjs/cloudflare`** (`open-next.config.ts`, `wrangler.jsonc`)
- Stack the studio advertises (About page `STACK_GROUPS` + FAQ): Web (Next.js, Nuxt, React, Vue, TypeScript, Tailwind), Backend (Python, Golang), Mobile (Flutter, React Native, Swift), AI/automation (AI/LLM, n8n, AI-agent pipelines).

## Commands

```bash
pnpm dev          # next dev --turbopack (http://localhost:3000)
pnpm build        # next build --turbopack (must pass before committing)
pnpm start        # production server (use to test /api routes reliably)
pnpm lint / typecheck / test          # eslint / tsc --noEmit / vitest run
pnpm test:e2e     # playwright (see note)
pnpm preview / deploy                 # opennextjs-cloudflare build + preview/deploy
```

**Gate before any commit:** `pnpm typecheck && pnpm test && pnpm build` green.

### Dev-server gotcha (IMPORTANT)
The Turbopack dev server **wedges** after a series of file edits (HTTP 500 on all routes, `ENOENT _buildManifest.js.tmp` in the log). NOT a code bug — prod builds stay green. Fix: kill `next dev`, `rm -rf .next`, restart. Verify behavior against `pnpm build`/`pnpm start`, not the dev server.

### Playwright note
`playwright.config.ts` honors `PLAYWRIGHT_BASE_URL`. If a stale dev server holds :3000, run e2e against a fresh `pnpm start` on a spare port via that env var, `--workers=1`.

## Deployment (Cloudflare, already live)

- GitHub remote: `origin` → `github.com/Suslicke/suslicketeam`. Cloudflare **Workers Builds** auto-deploys on push to `main`.
- **Cloudflare build settings (correct values):** Build command `npx @opennextjs/cloudflare build`; Deploy command `npx @opennextjs/cloudflare deploy`. (NOT `pnpm run build` / `wrangler deploy`.)
- `package.json` has `packageManager: "pnpm@11.5.2"`; `pnpm-workspace.yaml` includes `packages: []` (pnpm 10 compat) + `allowBuilds`. GitHub Actions CI uses **Node 22**.
- **Prod env vars must be set in Cloudflare** (build-time, since `NEXT_PUBLIC_*` are inlined): `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SITE_URL`, **`NEXT_PUBLIC_YANDEX_METRIKA_ID`** (Yandex Metrika counter; without it the Metrika tag no-ops on prod). Local values live in `.env.local` (gitignored).
- **Runtime server secrets (e.g. `QR_SURVEY_WEBHOOK_URL`, `QR_SURVEY_TOKEN`)** are NOT the same as build-time `NEXT_PUBLIC_*`. Two gotchas, both bit us: (1) read them in route handlers via **`getCloudflareContext().env`**, NOT `process.env` (OpenNext doesn't populate `process.env` from runtime bindings; we keep a `process.env` fallback only for local `next start`). (2) `wrangler.jsonc` has **`"keep_vars": true`** — without it, every `opennextjs-cloudflare deploy` (Workers Builds) **wipes** dashboard-set Variables/Secrets. Set such secrets via **`npx wrangler secret put NAME`** (binds directly to the live Worker) — adding them in the dashboard "Variables and secrets" did NOT apply to the live Workers-Builds worker (gave `reason:"no_env"`); only `wrangler secret put` worked. The `/api/qr-survey` POST returns a coarse `reason` (`no_env` vs `sink_*`) to diagnose env-vs-webhook failures. (`QR_SURVEY_*` were confirmed live in prod via this.)
- `next.config.ts`: **`images.unoptimized: true`** — the Cloudflare/OpenNext runtime has no `/_next/image` optimizer (it 400s). Serve pre-sized images as-is.

## Conventions (follow these)

- **No hardcoded user-facing strings in TSX.** All copy in `messages/{ru,kk,en}.json` via `useTranslations`/`getTranslations`. Tech/brand labels in structural data are the exception.
- **i18n parity is mandatory.** ru/kk/en must have an identical flattened key set; verify after editing messages. RU is authoritative; KK/EN are real translations.
- **Server Components by default;** `"use client"` only where needed.
- **Commits:** Conventional Commits. **Plain `git commit`** — author is `Andrei Pustovoi <suslicketeam@gmail.com>` (git config). **Do NOT add a `Co-Authored-By` trailer** (history was rewritten to remove all Claude trailers; keep it clean).
- **Honesty in copy:** never fabricate metrics/quotes. Case copy is grounded in the real live sites (fetch them if unsure). NDA cases stay vague.
- Keep Lighthouse ≥ 95. Animate only transform/opacity; respect `prefers-reduced-motion`; lazy-mount heavy layers so hero text stays the server-rendered LCP.

## Key subsystems

### i18n (default locale = en)
`localePrefix:'always'` → every URL prefixed (`/en`, `/ru`, `/kk`). Root `/` redirects by cookie (`NEXT_LOCALE` from the switcher) → `Accept-Language` → **`en`** default. `x-default` hreflang → `/en`. RU/KK visitors still get their language by detection. Nav helpers from `@/i18n/routing`. `siteConfig.defaultLocale` (in `src/lib/config.ts`) is the single source — changing it propagates to routing, sitemap, seo, not-found. **`src/middleware.ts`** wraps the next-intl middleware: a `SHORT_LINKS` map handles locale-less **offline merch short-links** (e.g. `/card`) that 307-redirect to `/?utm_…` (then next-intl localizes, preserving query), so printed cards/t-shirts land on the homepage with campaign UTMs for first-touch attribution. Add new merch links to that map. (Runs at the Cloudflare edge since the app is a Worker; chosen over Cloudflare Bulk Redirects to keep it in-git/tested.)

### SEO
`buildMetadata({locale,path,title,description})` in `@/lib/seo` → canonical + hreflang (incl `x-default`) + OG/Twitter. Every page has `generateMetadata`. `sitemap.ts` enumerates all routes × locales. JSON-LD in `@/lib/structured-data.ts` (Organization, **LocalBusiness with `addressLocality:"Алматы"`, areaServed Almaty+Kazakhstan**, Person=Andrei Pustovoi, WebSite, BreadcrumbList, Service, CreativeWork, FAQPage) via `<JsonLd>` (escapes `<`). Dynamic OG images via `next/og` (work on Workers). **Geo keywords** (Almaty/Kazakhstan) are in home/services/contact titles+meta+hero eyebrow (not in H1s). `/privacy`, `/terms`, `/refund` legal pages exist (indexable, in footer + sitemap). Policy copy lives in `messages.*.{privacy,terms,refund}` (flat title/body sections rendered by `SECTION_KEYS` in each `page.tsx`); protective-but-lawful (acceptance/browsewrap clause, B2B-not-consumer `audience`, liability capped to amount paid, "as is" warranties, client indemnity in `clientDuties`, force-majeure, processor list, retention periods, GDPR supervisory-authority right, "statutory rights prevail" in refund). **Governing law:** the website/policies themselves are governed by **Georgia** (place of registration) in `terms.sections.law`; each paid **project's** law stays deferred to its separate contract (neutral). **GE-registration vs KZ-presence distinction (deliberate, keep it):** the entity is a **Georgian IE** (requisites in `terms.requisites` + footer + Org-schema `legalName`/`identifier`/Tbilisi `address`); Almaty is a **personal presence, not a registered place of business** (Contact-page "Where we are" block + `LocalBusiness` schema = service area only, never a KZ registered address). Still template-grade — lawyer review pending. Favicon/icons are the custom suslicketeam circular logo (`src/app/{favicon.ico,icon.png,apple-icon.png}` + `public/icon.png`, transparent round mask); `src/app/manifest.ts` references favicon.ico + the 512px `/icon.png`. **Organization `sameAs`** lists Instagram (`/suslicketeam`) + LinkedIn personal (`/in/suslicke`) + Telegram + WhatsApp — kept in sync with the **footer social links** (`SOCIAL_ITEMS` in `site-footer.tsx`); update both together. (Brand-SERP note: a young site may surface a sub-page for the brand query and show no favicon yet — both resolve with crawl age + GSC Request Indexing, not code.)

### Analytics & conversion
- `src/lib/analytics.ts` `trackEvent(name, params)` → `window.gtag`, `window.posthog.capture`, **and `window.ym` `reachGoal`** (Yandex Metrika), defensive/SSR-safe.
- Providers in `src/components/analytics/`, gated on env vars, **consent-gated**: GA Consent Mode v2 (denied default, inline before gtag lib); PostHog inits `opt_out_capturing_by_default:true` + **`person_profiles:'always'`** (a persona profile per consented visitor — use PostHog Persons/Cohorts/session replay). PostHog SPA `$pageview` fired manually on route change.
- **Yandex Metrika** (`src/components/analytics/yandex-metrika.tsx`, mounted in layout): Metrika has **no native consent mode**, so the tag is **not loaded at all until consent** — `ConsentBanner` now dispatches an `sl:consent` CustomEvent on grant, and the component (also reading stored `sl_consent`) loads the counter then, so `webvisor:true`/`clickmap` session recording is consent-gated by construction. Gated on `NEXT_PUBLIC_YANDEX_METRIKA_ID`; the stock `<noscript>` pixel is omitted (can't respect consent). Disclosed in `messages.*.privacy` (Metrika + Webvisor + Yandex as processor).
- **UTM:** `utm.ts` (first-touch in sessionStorage `sl_utm`); `utm-capture.tsx` persists + dispatches `sl:utm`. `MessengerCTA` (`src/components/messenger-cta.tsx`) reads UTM reactively and rebuilds the URL at click time; event `lead_messenger_click` (channel + page + UTM). **Both WhatsApp AND Telegram CTAs prefill text** (`wa.me/<num>?text=` and `t.me/<user>?text=`) with the greeting (`suslicketeam.com/<path>` + UTM) from `messenger.ts`.
- **No lead form / no /api lead delivery.** The form was removed from the UI (messenger-only); `lead-form.tsx`, `src/app/api/lead/route.ts`, `lead-schema.ts`, `lead-format.ts` remain dormant (re-enable by mounting `<LeadForm/>` + configuring a sink). No Telegram bot.
- **Offline short-links + shirt-QR survey (LIVE, verified `delivered:true` in prod).** `src/middleware.ts` `SHORT_LINKS` maps `/card` → 307 to home with `utm_source=shirt&utm_medium=offline&utm_campaign=networking` (the printed shirt QR encodes `suslicketeam.com/card`; QR vector SVGs are in the untracked `qr/` folder). `QrWelcome` (`src/components/qr-welcome.tsx`, mounted in layout, radix Dialog) shows a one-time branded thank-you + "where did you find me?" survey **only** to first-touch `utm_source=shirt` visitors (gated via `sl_utm`, once per browser via `localStorage sl_qr_survey`). Answer options `met / event / friend / passing / other` (NOT a tautological "shirt" option; free-text **required** for `other`). Modal has an in-panel RU/KK/EN switcher, is scrollable (`max-h-[85dvh]` for the on-screen keyboard), and closes **only** via ✕ / Skip — outside-click & Esc are `preventDefault`'d so accepting the cookie banner (which sits outside the dialog) doesn't dismiss it. On submit: `trackEvent("qr_survey_response", …)` (consent-gated PostHog/GA) **and** POST to `src/app/api/qr-survey/route.ts` → Google Sheet via `QR_SURVEY_WEBHOOK_URL` (server-side, consent-independent). **Route hardening:** same-origin gate, shared `QR_SURVEY_TOKEN` (also verified in the Apps Script `doPost`), spreadsheet formula-injection sanitize, 10s sink timeout (Apps Script cold-starts are slow), and a coarse `reason` field (`no_env`/`sink_*`) in the response for diagnosing. Copy in `messages.*.qrWelcome`. **Secrets are set via `wrangler secret put` (NOT the dashboard — see Deployment).**

### Content model
`src/content/cases.ts` — **12 cases** (`slug,url,tags,featured,metrics,year,nda?`): suslicke, animeenigma, xaid, python-guide, web-interview, loyrush, exchange-bridge, ai-diagnostic, **nda-furniture** (NDA), **scioffice**, **nda-school** (NDA), **admp**. NDA cases: `url:""`, `nda:true`, "Под NDA" badge instead of live link, excluded from live-projects grid + marquee (`getPublicCases()`). Per-case copy in `messages.*.cases.<slug>` (incl. an `approach` paragraph + a shared `caseDetail.process` section on detail pages). `src/content/services.ts` — 5 services. Service-detail "related cases" use the explicit `RELEVANT_CASES` slug map in `services/[slug]/page.tsx`. Founder photo: `public/founder.jpg` (cropped head-and-shoulders) on `/about`.

## Business facts (kept consistent across site + messengers)
- Founder: Andrei Pustovoi (Андрей Пустовой), 5+ years in development. WhatsApp `+77066998879`, Telegram `@suslicketeam`.
- Hours: **Mon–Sat 09:00–21:00 (GMT+5)**. Reply within an hour in hours; in-person meetings possible in Almaty.
- Code ownership transfers to client on completion; small removable footer credit. Fixed price/timeline before start.

## CRM & sales ops (Twenty — self-hosted, **separate infra, not this repo**)
The sales pipeline lives in **Twenty CRM** (open-source, self-hosted), **LIVE at https://crm.suslicketeam.com**. This is **not** part of the Next.js app and **not** on Cloudflare — it runs on the **netcup VPS** (SSH alias `netcup`, Ubuntu 24.04). The website (Cloudflare Workers) and the CRM (VPS) are independent.

- **Why Twenty:** sales start as **manual WhatsApp/Telegram** chats (no paid WhatsApp Cloud API), so a pipeline/records CRM fits better than an omnichannel inbox. **Chatwoot** was evaluated (unifies WA/TG/IG inboxes) but deferred — it only pays off once you pay for WhatsApp Cloud API; see `docs/chatwoot-vps-deploy.md`. Messengers stay manual; outcomes are logged into Twenty by hand.
- **Deploy:** `/opt/twenty` (`docker-compose.yml` + `docker-compose.override.yml` + `.env`). Stack = `server`+`worker`+`db`(postgres16)+`redis`, bound to **`127.0.0.1:4000`** (not public). nginx vhost `/etc/nginx/conf.d/crm.suslicketeam.com.conf` reverse-proxies it (WebSocket headers). **SSL reuses the existing wildcard `*.suslicketeam.com` cert** at `/etc/nginx/ssl/suslicketeam.com/` — **no certbot needed** (the cert already covers any subdomain). `restart: always` (survives reboot). Secrets (`ENCRYPTION_KEY`, PG password) in `/opt/twenty/.env` (chmod 600).
- **Signup is disabled** (invite-only). Done via **env-only config mode** in the override: `IS_CONFIG_VARIABLES_IN_DB_ENABLED=false` + `IS_SIGN_UP_ENABLED=false`. Consequence: config is `.env`/override-driven and the in-app **admin panel shows config read-only**.
- **Data model — custom object `Lead`/`Leads`** (12 fields), built **via the API**. Fields: `Stage`(Select: `TO_CONTACT→CONTACTED→REPLIED→QUALIFIED→PROPOSAL→WON/LOST`), `Niche`, `City`, `Contact`, `Link`, `Has website`, `Source`, `Deal value`, `Lost reason`, `Next step`, `Next step date`, `Notes`. **Gotcha:** the `Link` field's internal API name is **`prospectLink`** (`link` is reserved). Kanban view ("Pipeline") is grouped by `Stage` (created in the UI).
- **API:** Twenty has two — **Metadata API** (`/metadata`) for schema (create objects/fields), **Core API** (`/rest` or `/graphql`) for records. Auth = Bearer **API key** from Settings → API & Webhooks. The key is stored locally as **`.twenty_key` (gitignored; `*.key` too — NEVER commit, never echo it)**. To act on the CRM via API, read the key and run from the server (`ssh netcup`), passing it via stdin, not argv.
- **API gotchas (learned the hard way):** (1) Docker `.env` does **not** inject vars into the container — `.env` only does compose interpolation; container env must be in the service `environment:`/override. (2) Metadata API forbids calling the same root resolver (e.g. `createOneField`) twice per GraphQL document → **one field per request**. (3) some field names are reserved (`link`). (4) for Select fields, record payloads use the option **`value`** (e.g. `"CONTACTED"`), not the label. (5) **This dev sandbox can't reach the VPS over HTTPS** (egress blocked, `curl` → `000`) — but SSH works; run all CRM API/admin via `ssh netcup` hitting `127.0.0.1:4000` or the domain from the box itself.
- **Sales-ops docs:** `lead-tracking-system.md` (funnel/tooling/strategy), `outreach-playbook.md` + `outreach-niche-kits.md` (RU/KK/EN templates), `twenty-leads-setup.md` (object/fields/Kanban + capture workflow), `leads-twenty-import.csv` (seed + future bulk import), `chatwoot-vps-deploy.md` (the alternative we didn't take, + comparison).

## Docs
- `docs/plans/2026-06-08-suslicketeam-website-{design,implementation}.md` — design + build plan.
- `docs/launch-checklist.md` — go-live steps.
- `docs/whatsapp-messages.md` — WhatsApp + Telegram greeting/away/quick-replies (RU/EN/KK).
- `docs/utm-links.md` — ready UTM links (Instagram, LinkedIn, DM, templates, **outreach** `utm_medium=outreach` set).
- `docs/outreach-playbook.md` — outbound WhatsApp/DM playbook (RU/EN/KK): KZ market framing (Google+Yandex, 2GIS, owned-vs-rented channels), benefit-not-tech selling, research-backed tactics (free-audit foot-in-the-door, "+1 channel"), closing to a call/meeting, follow-up cadence, **niche-specific angles** (cafe/beauty/renovation/legal/detailing). Counterpart to the inbound `whatsapp-messages.md`.
- `docs/outreach-niche-kits.md` — per-niche outreach kits (cafe / beauty / gaming clubs): ICP, 2GIS qualification checklist, pain→benefit, ready first-message variations.
- `docs/lead-tracking-system.md` — lead/sales system design: funnel, the lead record model, tool comparison (Sheets vs self-hosted CRMs), business-finding methods, stats, roadmap.
- `docs/twenty-leads-setup.md` — Twenty `Leads` object + Kanban setup **and the "found a prospect → capture it" workflow** (English, with CRM glossary).
- `docs/leads-twenty-import.csv` — CSV seed for the `Leads` object (also the format for future bulk imports). The 5 sample rows are **already loaded via API** — do not re-import them.
- `docs/chatwoot-vps-deploy.md` — Chatwoot VPS deploy guide + Chatwoot-vs-Twenty comparison (the path not taken).

## Current status (2026-06)
LIVE on Cloudflare. 12 cases (2 NDA), pages in RU/KK/EN, English default. Positioned as a **development studio** (web/mobile/AI), code-first copy. Analytics live (GA4 `G-0GNRGF8369` + PostHog EU + **Yandex Metrika `109741083`**, all consent-gated; ensure keys — incl. `NEXT_PUBLIC_YANDEX_METRIKA_ID` — are set in Cloudflare prod env). Custom logo favicon; Instagram/LinkedIn in footer + Org `sameAs`. **Shirt-QR welcome survey LIVE** — writes to a Google Sheet (Apps Script webhook) via `wrangler secret`-set `QR_SURVEY_WEBHOOK_URL`/`QR_SURVEY_TOKEN`; `keep_vars:true` keeps them across deploys. Owner has set up Google Search Console; Google Business Profile in progress. **CRM live (separate infra):** Twenty self-hosted at `crm.suslicketeam.com` on the **netcup VPS** (not Cloudflare) — custom `Lead` object + Kanban pipeline, signup disabled, sales worked manually in WhatsApp/Telegram and logged into Twenty; see the **CRM & sales ops** section. **Open / non-code TODOs:** enable Cloudflare "Always Use HTTPS", configure `www` redirect, finish GBP, verify real Core Web Vitals via PageSpeed Insights, have a lawyer review `/privacy` + `/terms` + `/refund` (template-grade), add real testimonials if desired.
