# suslicke.com — персональный сайт-визитка (дизайн)

Дата: 2026-07-13. Статус: дизайн утверждён, реализация не начата.
Живёт пока в репо студии; при создании репо сайта — переносится туда.

## Цель

Личный бренд + нетворкинг Андрея Пустового через QR-код на футболке (ивенты,
улица, случайные знакомства в Алматы). Конверсия №1 — «сохранил контакт»
(vCard), №2 — «написал в Telegram». Сайт **полностью заменяет** текущий
terminal-UI на suslicke.com.

Дизайн — синтез ultracode-воркфлоу: 3 концепта (wow / conversion / lean),
3 исследования (R3F на Workers, KV-редирект, persona-UX/SEO), 3 судьи
(посетитель ивента / владелец-одиночка / бренд-стратег). Победил
conversion-концепт «Один QR, четыре двери» + графты из остальных.

## Зафиксированные решения

- **Отдельный новый репозиторий.** Next.js 15 App Router + TypeScript +
  Tailwind v4 + next-intl (**RU + EN**, без KK) + motion v12. Деплой —
  Cloudflare Workers через `@opennextjs/cloudflare` (пайплайн студии).
  В `wrangler.jsonc` с первого коммита: `keep_vars: true`, KV-биндинг,
  Workers Analytics Engine биндинг.
- **Персоны** — 4 статических роута: `/{locale}/{biz|dev|hr|hi}`.
  Короткие слаги: для SEO разница с `/for/business` пренебрежима (цель —
  брендовые запросы по имени), зато короткий слаг диктуется вслух на ивенте.
- **3D** — React Three Fiber, морф «QR → суслик» (см. ниже).
- **Аналитика** — PostHog EU consent-gated (как на студии,
  `opt_out_capturing_by_default`) + cookieless Cloudflare Web Analytics.
  Без GA/Metrika/Sentry на старте.
- **/qr** — динамический редирект из Cloudflare KV, управляется Telegram-ботом
  suslicketeam-platform и мини-админкой `/admin`.
- **Ивент-режим** — тумблер в том же KV; попап-опрос шлётся в platform →
  реалтайм-уведомление в Telegram.

## Структура страниц

| Путь | Что |
|---|---|
| `/{locale}` | Hero (имя + строка + фото), чипы «Кто вы?», нейтральный вид без выбора, sticky-CTA |
| `/{locale}/biz` | Кейсы с бизнес-результатами (телерадиология 10+ клиник, ADMP PRO WB/Ozon, SciOffice), блок «есть студия» → мост на suslicketeam.com, CTA WhatsApp студии |
| `/{locale}/dev` | Стек по слоям, таймлайн опыта с техдеталями (DICOM/PACS, Kafka, Celery), GitHub, секция **«Как устроен этот сайт»** (R3F, KV, edge — сайт как открытый кейс), CTA Telegram |
| `/{locale}/hr` | Резюме-вид: роли/годы/команды, LinkedIn, «Скачать CV (PDF)» — статический файл в `/public` + print-friendly `/cv`, CTA email/LinkedIn |
| `/{locale}/hi` | Неформально: фото, интересы, Алматы, Instagram + Telegram, CTA «просто напиши привет» |
| `/qr` | Locale-less middleware-редирект из KV (см. ниже) |
| `/vcard.vcf` | Route handler, vCard 3.0 (точка в пути минует i18n-matcher) |
| `/admin` | Мини-админка за Bearer-токеном: UTM + тумблер ивента |
| `/api/qr-config` | GET/PATCH конфига (Bearer) — общий контракт для бота и админки |
| `/api/event-status` | Публичный, только `{active,name}`, cache 30s |
| `/api/event-survey` | POST ответов попапа → проксирует в platform |
| `/privacy` | Короткая политика (PostHog + consent) |

## UX персон

