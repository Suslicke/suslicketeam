# suslicketeam Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multilingual (RU/KK/EN), dark-themed, SEO-perfect portfolio site for suslicketeam on Next.js 15 + Cloudflare, with WhatsApp/Telegram-first lead capture, UTM tracking, and GA4 + PostHog + Cloudflare analytics.

**Architecture:** Next.js 15 App Router, mostly SSG. `next-intl` for i18n with `localePrefix: 'always'`. `next-themes` for dark/light without FOUC. Logic-heavy modules (UTM, messenger links, analytics events, form validation) are built TDD-first with Vitest. UI is verified with Playwright E2E and Lighthouse CI (thresholds ≥95). Leads flow form → Cloudflare function (single webhook) → Telegram bot + spreadsheet (CRM-agnostic).

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, next-intl, next-themes, Framer Motion, React Hook Form, Zod, Vitest, Playwright, `@opennextjs/cloudflare`, GA4, PostHog, Cloudflare Web Analytics.

**Design reference:** `docs/plans/2026-06-08-suslicketeam-website-design.md`

---

## Conventions

- **Package manager:** pnpm. **Node:** ≥20.
- **Commit style:** Conventional Commits (`feat:`, `chore:`, `test:`, `docs:`). Commit after every green task. Co-author line per repo policy.
- **Locales:** `ru` (reference), `kk`, `en`. Default `ru`. All prefixed (`/ru`, `/kk`, `/en`).
- **Secrets:** never in repo. `.env.local` for dev, Cloudflare env vars for prod. `.env.example` documents keys.
- **Test policy:** TDD (red→green→commit) for pure logic in `src/lib/**`. UI verified via E2E/Lighthouse, not unit-tested per component.

---

## Phase 0 — Project scaffold & tooling

### Task 0.1: Initialize Next.js project

**Files:** Create project root files (`package.json`, `tsconfig.json`, `next.config.ts`, `app/`, etc.)

**Step 1:** Run scaffold:
```bash
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir --import-alias "@/*" --no-turbopack
```
(If dir non-empty due to `docs/`, scaffold in temp and merge, keeping `docs/` and `.git/`.)

**Step 2:** Verify dev server boots:
```bash
pnpm dev
```
Expected: app serves on http://localhost:3000.

**Step 3:** Commit.
```bash
git add -A && git commit -m "chore: scaffold Next.js 15 app with TS, Tailwind, src dir"
```

### Task 0.2: Add Vitest + Playwright + testing config

**Files:**
- Create: `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`
- Modify: `package.json` (scripts: `test`, `test:e2e`, `lint`, `typecheck`)

**Step 1:** Install:
```bash
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test
pnpm exec playwright install chromium
```

**Step 2:** Write `vitest.config.ts` (jsdom env, setup file, `@/*` alias matching tsconfig).

**Step 3:** Add a trivial sanity test `src/lib/__tests__/sanity.test.ts` asserting `1+1===2`. Run `pnpm test` → PASS.

**Step 4:** Commit: `chore: add vitest and playwright test harness`.

### Task 0.3: Add Lighthouse CI + GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`, `lighthouserc.json`
- Create: `.env.example`

**Step 1:** `lighthouserc.json` asserts Performance/SEO/Accessibility/Best-Practices ≥ 0.95 on `/ru`, `/ru/services`, `/ru/cases`.

**Step 2:** `ci.yml` runs: install → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build` → `lhci autorun`.

**Step 3:** `.env.example` documents: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_TELEGRAM_USERNAME`, `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_CF_BEACON_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `LEADS_SHEET_WEBHOOK_URL`.

**Step 4:** Commit: `ci: add lighthouse ci and github actions pipeline`.

---

## Phase 1 — Core logic (TDD)

> These modules are pure functions — strict red→green→commit.

### Task 1.1: Site config module

**Files:** Create `src/lib/config.ts`

**Step 1:** Define typed config reading from env with safe fallbacks:
```ts
export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://suslicketeam.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "77066998879",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "suslicketeam",
  locales: ["ru", "kk", "en"] as const,
  defaultLocale: "ru" as const,
} as const;
export type Locale = (typeof siteConfig.locales)[number];
```

**Step 2:** Commit: `feat: add typed site config`.

### Task 1.2: UTM parser & persistence (TDD)

**Files:**
- Test: `src/lib/__tests__/utm.test.ts`
- Create: `src/lib/utm.ts`

**Step 1: Write failing tests:**
```ts
import { parseUtm, type UtmParams } from "../utm";

