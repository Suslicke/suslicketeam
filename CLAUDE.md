# CLAUDE.md

Technical context for AI assistants working in this repository. Read this before making changes.

## Project

**suslicketeam** — a multilingual (RU / KK / EN) marketing & portfolio website for a small web-development studio led by **Andrei Pustovoi** (founder & tech lead). **LIVE in production at https://suslicketeam.com** (Cloudflare). Target: businesses in Kazakhstan (Almaty), CIS, and international.

**Primary goal:** convert visitors into a messenger conversation. The CTA is a WhatsApp / Telegram click (tracked as a conversion). **There is no lead form** (removed — see Conversion). Team = developers only (no designers).

## Tech stack

- **Next.js 15.5.19** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (CSS-first config in `src/app/globals.css`; no `tailwind.config.js`)
- **next-intl** — i18n, `localePrefix: 'always'`, locales `['ru','kk','en']`, **default `en`**
- **next-themes** — dark default + toggle, FOUC-free
- **motion** v12 (`motion/react`) — animations
- **shadcn/ui** primitives (`src/components/ui/`) + `cn` (`src/lib/utils.ts`)
- **zod** (validation, used by the dormant lead form), **react-hook-form** (dormant)
- Analytics: **GA4** + **PostHog** (EU) + **Cloudflare Web Analytics** (auto on prod)
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
- **Prod env vars must be set in Cloudflare** (build-time, since `NEXT_PUBLIC_*` are inlined): `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SITE_URL`. Local values live in `.env.local` (gitignored).
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
`localePrefix:'always'` → every URL prefixed (`/en`, `/ru`, `/kk`). Root `/` redirects by cookie (`NEXT_LOCALE` from the switcher) → `Accept-Language` → **`en`** default. `x-default` hreflang → `/en`. RU/KK visitors still get their language by detection. Nav helpers from `@/i18n/routing`. `siteConfig.defaultLocale` (in `src/lib/config.ts`) is the single source — changing it propagates to routing, sitemap, seo, not-found.

### SEO
`buildMetadata({locale,path,title,description})` in `@/lib/seo` → canonical + hreflang (incl `x-default`) + OG/Twitter. Every page has `generateMetadata`. `sitemap.ts` enumerates all routes × locales. JSON-LD in `@/lib/structured-data.ts` (Organization, **LocalBusiness with `addressLocality:"Алматы"`, areaServed Almaty+Kazakhstan**, Person=Andrei Pustovoi, WebSite, BreadcrumbList, Service, CreativeWork, FAQPage) via `<JsonLd>` (escapes `<`). Dynamic OG images via `next/og` (work on Workers). **Geo keywords** (Almaty/Kazakhstan) are in home/services/contact titles+meta+hero eyebrow (not in H1s). `/privacy`, `/terms`, `/refund` legal pages exist (indexable, in footer + sitemap). Policy copy lives in `messages.*.{privacy,terms,refund}` (flat title/body sections rendered by `SECTION_KEYS` in each `page.tsx`); protective-but-lawful (liability capped to amount paid, "as is" warranties, processor list, data-subject rights, "statutory rights prevail" in refund). Governing law is **neutralised** site-wide (deferred to the per-project contract, not Kazakhstan) because the registered entity is a Georgian IE; legal requisites (IE ANDREI PUSTOVOI, ID 305638389, Tbilisi) sit in `terms.requisites` + footer + Org schema `legalName`; current location (Almaty) is a Contact-page block. Still template-grade — lawyer review pending. Favicon/icons are the custom suslicketeam circular logo (`src/app/{favicon.ico,icon.png,apple-icon.png}` + `public/icon.png`, transparent round mask).

### Analytics & conversion
- `src/lib/analytics.ts` `trackEvent(name, params)` → both `window.gtag` and `window.posthog.capture`, defensive/SSR-safe.
- Providers in `src/components/analytics/`, gated on env vars, **consent-gated**: GA Consent Mode v2 (denied default, inline before gtag lib); PostHog inits `opt_out_capturing_by_default:true` + **`person_profiles:'always'`** (a persona profile per consented visitor — use PostHog Persons/Cohorts/session replay). PostHog SPA `$pageview` fired manually on route change.
- **UTM:** `utm.ts` (first-touch in sessionStorage `sl_utm`); `utm-capture.tsx` persists + dispatches `sl:utm`. `MessengerCTA` (`src/components/messenger-cta.tsx`) reads UTM reactively and rebuilds the URL at click time; event `lead_messenger_click` (channel + page + UTM). **Both WhatsApp AND Telegram CTAs prefill text** (`wa.me/<num>?text=` and `t.me/<user>?text=`) with the greeting (`suslicketeam.com/<path>` + UTM) from `messenger.ts`.
- **No lead form / no /api lead delivery.** The form was removed from the UI (messenger-only); `lead-form.tsx`, `src/app/api/lead/route.ts`, `lead-schema.ts`, `lead-format.ts` remain dormant (re-enable by mounting `<LeadForm/>` + configuring a sink). No Telegram bot.

### Content model
`src/content/cases.ts` — **12 cases** (`slug,url,tags,featured,metrics,year,nda?`): suslicke, animeenigma, xaid, python-guide, web-interview, loyrush, exchange-bridge, ai-diagnostic, **nda-furniture** (NDA), **scioffice**, **nda-school** (NDA), **admp**. NDA cases: `url:""`, `nda:true`, "Под NDA" badge instead of live link, excluded from live-projects grid + marquee (`getPublicCases()`). Per-case copy in `messages.*.cases.<slug>` (incl. an `approach` paragraph + a shared `caseDetail.process` section on detail pages). `src/content/services.ts` — 5 services. Service-detail "related cases" use the explicit `RELEVANT_CASES` slug map in `services/[slug]/page.tsx`. Founder photo: `public/founder.jpg` (cropped head-and-shoulders) on `/about`.

## Business facts (kept consistent across site + messengers)
- Founder: Andrei Pustovoi (Андрей Пустовой), 5+ years in development. WhatsApp `+77066998879`, Telegram `@suslicketeam`.
- Hours: **Mon–Sat 09:00–21:00 (GMT+5)**. Reply within an hour in hours; in-person meetings possible in Almaty.
- Code ownership transfers to client on completion; small removable footer credit. Fixed price/timeline before start.

## Docs
- `docs/plans/2026-06-08-suslicketeam-website-{design,implementation}.md` — design + build plan.
- `docs/launch-checklist.md` — go-live steps.
- `docs/whatsapp-messages.md` — WhatsApp + Telegram greeting/away/quick-replies (RU/EN/KK).
- `docs/utm-links.md` — ready UTM links (Instagram, LinkedIn, DM, templates).

## Current status (2026-06)
LIVE on Cloudflare. 12 cases (2 NDA), pages in RU/KK/EN, English default. Analytics live (GA4 `G-0GNRGF8369` + PostHog EU; ensure keys are set in Cloudflare prod env). Custom logo favicon. Owner has set up Google Search Console; Google Business Profile in progress. **Open / non-code TODOs:** enable Cloudflare "Always Use HTTPS", configure `www` redirect, finish GBP, verify real Core Web Vitals via PageSpeed Insights, have a lawyer review `/privacy` + `/terms` + `/refund` (template-grade), add real testimonials if desired.