- Sticky-бар внизу мобильного экрана: **[Написать в Telegram] [Сохранить
  контакт]** — server-rendered, виден до выбора персоны и до загрузки 3D.
  Реагирует на персону (biz → WhatsApp студии с prefill; hr → LinkedIn/CV).
  Персона прошивается в prefill-текст сообщения — сразу видно, кто пишет.
- Чипы «Кто вы?» — inline в hero, **не** полноэкранный гейт (интрузивные
  interstitials = штраф Google + трение; право на единственный модал отдано
  ивент-попапу; consent-баннер PostHog — снизу, не модал).
- Переключение персон — client-side navigation, общий layout: hero/3D **не
  перемонтируются**, контент — `AnimatePresence mode="wait"` c `key=persona`.
  Pill-переключатель в шапке.
- Выбор → localStorage `sl_persona`. Вернувшемуся — плашка «Вы {персона}?
  Сменить», **без** middleware-редиректа (edge-cache баги). Явный заход на
  `/dev` и т.п. никогда не переопределяется — расшаренные ссылки священны.
- Deep-links как дистрибуция: `/hr` в подпись LinkedIn, `/dev` в GitHub-профиль.

## 3D-сцена (hero)

Петля узнавания: частицы слетаются → собираются в **настоящий сканируемый QR**
(матрица `suslicke.com/qr`, EC level H, запечена в JSON на билде, ~600 вокселей
одним InstancedMesh) → рассыпаются → пересобираются в **силуэт суслика
столбиком** (точки, сэмплированные из SVG-силуэта; морф — lerp позиций в
шейдере, запасной план — crossfade двух облаков). Суслик следит за
пальцем/gyro, «кивает» при выборе персоны, акцентный цвет вокселей = цвет
персоны. В ивент-режиме — мини-ленточка участника.

Техника (из исследования, версии проверены на 2026-07):
`three@0.185.x` + `@react-three/fiber@9.6.x` (peer react >=19 <19.3 — пиновать
react) + `@react-three/drei@10.7.x`. Паттерн монтирования — три файла:
серверный Hero (LCP-текст) → тонкий `"use client"` wrapper c
`dynamic(import, {ssr:false})` (**ssr:false разрешён только в client
component**) → сцена. Референс: `src/components/hero/aurora-mount.tsx` студии.
Чанк ~200 КБ gzip грузится после idle (`requestIdleCallback`), **до** загрузки
проверяется `prefers-reduced-motion` — если reduce, чанк не качается вовсе,
статичный SVG-постер. three строго client-only: один import в серверном коде
затянет ~1 МБ в Worker. `dpr={[1,1.75]}`, `antialias:false`,
`PerformanceMonitor onDecline → dpr 1`, пауза оффскрин через
IntersectionObserver, fallback на отсутствие WebGL. Без Environment-пресетов
(качают HDRI с CDN), без GLTF — вся геометрия процедурная.

Палитра — тёплая «степная» light-first: песочный / терракота / вечерний синий;
акценты персон: biz янтарь, dev терминальный зелёный, hr синий, hi коралл.
Сознательно не emerald/gold студии. Light по умолчанию — сканируют днём на улице.

## /qr — динамический редирект

KV, **один JSON-ключ** `qr:config` (атомарность чтения, один get на клик):

```json
{
  "version": 7,
  "target": "/",
  "utm": { "source": "shirt", "medium": "offline", "campaign": "networking" },
  "event": { "active": true, "name": "KazDevFest 2026", "defaultPersona": "hi", "startedAt": "…" },
  "updatedAt": "…", "updatedBy": "telegram-bot"
}
```

- Middleware (до intl, паттерн SHORT_LINKS студии): `getCloudflareContext().env`
  **работает в middleware** на OpenNext (тот же Worker; пример
  `examples/middleware` в репо opennextjs-cloudflare). Чтение с `cacheTtl: 60`,
  307 на `/?utm_…` (+ `?as=` дефолтной персоны при ивенте) — next-intl дальше
  локализует, сохраняя query (проверено /card студии).
