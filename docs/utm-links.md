# UTM links — ready-to-use

Tagged links for marketing channels. The site captures first-touch UTM, prefills
it into the WhatsApp/Telegram greeting on CTA click, and reports it in GA4 +
PostHog. The root `/` redirect preserves query params, so the clean root works.

## Convention
- `utm_source` — the platform: `instagram`, `linkedin`, `telegram`, `youtube`, …
- `utm_medium` — channel type. Use **`social`** for organic so GA4 groups it as
  "Organic Social"; **`paid-social`** or `cpc` for ads; `referral` for partner links.
- `utm_campaign` — placement or promo: `bio`, `stories`, `profile`, `post`, `launch_jan`.
- `utm_content` — optional creative id: `reel1`, `post1`, `banner_a`.
- Lowercase, no spaces, use `_`. Keep values consistent across links.

For an English-speaking audience, point at `/en` instead of `/`.

## Instagram
| Placement | Link |
|-----------|------|
| Bio | `https://suslicketeam.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio` |
| Stories | `https://suslicketeam.com/?utm_source=instagram&utm_medium=social&utm_campaign=stories` |
| Reel / post | `https://suslicketeam.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch_jan&utm_content=reel1` |

## LinkedIn
| Placement | Link |
|-----------|------|
| Profile / Website link | `https://suslicketeam.com/?utm_source=linkedin&utm_medium=social&utm_campaign=profile` |
| Post | `https://suslicketeam.com/?utm_source=linkedin&utm_medium=social&utm_campaign=post` |
| Campaign | `https://suslicketeam.com/?utm_source=linkedin&utm_medium=social&utm_campaign=launch_jan&utm_content=post1` |
| LinkedIn Ads (paid) | `https://suslicketeam.com/?utm_source=linkedin&utm_medium=paid-social&utm_campaign=<campaign>` |
| EN audience | `https://suslicketeam.com/en?utm_source=linkedin&utm_medium=social&utm_campaign=profile` |

## Templates for other channels
| Channel | Link |
|---------|------|
| Telegram channel / post | `https://suslicketeam.com/?utm_source=telegram&utm_medium=social&utm_campaign=channel` |
| YouTube (description) | `https://suslicketeam.com/?utm_source=youtube&utm_medium=social&utm_campaign=<video>` |
| WhatsApp status / share | `https://suslicketeam.com/?utm_source=whatsapp&utm_medium=social&utm_campaign=status` |
| Business card / QR | `https://suslicketeam.com/?utm_source=offline&utm_medium=qr&utm_campaign=card` |
| Email signature | `https://suslicketeam.com/?utm_source=email&utm_medium=signature&utm_campaign=signature` |
| Google Ads | `https://suslicketeam.com/?utm_source=google&utm_medium=cpc&utm_campaign=<campaign>` |

## Outreach (outbound DM / WhatsApp)

Links for **you reaching out first** (see `outreach-playbook.md`). Use
`utm_medium=outreach` so GA4/PostHog separate proactive outreach from organic social.
The site captures first-touch UTM and prefills it into the messenger CTA, closing the
loop on which method actually converts.

| Method | Link |
|--------|------|
| Cold SMB (no site) | `https://suslicketeam.com/?utm_source=whatsapp&utm_medium=outreach&utm_campaign=cold_smb` |
| Instagram DM | `https://suslicketeam.com/?utm_source=instagram&utm_medium=outreach&utm_campaign=dm` |
| LinkedIn DM (EN) | `https://suslicketeam.com/en?utm_source=linkedin&utm_medium=outreach&utm_campaign=dm` |
| Referral / intro | `https://suslicketeam.com/?utm_source=referral&utm_medium=outreach&utm_campaign=intro` |
| Networking / event | `https://suslicketeam.com/?utm_source=event&utm_medium=outreach&utm_campaign=networking` |
| Reactivation (old lead) | `https://suslicketeam.com/?utm_source=whatsapp&utm_medium=outreach&utm_campaign=reactivation` |
| Free-audit angle | `https://suslicketeam.com/?utm_source=whatsapp&utm_medium=outreach&utm_campaign=audit` |

To prove your own craft instead of client cases, link the home page itself (it *is*
the portfolio) or a specific case, e.g. `suslicketeam.com/ru/cases/loyrush`.

## Verify it works
Open any link → on the site the UTM is stored (first-touch). Click the WhatsApp or
Telegram CTA → the prefilled message includes `источник/канал/кампания`. In GA4
Realtime / PostHog you'll see the session with the source.
