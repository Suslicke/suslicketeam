# Launch checklist — suslicketeam.com

Everything the owner must do to take the site live. Work top to bottom; the
later SEO/analytics steps depend on the site already being deployed on a real
domain. Code is done — these are **operational / account** tasks.

## 0. Pre-flight (local)

- [ ] `pnpm install && pnpm build` succeeds.
- [ ] `pnpm test` (79) and `pnpm test:e2e` (15) pass.
- [ ] `pnpm preview` runs the worker locally and `/ru`, OG image, sitemap, robots
      all respond (sanity check before deploying).

## 1. Domain → Cloudflare

- [ ] Add `suslicketeam.com` as a zone in Cloudflare (or move nameservers to CF).
- [ ] Point DNS / nameservers at Cloudflare; wait for the zone to go **Active**.
- [ ] After first deploy, map the domain to the Worker:
      Workers → `suslicketeam` → Settings → Domains & Routes → add a **Custom
      Domain** `suslicketeam.com` (and `www` → redirect to apex).
- [ ] Confirm `https://suslicketeam.com/ru` loads and HTTPS is valid.

## 2. Environment variables & secrets

Set **public** (`NEXT_PUBLIC_*`) values in `.env.local` before building/deploying
(they are inlined at build time). Set **secrets** via `wrangler secret put` (or
the dashboard). See `.env.example`.

Public (build-time):

- [ ] `NEXT_PUBLIC_SITE_URL=https://suslicketeam.com` — canonical/OG/sitemap base.
- [ ] `NEXT_PUBLIC_WHATSAPP_NUMBER` — international digits, no `+` (CTA links).
- [ ] `NEXT_PUBLIC_TELEGRAM_USERNAME` — without leading `@` (CTA links).
- [ ] `NEXT_PUBLIC_GA_ID` — GA4 measurement id `G-XXXXXXXXXX` (step 4).
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — PostHog project API key (step 5).
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` — `https://us.i.posthog.com` or `eu` (step 5).
- [ ] `NEXT_PUBLIC_CF_BEACON_TOKEN` — Cloudflare Web Analytics token (step 6).

Secrets (runtime, never commit):

- [ ] `wrangler secret put TELEGRAM_BOT_TOKEN` — from @BotFather (step 3).
- [ ] `wrangler secret put TELEGRAM_CHAT_ID` — destination chat/channel (step 3).
- [ ] `wrangler secret put LEADS_SHEET_WEBHOOK_URL` — Apps Script web-app URL
      that appends a lead row to a Google Sheet.

## 3. Telegram lead bot

- [ ] In Telegram, message **@BotFather** → `/newbot` → get the **bot token** →
      set as `TELEGRAM_BOT_TOKEN`.
- [ ] Decide where leads go (a group, channel, or your DM). Add the bot to that
      group/channel as needed.
- [ ] Get the **chat id**: send a message to the bot/group, then open
      `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `chat.id`
      (negative for groups/channels). Set as `TELEGRAM_CHAT_ID`.
- [ ] Submit a test lead from `/ru/contact` and confirm the Telegram message
      arrives and the sheet row is appended.

## 4. Google Analytics 4

- [ ] Create a GA4 property for `suslicketeam.com`; copy the **Measurement ID**
      (`G-XXXXXXXXXX`) → `NEXT_PUBLIC_GA_ID`.
- [ ] In GA4 → Admin → Events → **mark as conversions**:
  - [ ] `lead_messenger_click`
  - [ ] `lead_form_submit`
- [ ] Verify events flow in GA4 Realtime after accepting the consent banner.

## 5. PostHog

- [ ] Create a PostHog project; copy the **project API key** → `NEXT_PUBLIC_POSTHOG_KEY`.
- [ ] Set `NEXT_PUBLIC_POSTHOG_HOST` to the matching region host (`us`/`eu`).
- [ ] Confirm pageviews + the lead events appear after consent.

## 6. Cloudflare Web Analytics

- [ ] Cloudflare dashboard → Web Analytics → add a site → copy the **beacon
      token** → `NEXT_PUBLIC_CF_BEACON_TOKEN`.
- [ ] Confirm hits register after deploy.

> Re-deploy (`pnpm deploy`) after setting any `NEXT_PUBLIC_*` value — these are
> baked in at build time.

## 7. Search engines / SEO

- [ ] **Google Search Console**: add `suslicketeam.com`, verify ownership,
      submit `https://suslicketeam.com/sitemap.xml`.
- [ ] In Search Console, check the **International Targeting / hreflang** report
      for `ru` / `kk` / `en` — confirm no "no return tags" errors.
- [ ] **Yandex Webmaster**: add the site, verify, submit the same sitemap
      (important for the KZ/RU audience).
- [ ] Confirm `https://suslicketeam.com/robots.txt` resolves and references the
      sitemap.

## 8. Local SEO (Kazakhstan)

- [ ] Create / claim a **Google Business Profile** for the studio (category,
      service area = Kazakhstan, contact = WhatsApp/Telegram, website link).
- [ ] Ensure NAP (name / contact) is consistent with the site's `LocalBusiness`
      JSON-LD (`src/lib/structured-data.ts`).

## 9. Replace placeholder content

- [ ] **/about**: add a real team photo (currently a placeholder).
- [ ] **Testimonials**: replace sample quotes with real client testimonials (and
      keep the disclaimer accurate).
- [ ] **Case metrics**: replace any placeholder metrics in
      `messages/*.json` (`cases.<slug>.metrics.*`) with real numbers; verify each
      case `url` in `src/content/cases.ts` is the live link.
- [ ] Review all three locales (`ru`/`kk`/`en`) for copy parity.

## 10. PWA icons (manifest)

- [ ] Replace placeholder app icons referenced by `src/app/manifest.ts` (and
      `icon.png` / `favicon.ico`) with real branded PWA icons at the required
      sizes (192×192, 512×512). Resolve the manifest TODO.

## 11. Social / OG previews

- [ ] Paste `https://suslicketeam.com/ru` into a **WhatsApp** chat and a
      **Telegram** chat and confirm the OG image + title/description render.
- [ ] Optionally validate via the X/Twitter and Facebook sharing debuggers.

## 12. Final verification

- [ ] Lighthouse against production passes a11y / best-practices / SEO ≥ 0.95
      (the localhost `canonical` false-positive resolves on the real origin).
- [ ] Submit a real lead end-to-end on production (Telegram + sheet).
- [ ] Confirm the consent banner gates analytics (no GA/PostHog/CF beacon fires
      before consent).