- **Захардкоженный DEFAULT_CONFIG-фолбэк** — QR на футболке не умеет падать.
- Применение изменений ~1–2 мин (KV eventual consistency + cacheTtl) —
  возвращать это в ответе PATCH, чтобы бот честно писал «применится через
  пару минут».
- Клик-аналитика: **Workers Analytics Engine** через `ctx.waitUntil`
  (`writeDataPoint`: campaign, event, country) — не блокирует редирект, нет
  лимитов записи. KV-counter отвергнут (1 запись/сек на ключ). Второй слой —
  PostHog на целевой странице (consent) → расхождение слоёв = метрика
  «сканы vs дошедшие».

## API управления (контракт для platform-бота и /admin)

`GET/PATCH https://suslicke.com/api/qr-config`, `Authorization: Bearer
<QR_ADMIN_TOKEN>` (timing-safe compare). PATCH — partial merge c zod-валидацией;
`target` — только allowlist (`/…`, suslicke.com, suslicketeam.com) —
анти-open-redirect. Ответ: полный новый конфиг + `redirectPreview` (готовый
URL для подтверждения в боте) + `propagation`.

Команды бота (реализуются в suslicketeam-platform, отдельный репо):

- `/qr set campaign kazdevfest` → `PATCH {utm:{campaign}}`
- `/qr status` → GET
- `/event start "KazDevFest"` → **атомарно** event.active + utm_campaign=slug
- `/event stop` → event off + возврат дефолтного campaign

Секреты только `npx wrangler secret put` (дашборд не доезжает до live worker —
грабли студии, reason no_env), `keep_vars: true` обязателен.

## Ивент-режим на сайте

- Страницы остаются статическими: **не** читать KV в server components
  (force-dynamic убьёт кэш/LCP). Клиентский `<EventBanner/>` в layout
  fetch'ит публичный `/api/event-status` (отдаёт **только** `{active,name}`,
  `max-age=30`).
- Баннер: пульсирующая точка + «Я сейчас на {ивент} — подойди поздороваться»
  + **inline-кнопка Telegram** (человек в 20 метрах — самый короткий CTA).
- Попап-опрос (клон QrWelcome студии: radix Dialog, закрытие только ✕/Skip,
  чтобы consent-баннер его не сбивал): «Вы увидели QR на {ивент}?» → да, тут /
  футболка на улице / от знакомого / другое + обязательный free-text.
  Once-per-**event** через `localStorage sl_ev_<slug>` (не once-per-browser) —
  завсегдатай ивентов отвечает на каждом. Показывать только first-touch
  `utm_source=shirt|qr`.
- Ответ → `/api/event-survey` (hardening дословно из qr-survey студии:
  same-origin gate, shared token, sanitize, 10s timeout, coarse reason) →
  platform FastAPI → **мгновенное сообщение в Telegram** («🔥 Скан на {event}:
  персона dev, „тут на ивенте“») + запись. Platform недоступна → ответ в
  KV-очередь, не теряется.

## vCard

`/vcard.vcf` route handler: строго **VERSION:3.0** (4.0 ломает iOS), **CRLF**,
N + FN оба, TEL, ORG suslicketeam, ADR Almaty, URL, `PHOTO;ENCODING=b`
(маленький JPEG ~20–60 КБ base64, фолдинг строк ≤75 октетов — iOS показывает
фото в карточке), X-SOCIALPROFILE + дубли `item1.URL`/`X-ABLabel`
(iOS + Android). Content-Disposition attachment. **Гочка №1:** in-app браузеры
Telegram/Instagram блокируют скачивание .vcf — детект in-app UA → fallback
«открыть в браузере» / показать номер с кнопкой copy. Тестировать из
мессенджеров, не из Safari. Трек `vcard_download` до перехода.

## SEO / OG

