# suslicke.com — персональный сайт-визитка (дизайн)

Дата: 2026-07-13. Статус: дизайн утверждён, реализация не начата.
Живёт пока в репо студии; при создании репо сайта — переносится туда.
Ревизия 2: хостинг **netcup VPS вместо Cloudflare** (решение пользователя:
без Cloudflare-ограничений, свой бекенд под рукой).
Ревизия 3: **отдельный новый Telegram-бот + свой мини-бекенд `qr-hub` в репо
сайта** — suslicketeam-platform не трогаем вообще (решение пользователя:
разные проекты не должны ломать друг друга).

## Цель

Личный бренд + нетворкинг Андрея Пустового через QR-код на футболке (ивенты,
улица, случайные знакомства в Алматы). Конверсия №1 — «сохранил контакт»
(vCard), №2 — «написал в Telegram». Сайт **полностью заменяет** текущий
terminal-UI на suslicke.com.

Дизайн — синтез ultracode-воркфлоу: 3 концепта (wow / conversion / lean),
3 исследования (R3F, динамический /qr, persona-UX/SEO), 3 судьи (посетитель
ивента / владелец-одиночка / бренд-стратег). Победил conversion-концепт
«Один QR, четыре двери» + графты из остальных.

## Зафиксированные решения

- **Отдельный новый репозиторий.** Next.js 15 App Router + TypeScript +
  Tailwind v4 + next-intl (**RU + EN**, без KK) + motion v12.
- **Хостинг — netcup VPS** (ssh `netcup`, там же Twenty CRM и
  suslicketeam-platform): Next.js `output: "standalone"` в Docker,
  `/opt/suslicke` (compose, `restart: always`), nginx-vhost
  `suslicke.com` (conf.d, как crm/platform), порт только на `127.0.0.1`.
  **SSL: wildcard-серт покрывает только `*.suslicketeam.com`** — для
  suslicke.com нужен свой certbot-серт (webroot/nginx-плагин, автопродление).
  CI: GitHub Actions push-to-main → build image → ssh-деплой (паттерн
  platform). DNS suslicke.com → A-запись на netcup IP.
- **Вся динамика /qr и ивент-режима — собственный мини-бекенд `qr-hub` в том
  же репо и compose**: FastAPI + aiogram в одном процессе (бот на **polling** —
  без webhook и публичного эндпоинта), **SQLite** на volume (одна строка
  конфига + логи — Postgres-контейнер оверкилл). **Отдельный новый бот**
  (создать в BotFather, напр. `@suslicke_qr_bot`); allowlist = chat_id Андрея.
  **suslicketeam-platform не трогаем** — проекты полностью независимы.
  Изменения применяются мгновенно (своя база).
- **Персоны** — 4 статических роута: `/{locale}/{biz|dev|hr|hi}`.
  Короткие слаги: для SEO разница с `/for/business` пренебрежима (цель —
  брендовые запросы по имени), зато короткий слаг диктуется вслух на ивенте.
- **3D** — React Three Fiber, морф «QR → суслик» (фаза 1 — только QR).
- **Аналитика** — PostHog EU consent-gated (как на студии) + лог сканов /qr
  в Postgres platform.

## Структура страниц

| Путь | Что |
|---|---|
| `/{locale}` | Hero (имя + строка + фото), чипы «Кто вы?», нейтральный вид без выбора, sticky-CTA |
| `/{locale}/biz` | Кейсы с бизнес-результатами (телерадиология 10+ клиник, ADMP PRO WB/Ozon, SciOffice), блок «есть студия» → мост на suslicketeam.com, CTA WhatsApp студии |
| `/{locale}/dev` | Стек по слоям, таймлайн опыта с техдеталями (DICOM/PACS, Kafka, Celery), GitHub, секция **«Как устроен этот сайт»** (R3F, nginx→FastAPI, свой VPS — сайт как открытый кейс), CTA Telegram |
| `/{locale}/hr` | Резюме-вид: роли/годы/команды, LinkedIn, «Скачать CV (PDF)» — статический файл в `/public` + print-friendly `/cv`, CTA email/LinkedIn |
| `/{locale}/hi` | Неформально: фото, интересы, Алматы, Instagram + Telegram, CTA «просто напиши привет» |
| `/qr` | **nginx → qr-hub**: FastAPI читает конфиг из SQLite, 307 на `/?utm_…`, логирует скан |
| `/vcard.vcf` | Route handler сайта, vCard 3.0 (точка в пути минует i18n-matcher) |
| `/api/event-status` | **nginx → qr-hub**: публичный `{active,name}`, nginx proxy_cache 30s |
| `/api/event-survey` | **nginx → qr-hub**: POST ответов попапа → сообщение боту |
| `/admin` | Страница сайта: формы поверх API qr-hub (Bearer-токен, noindex) |
| `/privacy` | Короткая политика (PostHog + consent) |

Управление: **команды нового бота** (основной путь, с телефона на ивенте) +
`/admin` на сайте (те же API qr-hub руками — «оба сразу», как решено ранее).

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
  Сменить», **без** middleware-редиректа (кэш-баги). Явный заход на `/dev`
  и т.п. никогда не переопределяется — расшаренные ссылки священны.