test("extracts known utm params from query string", () => {
  const u = parseUtm("?utm_source=instagram&utm_medium=cpc&utm_campaign=jan&utm_content=a&utm_term=web");
  expect(u).toEqual({
    utm_source: "instagram", utm_medium: "cpc", utm_campaign: "jan",
    utm_content: "a", utm_term: "web",
  });
});

test("ignores unknown params and returns empty object when none", () => {
  expect(parseUtm("?foo=bar")).toEqual({});
});

test("captures click ids (gclid/fbclid)", () => {
  expect(parseUtm("?gclid=123&fbclid=456")).toMatchObject({ gclid: "123", fbclid: "456" });
});
```

**Step 2:** Run `pnpm test utm` → FAIL (module missing).

**Step 3:** Implement `parseUtm(search: string): UtmParams` — whitelist `utm_*`, `gclid`, `fbclid`; URLSearchParams; drop empties.

**Step 4:** Run → PASS.

**Step 5:** Add `persistUtm()` / `getStoredUtm()` using `sessionStorage` (guard `typeof window`). Test with a jsdom storage mock: persist then read back; first-touch wins (don't overwrite existing non-empty).

**Step 6:** Run → PASS. Commit: `feat: add utm parser and session persistence`.

### Task 1.3: Messenger link builder (TDD)

**Files:**
- Test: `src/lib/__tests__/messenger.test.ts`
- Create: `src/lib/messenger.ts`

**Step 1: Failing tests:**
```ts
import { buildWhatsappUrl, buildTelegramUrl } from "../messenger";

test("whatsapp url has digits-only number and encoded text", () => {
  const url = buildWhatsappUrl({ number: "+7 706 699 88 79", text: "Привет, страница: /ru/services/ai" });
  expect(url).toBe("https://wa.me/77066998879?text=" + encodeURIComponent("Привет, страница: /ru/services/ai"));
});

test("telegram url uses username without @", () => {
  expect(buildTelegramUrl({ username: "@suslicketeam" })).toBe("https://t.me/suslicketeam");
});

test("whatsapp text embeds utm context when provided", () => {
  const url = buildWhatsappUrl({ number: "77066998879", page: "/ru", utm: { utm_source: "instagram", utm_campaign: "jan" } });
  expect(decodeURIComponent(url)).toContain("instagram");
  expect(decodeURIComponent(url)).toContain("/ru");
});
```

**Step 2:** Run → FAIL.

**Step 3:** Implement: strip non-digits from number; compose default greeting + page + utm summary; `encodeURIComponent` the text; telegram strips leading `@`.

**Step 4:** Run → PASS. Commit: `feat: add whatsapp/telegram link builder with utm context`.

### Task 1.4: Analytics event contract (TDD)

**Files:**
- Test: `src/lib/__tests__/analytics.test.ts`
- Create: `src/lib/analytics.ts`

**Step 1: Failing tests** — `trackEvent(name, params)` calls both `window.gtag` and `window.posthog.capture`:
```ts
import { trackEvent } from "../analytics";

test("dispatches to gtag and posthog", () => {
  const gtag = vi.fn(); const capture = vi.fn();
  (window as any).gtag = gtag; (window as any).posthog = { capture };
  trackEvent("lead_messenger_click", { channel: "whatsapp", page: "/ru" });
  expect(gtag).toHaveBeenCalledWith("event", "lead_messenger_click", expect.objectContaining({ channel: "whatsapp" }));
  expect(capture).toHaveBeenCalledWith("lead_messenger_click", expect.objectContaining({ channel: "whatsapp" }));
});

