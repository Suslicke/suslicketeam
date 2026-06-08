# suslicketeam — website

Marketing & portfolio site for the **suslicketeam** web studio. Trilingual
(Russian / Kazakh / English), dark-themed, SEO- and performance-focused, with a
lead-capture form that fans out to Telegram and a Google Sheet. Deployed to
**Cloudflare Workers** via the OpenNext adapter.

## Stack

| Area            | Choice                                                            |
| --------------- | ----------------------------------------------------------------- |
| Framework       | Next.js 15 (App Router, Turbopack) + React 19                     |
| Language        | TypeScript                                                        |
| Styling         | Tailwind CSS v4, `next-themes` (dark default), Radix UI / shadcn  |
| i18n            | `next-intl` — locales `ru` (default), `kk`, `en`, always-prefixed |
| Animation       | `motion`                                                          |
| Forms           | `react-hook-form` + `zod`                                         |
| Analytics       | GA4 + PostHog + Cloudflare Web Analytics (all consent-gated)      |
| SEO             | Metadata API, hreflang, sitemap, robots, manifest, JSON-LD, OG    |
| Hosting         | Cloudflare Workers via `@opennextjs/cloudflare`                   |
| Tests           | Vitest (unit) + Playwright (e2e) + Lighthouse CI                  |
| Package manager | pnpm 11                                                           |

Almost every route is statically generated (SSG). Only `POST /api/lead` is
dynamic (`force-dynamic`).

## Prerequisites

- **Node.js 20+**
- **pnpm 11** (`corepack enable` or `npm i -g pnpm`)

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
```

See `.env.example` for every variable. `NEXT_PUBLIC_*` vars are exposed to the
browser; the rest are server-only secrets — never prefix a secret with
`NEXT_PUBLIC_`.

## Develop

```bash
pnpm dev          # next dev (Turbopack) on http://localhost:3000
```

The app redirects `/` to the default locale; browse `http://localhost:3000/ru`.

## Test

```bash
pnpm test         # 79 unit tests (Vitest)
pnpm test:e2e     # 15 e2e tests (Playwright)
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

> Running e2e locally with `pnpm test:e2e` starts a `next dev` server. On a cold
> Turbopack start the fully-parallel run can flake on first-route compilation;
> if so, run `pnpm exec playwright test --workers=1`. CI uses a production build
> and retries, so it is stable there.

## Build (Next, for local prod / Lighthouse)

```bash
pnpm build
pnpm start        # serves the production build on :3000
```

## Cloudflare deploy (OpenNext)

The site runs on Cloudflare Workers through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). Config lives in
`open-next.config.ts` and `wrangler.jsonc` (worker name `suslicketeam`,
`nodejs_compat` + `global_fetch_strictly_public` flags, `ASSETS` static binding).

```bash
# Build the worker + run it locally on the real Workers runtime:
pnpm preview      # opennextjs-cloudflare build && ... preview

# Build + deploy to Cloudflare (requires `wrangler login`):
pnpm deploy

# Regenerate Cloudflare binding types after editing wrangler.jsonc:
pnpm cf-typegen   # writes cloudflare-env.d.ts (gitignored)
```

### Secrets on Cloudflare

`NEXT_PUBLIC_*` vars are inlined at build time from `.env.local`. Server-only
secrets must **not** be committed or placed in `wrangler.jsonc` — set them in
Cloudflare:

```bash
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler secret put LEADS_SHEET_WEBHOOK_URL
```

(or Cloudflare dashboard → Workers → your worker → Settings → Variables.)

> **OG images on Workers:** `src/app/[locale]/opengraph-image.tsx` uses
> `next/og` `ImageResponse`. This has been verified to render correctly on the
> Workers runtime under OpenNext (valid 1200×630 PNG via `pnpm preview`).
>
> **Image Optimization** (`next/image` loader) is not supported by the
> Cloudflare adapter; the site ships pre-sized assets and does not rely on it.

## i18n

- Locales and routing: `src/i18n/routing.ts` (default `ru`, all paths prefixed).
- Translations: `messages/ru.json`, `messages/kk.json`, `messages/en.json`.
  Keys are grouped by namespace (`home`, `services`, `cases`, `leadForm`, …).
- To **edit** copy: change the value under the right namespace/key in all three
  files. Keep keys identical across locales.
- To **add a string**: add the same key to every locale file, then read it in a
  component/page via `useTranslations("namespace")` / `getTranslations`.

## Content (services & cases)

Structure is typed in `src/content/`; copy is in `messages/`.

**Add a service:**
1. Add a slug to the `ServiceSlug` union and an entry to `services` in
   `src/content/services.ts` (`icon` = a lucide-react name, plus `order` /
   `featured`).
2. Add `services.<slug>.{title,tagline,…}` and `serviceDetail.<slug>.*` copy to
   all three `messages/*.json` files.

**Add a case:**
1. Add a slug to the `CaseSlug` union and an entry to `cases` in
   `src/content/cases.ts` (`url`, `tags`, `metrics`, `year`, `featured`).
2. Add `cases.<slug>.{title,result,…}` (incl. `metrics.<key>` labels) and any
   `caseDetail.<slug>.*` copy to all three `messages/*.json` files.

New slugs are picked up by `generateStaticParams`, so they are statically
rendered and added to the sitemap automatically.

## Architecture summary

- `src/app/[locale]/` — localized App Router pages (home, services + detail,
  cases + detail, about, contact, localized `not-found` / `error`).
- `src/app/[locale]/opengraph-image.tsx` — dynamic OG image (`next/og`).
- `src/app/{sitemap,robots,manifest}.ts` — SEO/PWA route handlers.
- `src/app/api/lead/route.ts` — lead webhook (`force-dynamic`), validates with
  zod then fans out to Telegram + the sheet webhook.
- `src/middleware.ts` — next-intl locale negotiation/redirects.
- `src/components/` — UI (`ui/`, `sections/`, `analytics/`, `hero/`, `motion/`).
- `src/lib/` — `seo`, `structured-data`, `analytics`, `messenger`, `utm`,
  `lead-schema`, `lead-format`, `config`, `content`.
- `src/i18n/` — routing + request config for next-intl.

## Docs

- Design: [`docs/plans/2026-06-08-suslicketeam-website-design.md`](docs/plans/2026-06-08-suslicketeam-website-design.md)
- Implementation plan: [`docs/plans/2026-06-08-suslicketeam-website-implementation.md`](docs/plans/2026-06-08-suslicketeam-website-implementation.md)
- **Launch checklist: [`docs/launch-checklist.md`](docs/launch-checklist.md)** — do this before going live.