- Deep-links как дистрибуция: `/hr` в подпись LinkedIn, `/dev` в GitHub-профиль.

## 3D-сцена (hero)

Петля узнавания: частицы слетаются → собираются в **настоящий сканируемый QR**
(матрица `suslicke.com/qr`, EC level H, запечена в JSON на билде, ~600 вокселей
одним InstancedMesh) → рассыпаются → пересобираются в **силуэт суслика
столбиком** (точки, сэмплированные из SVG-силуэта; морф — lerp позиций в
шейдере, запасной план — crossfade двух облаков). Суслик следит за
пальцем/gyro, «кивает» при выборе персоны, акцентный цвет вокселей = цвет
персоны. В ивент-режиме — мини-ленточка участника.

Техника (версии проверены на 2026-07): `three@0.185.x` +
`@react-three/fiber@9.6.x` (peer react >=19 <19.3 — пиновать react) +
`@react-three/drei@10.7.x`. Паттерн монтирования — три файла: серверный Hero
(LCP-текст) → тонкий `"use client"` wrapper c `dynamic(import, {ssr:false})`
(**ssr:false разрешён только в client component**) → сцена. Референс:
`src/components/hero/aurora-mount.tsx` студии. Чанк ~200 КБ gzip грузится
после idle (`requestIdleCallback`), **до** загрузки проверяется
`prefers-reduced-motion` — если reduce, чанк не качается вовсе, статичный
SVG-постер. three держать client-only (SSR-цена и гидрация, лимитов бандла на
своём сервере нет, но правило остаётся ради LCP). `dpr={[1,1.75]}`,
`antialias:false`, `PerformanceMonitor onDecline → dpr 1`, пауза оффскрин
через IntersectionObserver, fallback на отсутствие WebGL. Без
Environment-пресетов (качают HDRI с CDN), без GLTF — геометрия процедурная.

Палитра — тёплая «степная» light-first: песочный / терракота / вечерний синий;
акценты персон: biz янтарь, dev терминальный зелёный, hr синий, hi коралл.
Сознательно не emerald/gold студии. Light по умолчанию — сканируют днём на улице.

## qr-hub — мини-бекенд (в репо сайта)

Один Python-сервис: FastAPI + aiogram (**polling**, стартует asyncio-таском в
lifespan — ни webhook, ни второго контейнера). SQLite на volume:

```
qr_config:      id=1 (одна строка), target, utm_source, utm_medium, utm_campaign,
                event_active, event_name, event_slug, event_default_persona,
                event_started_at, updated_at, updated_by
qr_scans:       id, ts, campaign, event_slug, country?, ua_hash   -- лог каждого хита
survey_answers: id, ts, event_slug, answer, free_text, persona, utm
```

Эндпоинты (nginx проксирует с suslicke.com, same-origin — без CORS):

- `GET /qr` — читает конфиг, пишет скан, 307 на `https://suslicke.com/?utm_…`
  (+ `?as=` дефолтной персоны при ивенте). next-intl дальше локализует,
  сохраняя query. **Захардкоженный дефолт в хендлере + nginx-фолбэк**
  (`error_page 502 = @qr_fallback` → `return 307 /?utm_source=shirt&…`) —
  QR на футболке не умеет падать даже при мёртвом бекенде.
- `GET /api/event-status` — публичный, только `{active, name}`, nginx
  proxy_cache 30s.
- `POST /api/event-survey` — sanitize + rate-limit, пишет в SQLite и шлёт
  **мгновенное сообщение Андрею через бота** («🔥 Скан на {event}: персона
  dev, „тут на ивенте“»).
- `GET/PATCH /api/qr-config` — Bearer `ADMIN_API_TOKEN` (для /admin-страницы
  сайта). Валидация target — allowlist (`/…`, suslicke.com, suslicketeam.com)
  — анти-open-redirect.

Команды бота (**отдельный новый бот**, allowlist = chat_id Андрея):

- `/qr set campaign kazdevfest` — правит utm_campaign
- `/qr status` — текущий конфиг + готовый итоговый URL (кликабельный)
- `/event start KazDevFest` — **атомарно**: event_active + event_slug +
  utm_campaign=slug (баннер и метки не рассинхронизируются)
- `/event stop` — выключает ивент, возвращает дефолтный campaign
- `/today` — сканы/ответы за день

Изменения применяются **мгновенно** (своя база) — бот подтверждает «уже
работает». PostHog на целевой странице — второй слой аналитики; расхождение
со сканами = «сканы vs дошедшие».

## Ивент-режим на сайте

- Страницы сайта остаются статическими. Клиентский `<EventBanner/>` в layout
  fetch'ит `suslicke.com/api/event-status` (nginx → qr-hub, отдаёт **только**
  `{active,name}`, nginx proxy_cache 30s — qr-hub не долбится на каждый визит).
- Баннер: пульсирующая точка + «Я сейчас на {ивент} — подойди поздороваться»
  + **inline-кнопка Telegram** (человек в 20 метрах — самый короткий CTA).
