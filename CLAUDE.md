# CLAUDE.md

Technical context for AI assistants working in this repository. Read this before making changes.

## Project

**suslicketeam** — a multilingual (RU / KK / EN) marketing & portfolio website for a small web-development studio led by **Andrei Pustovoi** (founder & tech lead), targeting businesses in Kazakhstan, the CIS, and international clients.

**Primary goal:** convert visitors into a messenger conversation. The main CTA is a WhatsApp / Telegram click (tracked as a conversion). A lead form is the secondary channel.

Positioning: hybrid — the studio brand `suslicketeam` is the face, the founder is the personal point of contact. Team = developers only (no designers).

## Tech stack

- **Next.js 15.5.19** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first config in `src/app/globals.css` via `@theme`; there is no `tailwind.config.js`)
- **next-intl** — i18n, `localePrefix: 'always'`, locales `['ru','kk','en']`, default `ru`
- **next-themes** — dark default + toggle, FOUC-free
- **motion** v12 (the successor to framer-motion; import from `motion/react`)
- **shadcn/ui** primitives (`src/components/ui/`) + `cn` helper (`src/lib/utils.ts`)
- **react-hook-form** + **zod** (+ `@hookform/resolvers`) for the lead form
- **lucide-react** icons
- Analytics: **GA4** (gtag) + **PostHog** (`posthog-js`, EU) + **Cloudflare Web Analytics**
- **pnpm** (v11, via corepack) — package manager. Node ≥ 20.
- Deployment target: **Cloudflare Workers** via **`@opennextjs/cloudflare`** (`open-next.config.ts`, `wrangler.jsonc`)

## Commands

```bash
pnpm dev          # next dev --turbopack (http://localhost:3000)
pnpm build        # next build --turbopack  (must pass before committing)
pnpm start        # production server (use to test /api routes reliably)
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit  (must pass)
pnpm test         # vitest run (unit)
pnpm test:e2e     # playwright (needs a dev/prod server; see note below)
pnpm preview      # opennextjs-cloudflare build + local Workers preview
pnpm deploy       # opennextjs-cloudflare build + deploy (needs CF creds)
```

**Gate before any commit:** `pnpm typecheck && pnpm test && pnpm build` must all be green.

### Dev-server gotcha (important)
The Turbopack dev server **wedges** after a series of file edits (returns HTTP 500 on all routes, logs `ENOENT _buildManifest.js.tmp`). This is NOT a code bug — production builds stay green. Fix: kill the dev process, `rm -rf .next`, restart `pnpm dev`. Always verify route behavior against `pnpm build` (or `pnpm start`) when in doubt — not the dev server.

### Playwright note
`playwright.config.ts` uses `reuseExistingServer`. A stale `pnpm dev` on :3000 can serve old content / 500s to the test run. Set `PLAYWRIGHT_BASE_URL` to point e2e at a fresh `pnpm start` on a spare port when a dev server is already holding :3000. Run with `--workers=1` locally for stability.

## Directory map