- Реалистичная цель — владеть SERP по «Andrei Pustovoi», «Андрей Пустовой»,
  «suslicke». Запросы типа «python developer almaty» заняты агрегаторами —
  не тратим контент.
- Person JSON-LD с `@id: https://suslicke.com/#person`, `alternateName`
  кириллицей, image (реальное фото), Almaty, knowsAbout, `sameAs`
  (LinkedIn/GitHub/Instagram/Telegram) + `worksFor` → Organization
  suslicketeam (позже в схему студии — обратный `founder`). Главная —
  ProfilePage c mainEntity. **Обязательно** проставить suslicke.com в био
  LinkedIn/GitHub/Instagram/Telegram — без взаимности sameAs не работает.
  GSC + Request Indexing с первого дня.
- `buildMetadata` студии переиспользуется (siteConfig: url suslicke.com,
  locales ru/en, hreflang + x-default). Контент персон должен реально
  отличаться (кейсы vs стек vs резюме vs интересы) — иначе doorway/duplicate.
- **OG — build-time**, не runtime `next/og` (@vercel/og раздувал Worker студии
  за 3 МиБ): скрипт satori + resvg в devDeps генерит 9 PNG (4 персоны × 2
  локали + дефолт) в `/public/og/`. Дизайн: лицо + имя + строка персоны —
  превью летит person-to-person в Telegram/WhatsApp. Telegram кэширует OG
  навсегда (@WebpageBot для сброса) — проверить превью **до** печати QR.
- `images.unoptimized: true` (на Workers нет /_next/image).

## Аналитика

- PostHog EU, consent-gated как на студии (`opt_out_capturing_by_default`,
  `person_profiles`), consent-баннер снизу; ивент-попап закрывается только
  ✕/Skip — не конфликтуют. События: `persona_selected`, `persona_switch`,
  `tg_click`/`wa_click` (channel+persona+UTM), `vcard_download`,
  `qr_survey_response`. UTM first-touch — паттерн utm-capture студии.
- Cloudflare Web Analytics (cookieless) — страховка без consent.
- Сырые сканы /qr — Workers Analytics Engine (см. выше).

## Фазы

**Фаза 1 (MVP, можно печатать футболку):** каркас (i18n, seo, layout, палитра)
→ hero + sticky-CTA + чипы → 4 персона-страницы с контентом → /vcard.vcf →
/qr из KV + /api/qr-config + /admin → ивент-режим (баннер + попап + platform
webhook) → PostHog + CWA → OG build-time → GSC. 3D-фаза 1: воксельный QR
(сборка из частиц, интерактив) **без** суслика.

**Фаза 2:** морф QR → суслик (SVG-силуэт → точки), реакции на персону,
ленточка в ивент-режиме. Отдельно: команды бота в suslicketeam-platform
(`/qr set`, `/event start|stop`) — свой репо, свой план.

**Фаза 3 (по желанию):** runtime CV PDF из persona-content.ts, Sentry,
динамический дефолт-персона по типу ивента.

## Риски

1. 3D на бюджетных Android (основной сканирующий девайс) — lazy-mount, DPR
   clamp, авто-деградация, реальный тест на дешёвом устройстве до релиза.
2. Морф из SVG-сэмплинга — самая техноёмкая часть → вынесена в фазу 2;
   запасной план crossfade.
3. Силуэт суслика — нужен приличный SVG; плохой талисман хуже отсутствия.
4. Двойной бренд: личный сайт продаёт **знакомство**, студия — **проект**;
   biz-персона явно мостит на suslicketeam.com, кейсы не копировать —
   ссылаться.
5. Контент 4 персоны × 2 языка — единый типизированный источник
   `persona-content.ts`, из него и страницы, и CV.
6. Сканируемость 3D-QR с экрана (блики/углы) — EC level H, пауза сборки при
   наведении; если трюк не взлетит — сцена остаётся красивой, ссылка не
   теряется.
7. HR-персона: в резюме Berlin, на сайте Алматы — согласовать легенду до CV.