test("no-throw when providers absent", () => {
  delete (window as any).gtag; delete (window as any).posthog;
  expect(() => trackEvent("x", {})).not.toThrow();
});
```

**Step 2:** Run → FAIL. **Step 3:** Implement defensive `trackEvent`. **Step 4:** PASS. Commit: `feat: add unified analytics trackEvent`.

### Task 1.5: Lead form schema (TDD)

**Files:**
- Test: `src/lib/__tests__/lead-schema.test.ts`
- Create: `src/lib/lead-schema.ts`

**Step 1: Failing tests** for Zod `leadSchema`: requires `name` (min 2), `contact` (non-empty), `projectType` (enum of services), optional `message`; honeypot field `company` must be empty; valid input parses, invalid rejects with field errors.

**Step 2:** Run → FAIL. **Step 3:** Implement Zod schema. **Step 4:** PASS. Commit: `feat: add lead form zod schema`.

---

## Phase 2 — i18n, theme, layout shell

### Task 2.1: Install & wire next-intl

**Files:** Create `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/middleware.ts`, `messages/{ru,kk,en}.json`; Modify `next.config.ts`, restructure `src/app` → `src/app/[locale]`.

**Step 1:** `pnpm add next-intl`. Configure `routing` with locales `['ru','kk','en']`, `defaultLocale: 'ru'`, `localePrefix: 'always'`.

**Step 2:** Middleware matches all paths except `_next`, static, api. Seed `messages/*.json` with `common` namespace (nav labels).

**Step 3:** Verify: visiting `/` redirects to `/ru`; `/kk` and `/en` render. Commit: `feat: add next-intl i18n with always-prefix routing`.

### Task 2.2: Theme provider without FOUC

**Files:** Create `src/components/theme-provider.tsx`, `src/components/theme-toggle.tsx`; Modify `src/app/[locale]/layout.tsx`.

**Step 1:** `pnpm add next-themes`. Wrap layout in `ThemeProvider` (`attribute="class"`, `defaultTheme="dark"`, `enableSystem`). Ensure `suppressHydrationWarning` on `<html>`.

**Step 2:** Build theme toggle (sun/moon, accessible label, persists). 

**Step 3:** E2E `e2e/theme.spec.ts`: load `/ru`, assert `<html class="dark">` present on first paint (no white flash), toggle → `light`, reload → persisted. Run `pnpm test:e2e theme` → PASS.

**Step 4:** Commit: `feat: add dark theme with fouc-free toggle`.

### Task 2.3: Tailwind design tokens + shadcn/ui base

**Files:** Modify `tailwind.config`/`globals.css`; init shadcn.

**Step 1:** `pnpm dlx shadcn@latest init` (dark base). Define brand color scale, font via `next/font` (e.g. Inter + a display font), radius, container.

**Step 2:** Add base primitives: `button`, `card`, `input`, `textarea`, `select`, `accordion`, `sheet`.

**Step 3:** Commit: `feat: add design tokens, fonts, and shadcn primitives`.

### Task 2.4: Header, footer, language switcher

**Files:** Create `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/language-switcher.tsx`.

**Step 1:** Header: logo (suslicketeam), nav (services/cases/about/contact), theme toggle, language switcher, primary CTA button. Sticky, responsive (mobile sheet menu).

**Step 2:** Language switcher preserves current path across locales (uses `usePathname` + `routing`).

**Step 3:** Footer: contacts, locales, links, requisites placeholder.

**Step 4:** E2E `e2e/i18n.spec.ts`: switch RU→KK on `/ru/services` lands on `/kk/services`. Run → PASS. Commit: `feat: add header, footer, language switcher`.

---

## Phase 3 — SEO foundation

### Task 3.1: Metadata + hreflang helper

**Files:** Create `src/lib/seo.ts`; Modify `src/app/[locale]/layout.tsx`.

**Step 1:** `buildMetadata({ locale, path, title, description })` returning Next `Metadata` with canonical + `alternates.languages` for all locales + `x-default`, OG, Twitter. Unit-test the alternates map (TDD): asserts each locale URL + x-default present.

**Step 2:** Apply to root layout via `generateMetadata`. Commit: `feat: add seo metadata + hreflang helper`.

### Task 3.2: sitemap.ts, robots.ts, manifest

**Files:** Create `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/manifest.ts`.

**Step 1:** `sitemap.ts` enumerates all routes × locales with `alternates`. `robots.ts` allows all + points to sitemap. 

**Step 2:** Build, curl `/sitemap.xml` — verify all locales. Commit: `feat: add sitemap, robots, manifest`.

### Task 3.3: JSON-LD structured data

**Files:** Create `src/components/json-ld.tsx`, `src/lib/structured-data.ts`.

**Step 1:** Builders for Organization, LocalBusiness (KZ), Person, WebSite+SearchAction, BreadcrumbList, Service, FAQPage. Inject via `<script type="application/ld+json">`.

**Step 2:** Validate output shape with a unit test (required `@type`/`@context` fields). Commit: `feat: add json-ld structured data`.

### Task 3.4: Dynamic OG images

**Files:** Create `src/app/[locale]/opengraph-image.tsx` (and per-route as needed).

**Step 1:** `next/og` ImageResponse with brand bg, title, locale. 

**Step 2:** Build, request OG route → 200 image. Commit: `feat: add dynamic og images`.

---

## Phase 4 — Analytics integration

### Task 4.1: PostHog provider with manual pageviews

**Files:** Create `src/components/posthog-provider.tsx`; Modify layout.

**Step 1:** `pnpm add posthog-js`. Init in client provider; a child component sends `$pageview` on `usePathname`+`useSearchParams` change. Guard against double-init.

**Step 2:** E2E asserts `posthog` defined and pageview fired on client nav (spy via `window`). Commit: `feat: add posthog with spa pageview tracking`.

### Task 4.2: GA4 + Cloudflare beacon scripts

**Files:** Create `src/components/analytics-scripts.tsx`; Modify layout.

**Step 1:** GA4 via `next/script` `afterInteractive` (gated on env id). Cloudflare beacon script (gated on token). Consent banner component (lightweight) gating GA/PostHog cookies.

**Step 2:** Commit: `feat: add ga4, cloudflare analytics, consent banner`.

### Task 4.3: Wire UTM capture + messenger CTA tracking

**Files:** Create `src/components/messenger-cta.tsx`, `src/components/utm-capture.tsx`.

**Step 1:** `utm-capture` runs on mount: `persistUtm(window.location.search)`.

**Step 2:** `MessengerCTA` builds wa.me/t.me url via `src/lib/messenger.ts` using stored UTM + current path; on click calls `trackEvent('lead_messenger_click', {...})` then navigates.

**Step 3:** E2E `e2e/cta.spec.ts`: visit `/ru?utm_source=instagram`, click WhatsApp CTA → opened URL contains digits-only number and `instagram` in decoded text; `lead_messenger_click` captured. Run → PASS. Commit: `feat: wire utm capture and messenger cta tracking`.

---

## Phase 5 — Content & pages

### Task 5.1: Content data model

**Files:** Create `src/content/services/*.ts`, `src/content/cases/*.ts`, `src/lib/content.ts`, message namespaces.

**Step 1:** Typed service & case records (slug, localized title/summary/body, metrics, links, tags). Cases seeded for: suslicke, animeenigma, xaid, python-guide, web-interview, loyrush, exchange-bridge, ai-diagnostic. Draft selling copy RU/KK/EN (placeholder-but-real, user edits later).

**Step 2:** `getServices(locale)`, `getCase(slug, locale)` helpers + unit test for lookup + 404 on unknown slug. Commit: `feat: add content model with service/case data`.

### Task 5.2: Home page sections

**Files:** Create `src/app/[locale]/page.tsx` + `src/components/sections/*` (hero, logos, services, cases, process, why-us, testimonials, faq, cta).

**Step 1:** Build each section as a server component (data) + client islands only where needed (animations). Apply Framer Motion scroll reveals (respect reduced-motion).

**Step 2:** FAQ section emits FAQPage JSON-LD. Sticky mobile messenger button.

**Step 3:** E2E smoke: home renders all sections, CTA present. Commit per 2-3 sections: `feat: add home hero+services sections`, etc.

### Task 5.3: Hero constellation background (perf-safe)

**Files:** Create `src/components/hero/constellation.tsx`.

**Step 1:** Canvas 2D node/line field reacting to cursor. Lazy-mounted after hydration (dynamic import, `ssr:false`). Pause via IntersectionObserver; static fallback for `prefers-reduced-motion`; downgrade on low `hardwareConcurrency`/`deviceMemory`.

**Step 2:** Verify LCP element is hero text (not canvas) — Lighthouse check. Commit: `feat: add perf-safe hero constellation`.

### Task 5.4: Services pages (overview + 5 detail)

**Files:** Create `src/app/[locale]/services/page.tsx`, `src/app/[locale]/services/[slug]/page.tsx`.

**Step 1:** Overview grid → detail pages with `generateStaticParams` per locale, `generateMetadata`, Service + Breadcrumb JSON-LD, CTA. 

**Step 2:** Commit: `feat: add services overview and detail pages`.

### Task 5.5: Cases pages (grid + detail)

**Files:** Create `src/app/[locale]/cases/page.tsx`, `src/app/[locale]/cases/[slug]/page.tsx`.

**Step 1:** Grid of cases; detail with task→solution→result, metrics, live link, JSON-LD, CTA. `generateStaticParams`.

**Step 2:** Commit: `feat: add cases grid and detail pages`.

### Task 5.6: About & Contact pages

**Files:** Create `src/app/[locale]/about/page.tsx`, `src/app/[locale]/contact/page.tsx`.

**Step 1:** About: photo placeholder, story, stack icons, team block, trust facts. Contact: messenger buttons + form (next task).

**Step 2:** Commit: `feat: add about and contact pages`.

---

## Phase 6 — Lead form & webhook

### Task 6.1: Lead form component

**Files:** Create `src/components/lead-form.tsx`.

**Step 1:** `pnpm add react-hook-form @hookform/resolvers`. Build form with RHF + zodResolver(`leadSchema`), honeypot `company`, localized labels/errors, submit/loading/success/error states, optimistic UX, retry on network error.

**Step 2:** On submit POST to `/api/lead` with form + stored UTM + page. On success `trackEvent('lead_form_submit', ...)`.

**Step 3:** E2E `e2e/form.spec.ts`: invalid submit shows errors; valid submit (mocked route) shows success. Commit: `feat: add lead form with validation and analytics`.

### Task 6.2: Lead webhook (Cloudflare-compatible route handler)

**Files:** Create `src/app/api/lead/route.ts`.

**Step 1:** POST handler: validate with `leadSchema` (reject if honeypot filled → 200 silent), rate-limit by IP (simple in-memory/KV later), then fan-out:
- Telegram: `https://api.telegram.org/bot<token>/sendMessage` with formatted lead (name, contact, type, message, UTM, page).
- Spreadsheet: POST to `LEADS_SHEET_WEBHOOK_URL` (Google Apps Script / Make webhook).

**Step 2:** Unit-test the message formatter (TDD): given a lead, produces expected Telegram text including UTM. Mock fetch for the handler test.

**Step 3:** Commit: `feat: add lead webhook fan-out to telegram and sheet`.

### Task 6.3: Error & not-found pages

**Files:** Create `src/app/[locale]/not-found.tsx`, `src/app/[locale]/error.tsx`, root `src/app/not-found.tsx`.

**Step 1:** Localized, branded. Commit: `feat: add localized error and 404 pages`.

---

## Phase 7 — Cloudflare deploy & hardening

### Task 7.1: OpenNext Cloudflare adapter

**Files:** Create `open-next.config.ts`, `wrangler.toml`; Modify `package.json` (`deploy`, `preview`).

**Step 1:** `pnpm add -D @opennextjs/cloudflare wrangler`. Configure adapter; set env vars in `wrangler.toml`/dashboard. 

**Step 2:** `pnpm exec opennextjs-cloudflare build && wrangler dev` → site runs locally on Workers runtime. Commit: `chore: add opennext cloudflare adapter and wrangler config`.

### Task 7.2: Final SEO/perf audit pass

**Step 1:** Run Lighthouse on `/ru`, `/kk`, `/en`, a service, a case. Fix until all ≥95 (perf/SEO/a11y/best-practices). Verify hreflang, sitemap, JSON-LD via Rich Results check.

**Step 2:** Verify analytics fire in prod build (GA4 realtime, PostHog, CF). Commit fixes.

### Task 7.3: README & launch checklist

**Files:** Create `README.md`, `docs/launch-checklist.md`.

**Step 1:** Setup, env, dev, test, deploy docs. Launch checklist: DNS → Cloudflare, env vars set, Telegram bot token + chat id, GA4 property, PostHog project, CF Web Analytics token, Search Console + sitemap submit, Google Business Profile.

**Step 2:** Commit: `docs: add readme and launch checklist`.

---

## Definition of Done

- All routes render in RU/KK/EN with correct hreflang.
- Dark theme default, toggle persists, no FOUC.
- WhatsApp/Telegram CTAs build correct URLs with UTM-in-text; `lead_messenger_click` tracked.
- Form validates, posts to webhook, lead lands in Telegram + sheet.
- GA4 + PostHog (SPA pageviews) + Cloudflare analytics live.
- Lighthouse ≥95 across perf/SEO/a11y/best-practices on key pages.
- All unit + E2E tests green in CI; deploys to Cloudflare.