```
src/
  app/
    [locale]/
      layout.tsx                 # renders <html>, providers, header/footer, JSON-LD, analytics, sticky CTA
      page.tsx                   # home: hero → marquee(logos) → services → cases → process → why-us → live-projects → faq → final CTA
      about/page.tsx             # founder photo, intro, stack groups, trust facts (count-up), team
      contact/page.tsx           # messenger CTAs + <LeadForm/>
      services/page.tsx          # services overview + "any technical project" block
      services/[slug]/page.tsx   # service detail; RELEVANT_CASES map drives "related cases"
      cases/page.tsx             # full case grid (all cases incl. NDA)
      cases/[slug]/page.tsx      # case detail; process + approach sections; NDA → no live link
    api/lead/route.ts            # POST lead webhook (force-dynamic)
    sitemap.ts robots.ts manifest.ts opengraph-image lives under [locale]/
  components/
    analytics/                   # posthog-provider, ga-scripts, cloudflare-analytics, consent-banner, utm-capture
    hero/                        # constellation (Canvas 2D) + aurora (CSS gradient), both lazy ssr:false
    motion/                      # reveal, stagger, count-up, cursor-glow, cta-glow
    sections/                    # all home/detail sections + section-heading, service-card, case-card, marquee, page-cta
    ui/                          # shadcn primitives
    messenger-cta.tsx            # THE conversion component (wa.me/t.me + lead_messenger_click)
    site-header.tsx site-footer.tsx language-switcher.tsx theme-toggle.tsx json-ld.tsx
  content/
    services.ts                  # 5 services (structural: slug, icon, order, featured)
    cases.ts                     # 12 cases (structural) + CASE_DISPLAY_NAMES + nda flag
  i18n/ routing.ts request.ts    # next-intl setup
  lib/
    config.ts                    # siteConfig (url, whatsapp, telegram, locales) + Locale type
    utm.ts messenger.ts analytics.ts lead-schema.ts lead-format.ts   # pure logic, unit-tested (TDD)
    content.ts seo.ts structured-data.ts utils.ts
    __tests__/                   # vitest specs for the lib/ logic
  middleware.ts                  # next-intl middleware
messages/{ru,kk,en}.json         # ALL user-facing copy
e2e/                             # playwright specs
```

## Conventions (follow these)

- **No hardcoded user-facing strings in TSX.** All copy lives in `messages/{ru,kk,en}.json` and is read via `useTranslations` / `getTranslations`. Tech/brand names in structural data (tags, stack labels) are the exception (rendered verbatim).
- **i18n parity is mandatory.** `ru.json`, `kk.json`, `en.json` must have an identical key set. After editing messages, verify parity (flatten keys of all three and diff). A missing key in one locale renders a raw key or throws. RU is the authoritative copy; KK and EN are real translations (not machine-stiff).
- **Server Components by default.** Use `"use client"` only where needed (theme toggle, language switcher, motion wrappers, canvas/aurora, forms, analytics providers, MessengerCTA). Server pages use `setRequestLocale(locale)` + `getTranslations`.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `content:`, `chore:`, `docs:`). End every commit message with:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **Honesty in portfolio copy:** never fabricate metrics, uptime, user counts, or client quotes. Case copy is grounded in the real live sites (fetch them if unsure). NDA cases stay intentionally vague.
- Keep Lighthouse ≥ 95 (perf/a11y/best-practices/seo). Animate only `transform`/`opacity`; respect `prefers-reduced-motion`; lazy-mount heavy/animated layers so hero text stays the server-rendered LCP.

## Key subsystems

### i18n
`localePrefix: 'always'` → every URL is prefixed (`/ru`, `/kk`, `/en`); `/` redirects by `Accept-Language`. Navigation helpers (`Link`, `useRouter`, `usePathname`, `redirect`) are exported from `@/i18n/routing` — use those, not `next/link`/`next/navigation`, for locale-aware routing.

### SEO
`buildMetadata({locale, path, title, description})` in `src/lib/seo.ts` → canonical + full `hreflang` (`alternates.languages` incl. `x-default`) + OG/Twitter. Every page has its own `generateMetadata`. `sitemap.ts` enumerates all routes × locales (case slugs derived from `content.ts`) with `x-default`. JSON-LD builders in `src/lib/structured-data.ts` (Organization, LocalBusiness KZ, Person=Andrei Pustovoi, WebSite, BreadcrumbList, Service, CreativeWork, FAQPage) rendered via `<JsonLd>` (escapes `<` to avoid `</script>` breakout). Dynamic OG images via `next/og` (verified to work under the Cloudflare Workers runtime).