- Попап-опрос (паттерн QrWelcome студии: radix Dialog, закрытие только ✕/Skip,
  чтобы consent-баннер его не сбивал): «Вы увидели QR на {ивент}?» → да, тут /
  футболка на улице / от знакомого / другое + обязательный free-text.
  Once-per-**event** через `localStorage sl_ev_<slug>`. Показывать только
  first-touch `utm_source=shirt|qr`.
- Ответ → POST `/api/event-survey` (nginx → qr-hub, same-origin — без CORS)
  → запись в SQLite + **мгновенное сообщение в Telegram через нового бота**.

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
- **OG — build-time** (скрипт satori + resvg в devDeps генерит 9 PNG:
  4 персоны × 2 локали + дефолт в `/public/og/`). Runtime next/og на своём
  сервере технически можно, но не нужно: Telegram кэширует OG навсегда
  (@WebpageBot для сброса) — динамика не доедет. Дизайн: лицо + имя + строка
  персоны. Проверить превью **до** печати QR.
- `next/image`-оптимизатор на self-hosted работает штатно — используем
  (в отличие от Workers, где был `images.unoptimized`).

## Аналитика

- PostHog EU, consent-gated как на студии (`opt_out_capturing_by_default`,
  `person_profiles`), consent-баннер снизу; ивент-попап закрывается только
  ✕/Skip — не конфликтуют. События: `persona_selected`, `persona_switch`,
  `tg_click`/`wa_click` (channel+persona+UTM), `vcard_download`,
  `qr_survey_response`. UTM first-touch — паттерн utm-capture студии.
- Сырые сканы /qr — `qr_scans` в SQLite qr-hub (+ `/today` бота).

## Деплой (netcup)

- Один репо, compose в `/opt/suslicke` с **двумя сервисами**: `web`
  (node:22-alpine, `next build`, `output: standalone`) и `qr-hub`
  (python:3.12-slim, FastAPI + aiogram polling, volume для SQLite).
  Оба порта только на `127.0.0.1`, `restart: always`.
- nginx: `/etc/nginx/conf.d/suslicke.com.conf` — страницы → `web`;
  `/qr`, `/api/event-status`, `/api/event-survey`, `/api/qr-config` → `qr-hub`;
  `@qr_fallback` на 502. HTTP→HTTPS, HSTS.
- Certbot для suslicke.com (+ www) — wildcard студии этот домен НЕ покрывает.
- CI: GitHub Actions на push в main → build → ssh netcup → pull/restart
  (паттерн platform). Секреты: `BOT_TOKEN` (новый бот из BotFather),
  `ADMIN_CHAT_ID`, `ADMIN_API_TOKEN` — в `.env` на сервере (chmod 600);
  PostHog key (build-time NEXT_PUBLIC) — в GitHub Actions secrets.
- **suslicketeam-platform и лид-бот не затрагиваются вообще.**

## Фазы

**Фаза 1 (MVP, можно печатать футболку):** каркас (i18n, seo, layout, палитра)
→ hero + sticky-CTA + чипы → 4 персона-страницы с контентом → /vcard.vcf →
qr-hub (редирект + бот `/qr`/`/event`/`/today` + survey) → Docker+nginx+
certbot+CI → ивент-режим на сайте (баннер + попап) → PostHog → OG build-time
→ GSC. 3D-фаза 1: воксельный QR (сборка из частиц, интерактив) **без** суслика.

**Фаза 2:** морф QR → суслик (SVG-силуэт → точки), реакции на персону,
ленточка в ивент-режиме; /admin-страница поверх API qr-hub (до неё всё
управляется ботом).

**Фаза 3 (по желанию):** runtime CV PDF из persona-content.ts, Sentry,
динамический дефолт-персона по типу ивента.

## Риски

1. 3D на бюджетных Android (основной сканирующий девайс) — lazy-mount, DPR
   clamp, авто-деградация, реальный тест на дешёвом устройстве до релиза.
2. Морф из SVG-сэмплинга — самая техноёмкая часть → фаза 2; запасной план
   crossfade.
3. Силуэт суслика — нужен приличный SVG; плохой талисман хуже отсутствия.
4. **VPS — единая точка отказа** (там же CRM, platform, почта): упал сервер
   посреди ивента — QR мёртв. Принято осознанно (решение против Cloudflare).
   Митигация: nginx `@qr_fallback` (редирект живёт, пока жив nginx),
   healthcheck-мониторинг (UptimeRobot/бот), бэкапы как у platform.
5. Двойной бренд: личный сайт продаёт **знакомство**, студия — **проект**;
   biz-персона явно мостит на suslicketeam.com, кейсы не копировать —
   ссылаться.
6. Контент 4 персоны × 2 языка — единый типизированный источник
   `persona-content.ts`, из него и страницы, и CV.
7. Сканируемость 3D-QR с экрана (блики/углы) — EC level H, пауза сборки при
   наведении; если не взлетит — сцена остаётся красивой, ссылка не теряется.
8. HR-персона: в резюме Berlin, на сайте Алматы — согласовать легенду до CV.