### Analytics & conversion tracking
- `src/lib/analytics.ts` → `trackEvent(name, params)` dispatches to BOTH `window.gtag` and `window.posthog.capture`, defensively (never throws; SSR-safe). Use it for all events.
- Providers in `src/components/analytics/`. All are **gated on their env var** and no-op gracefully when unset. **Consent-gated:** GA uses Consent Mode v2 (denied by default, inline `consent default` runs before the gtag lib); PostHog inits with `opt_out_capturing_by_default: true` and only opts in after the user accepts the cookie banner. Cloudflare beacon is cookieless.
- PostHog SPA pageviews: `capture_pageview:false` + a manual `$pageview` fired on `usePathname`/`useSearchParams` change (inside `<Suspense>`).
- **UTM:** `utm.ts` (`parseUtm`/`persistUtm` first-touch in sessionStorage `sl_utm`/`getStoredUtm`). `utm-capture.tsx` persists on mount and dispatches a `sl:utm` window event. `MessengerCTA` reads stored UTM reactively (state + `sl:utm` listener) AND rebuilds the URL at click-time so the messenger link always carries UTM + page; conversion event is `lead_messenger_click` (with `transport_type:'beacon'`). The WhatsApp greeting (`messenger.ts`) embeds `suslicketeam.com/<path>` + UTM summary.

### Lead form & webhook
`src/components/lead-form.tsx` (RHF + `zodResolver(leadSchema)`, honeypot field `company`) → POST `/api/lead`. `src/app/api/lead/route.ts`: honeypot check before schema validation (bot → silent 200), then `leadSchema.safeParse` (invalid → 400 `{error:'invalid'}`, no internals echoed), in-memory per-IP rate limit (best-effort; move to KV for prod), then best-effort fan-out via `Promise.allSettled` with 5s timeouts:
- Telegram bot (`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`) — `formatTelegramMessage` (plain text, injection-safe).
- Spreadsheet webhook (`LEADS_SHEET_WEBHOOK_URL`).
With no sinks configured it returns `{ok:true, delivered:false}` (success UI shows, but `lead_form_submit` only fires when `delivered !== false`). **Until a sink is configured, leads are NOT delivered anywhere.**

### Content model
`src/content/cases.ts` — `CaseItem { slug, url, tags, featured, metrics, year, nda? }`. NDA cases have `url:""`, `nda:true`, render a "Под NDA" badge instead of a live link, and are **excluded from the live-projects grid + marquee** (which are about "open and verify") via `getPublicCases()`. `getCases()` returns all. Per-case copy (title/summary/task/solution/result/approach/metrics/technologies) lives in `messages.*.cases.<slug>`. Service detail "related cases" use the explicit `RELEVANT_CASES` slug map in `services/[slug]/page.tsx` (not tag overlap).

## Environment variables

Public (inlined at build/dev start — restart dev after changing) — defaults exist in `config.ts`:
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` (77066998879), `NEXT_PUBLIC_TELEGRAM_USERNAME` (suslicketeam), `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY` (the `phc_` project token — NOT `..._PROJECT_TOKEN`), `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_CF_BEACON_TOKEN`.

Server-only (never `NEXT_PUBLIC_`): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `LEADS_SHEET_WEBHOOK_URL`.

`.env.local` is gitignored. `.env.example` documents the keys. For production these must be set in Cloudflare (public vars in project env; secrets via `wrangler secret put`). See `docs/launch-checklist.md`.

## Docs

- `docs/plans/2026-06-08-suslicketeam-website-design.md` — the design/decisions.
- `docs/plans/2026-06-08-suslicketeam-website-implementation.md` — the build plan.
- `docs/launch-checklist.md` — everything required to go live (DNS, secrets, GA4 conversions, PostHog, Search Console, etc.).

## Current status

MVP is built and on `main`. 12 portfolio cases (incl. 2 NDA), all pages in RU/KK/EN, analytics wired (GA4 + PostHog live in local env). Tests green. **Not deployed yet** (needs Cloudflare creds). **Lead delivery not configured yet** (needs the Telegram bot token) — this is the last blocker before a real launch.
