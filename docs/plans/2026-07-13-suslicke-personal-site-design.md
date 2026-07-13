# suslicke.com — персональный сайт + suslicke-hub (дизайн)

Дата: 2026-07-13. Статус: дизайн утверждён, реализация не начата.
Живёт пока в репо студии; при создании репо сайта — переносится туда.

Ревизии: (2) хостинг **netcup VPS вместо Cloudflare** (без CF-ограничений,
свой бекенд под рукой). (3) **отдельный новый Telegram-бот** —
suslicketeam-platform не трогаем (разные проекты не ломают друг друга).
(4) бекенд назван **suslicke-hub** (не «-platform» — на сервере уже есть
`/opt/platform`, два platform = путаница), **Postgres вместо SQLite**,
скоуп hub расширен: QR + **счётчик визитов** + **изменяемые настройки
сайта** + админ-UI; порты — блок **18xxx** (см. Деплой).

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

- **Один новый репозиторий, два приложения**: `web` (Next.js 15 App Router +
  TypeScript + Tailwind v4 + next-intl **RU+EN**, без KK + motion v12) и
  **`hub`** (suslicke-hub: FastAPI + aiogram + **Postgres 16** — пользователь
  привык к Postgres; конвенция сервера — свой контейнер БД на проект).
- **Хостинг — netcup VPS** (ssh `netcup`): docker compose в `/opt/suslicke`,
  nginx-vhost `suslicke.com`, **свой certbot-серт** (wildcard покрывает только
  `*.suslicketeam.com`). CI: GitHub Actions push-to-main → ssh-деплой.
  DNS suslicke.com → A-запись на netcup IP.
- **Отдельный новый бот** (создать в BotFather, напр. `@suslicke_qr_bot`),
  aiogram **polling** — без webhook и публичного порта; allowlist = chat_id
  Андрея. **suslicketeam-platform и лид-бот не затрагиваются.**
- **suslicke-hub — не только QR**: динамический /qr + ивент-режим +
  **first-party счётчик посещений** (cookieless) +
  **site_settings** (изменяемые без деплоя настройки сайта) + мини админ-UI.
- **Персоны** — 4 статических роута: `/{locale}/{biz|dev|hr|hi}`.
  Короткие слаги: для SEO разница с `/for/business` пренебрежима (цель —
  брендовые запросы по имени), зато короткий слаг диктуется вслух на ивенте.
- **3D** — React Three Fiber, морф «QR → суслик» (фаза 1 — только QR).
- **Аналитика** — PostHog EU consent-gated (воронки/replay) + собственный
  счётчик hub (все визиты, без cookie).

## Структура страниц

| Путь | Что |
|---|---|
| `/{locale}` | Hero (имя + строка + фото), чипы «Кто вы?», нейтральный вид без выбора, sticky-CTA |
| `/{locale}/biz` | Кейсы с бизнес-результатами (телерадиология 10+ клиник, ADMP PRO WB/Ozon, SciOffice), блок «есть студия» → мост на suslicketeam.com, CTA WhatsApp студии |
| `/{locale}/dev` | Стек по слоям, таймлайн опыта (DICOM/PACS, Kafka, Celery), GitHub, секция **«Как устроен этот сайт»** (R3F, nginx→FastAPI, свой VPS — сайт как открытый кейс), CTA Telegram |
| `/{locale}/hr` | Резюме-вид: роли/годы/команды, LinkedIn, «Скачать CV (PDF)» — статический файл + print-friendly `/cv`, CTA email/LinkedIn |
| `/{locale}/hi` | Неформально: фото, интересы, Алматы, Instagram + Telegram, CTA «просто напиши привет» |
| `/qr` | **nginx → hub**: 307 на `/?utm_…` из Postgres-конфига, лог скана |
| `/vcard.vcf` | Route handler сайта, vCard 3.0 (точка в пути минует i18n-matcher) |
| `/api/event-status` | **nginx → hub**: публичный `{active,name}`, nginx proxy_cache 30s |
| `/api/event-survey` | **nginx → hub**: POST ответов попапа → сообщение боту |
| `/api/hit` | **nginx → hub**: beacon визитов (см. Счётчик) |
| `/hub/*` | **nginx → hub**: админ-UI (логин, noindex) — статистика + настройки |
| `/privacy` | Короткая политика (PostHog + собственный счётчик) |

Управление: **команды бота** (основной путь, с телефона на ивенте) +
админ-UI `/hub` (то же руками, плюс графики — «оба сразу», как решено ранее).

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
столбиком** (точки из SVG-силуэта; морф — lerp позиций в шейдере, запасной
план — crossfade двух облаков). Суслик следит за пальцем/gyro, «кивает» при
выборе персоны, акцент вокселей = цвет персоны. В ивент-режиме — мини-ленточка.

Техника (версии проверены на 2026-07): `three@0.185.x` +
`@react-three/fiber@9.6.x` (peer react >=19 <19.3 — пиновать react) +
`@react-three/drei@10.7.x`. Монтирование — три файла: серверный Hero
(LCP-текст) → тонкий `"use client"` wrapper c `dynamic(import, {ssr:false})`
(**ssr:false разрешён только в client component**) → сцена. Референс:
`src/components/hero/aurora-mount.tsx` студии. Чанк ~200 КБ gzip грузится
после idle (`requestIdleCallback`), **до** загрузки проверяется
`prefers-reduced-motion` — если reduce, чанк не качается вовсе, статичный
SVG-постер. three client-only (ради LCP). `dpr={[1,1.75]}`,
`antialias:false`, `PerformanceMonitor onDecline → dpr 1`, пауза оффскрин
через IntersectionObserver, fallback на отсутствие WebGL. Без
Environment-пресетов (качают HDRI с CDN), без GLTF — геометрия процедурная.

Палитра — тёплая «степная» light-first: песочный / терракота / вечерний синий;
акценты персон: biz янтарь, dev терминальный зелёный, hr синий, hi коралл.
Сознательно не emerald/gold студии. Light по умолчанию — сканируют днём на улице.

## suslicke-hub — бекенд (в репо сайта)

Один Python-сервис: FastAPI + aiogram polling (asyncio-таск в lifespan) +
SQLAlchemy/asyncpg → **Postgres 16** (свой контейнер, volume, как у platform).

Таблицы:

```
qr_config:      id=1 (одна строка), target, utm_source, utm_medium, utm_campaign,
                event_active, event_name, event_slug, event_default_persona,
                event_started_at, updated_at, updated_by
qr_scans:       id, ts, campaign, event_slug, country?, ua_hash
survey_answers: id, ts, event_slug, answer, free_text, persona, utm
page_views:     id, ts, path, locale, persona?, referrer_host, utm_source?,
                country?, visitor_hash (sha256(ip+ua+день) — уникальные за день
                без cookie), is_bot
site_settings:  key, value(jsonb), updated_at  -- изменяемое без деплоя
```

Эндпоинты (nginx проксирует с suslicke.com, same-origin — без CORS):

- `GET /qr` — конфиг из Postgres (кэш в памяти ~5с), запись в `qr_scans`,
  307 на `https://suslicke.com/?utm_…` (+ `?as=` дефолтной персоны при
  ивенте). **Захардкоженный дефолт в хендлере + nginx-фолбэк**
  (`error_page 502 = @qr_fallback` → `return 307 /?utm_source=shirt&…`) —
  QR на футболке не умеет падать даже при мёртвом hub.
- `GET /api/event-status` — публичный, только `{active, name}`, proxy_cache 30s.
- `POST /api/event-survey` — sanitize + rate-limit, запись + **мгновенное
  сообщение Андрею через бота**.
- `POST /api/hit` — счётчик визитов (см. ниже).
- `GET /api/settings` — публичные site_settings (кэш 60с) — сайт читает
  изменяемые без деплоя вещи (статус «open to projects», текст плашки и т.п.).
- `GET/PATCH /api/qr-config`, `PATCH /api/settings/{key}` — только из
  админ-UI (сессия после логина). Валидация target — allowlist (`/…`,
  suslicke.com, suslicketeam.com) — анти-open-redirect.
- `/hub/*` — **админ-UI**: логин (пароль в env, session cookie), дашборд —
  визиты за день/неделю (по страницам/персонам/utm), сканы /qr, ответы
  опросов, формы qr_config и site_settings. FastAPI + Jinja + htmx —
  без второго фронтенд-стека. `noindex`, rate-limit логина.

Команды бота (allowlist = chat_id Андрея):

- `/qr set campaign kazdevfest`, `/qr status` (+ кликабельный итоговый URL)
- `/event start KazDevFest` — **атомарно**: event_active + event_slug +
  utm_campaign=slug; `/event stop` — выключить и вернуть дефолтный campaign
- `/today` — визиты, сканы, ответы опросов за день
- `/set <key> <value>` — быстрые site_settings с телефона

Изменения применяются **мгновенно** (своя база) — бот подтверждает «уже работает».

## Счётчик визитов (first-party, cookieless)

Клиентский beacon в layout сайта: `navigator.sendBeacon('/api/hit', {path,
locale, persona, referrer, utm_source})` на каждую навигацию. Hub добавляет
country (из заголовка/GeoIP опционально), `visitor_hash = sha256(ip + ua +
дата)` — оценка уникальных за день **без cookie и без consent** (хэш
суточный, персональные данные не хранятся — короткий абзац в /privacy).
Фильтр ботов по UA. Смотреть: `/today` в боте + дашборд `/hub`.
PostHog (consent-gated) остаётся вторым слоем — воронки persona→CTA, replay;
расхождение hub-счётчика и PostHog = метрика «все visitors vs согласившиеся».

## Ивент-режим на сайте

- Страницы сайта остаются статическими. Клиентский `<EventBanner/>` в layout
  fetch'ит `/api/event-status` (nginx → hub, proxy_cache 30s).
- Баннер: пульсирующая точка + «Я сейчас на {ивент} — подойди поздороваться»
  + **inline-кнопка Telegram** (человек в 20 метрах — самый короткий CTA).
- Попап-опрос (паттерн QrWelcome студии: radix Dialog, закрытие только ✕/Skip,
  чтобы consent-баннер его не сбивал): «Вы увидели QR на {ивент}?» → да, тут /
  футболка на улице / от знакомого / другое + обязательный free-text.
  Once-per-**event** через `localStorage sl_ev_<slug>`. Показывать только
  first-touch `utm_source=shirt|qr`.
- Ответ → POST `/api/event-survey` → Postgres + **мгновенное сообщение в
  Telegram через нового бота**.

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
- **OG — build-time** (satori + resvg в devDeps, 9 PNG: 4 персоны × 2 локали
  + дефолт в `/public/og/`). Telegram кэширует OG навсегда (@WebpageBot для
  сброса) — проверить превью **до** печати QR. Дизайн: лицо + имя + строка
  персоны.
- `next/image`-оптимизатор на self-hosted работает штатно — используем.
- `/hub` и `/api` — noindex/disallow в robots.

## Деплой (netcup) — порты

Снято с сервера 2026-07-13: заняты блоки 17xxx (platform), 81xx (loyrush),
4000 (twenty), 543xx (supabase), 3001 (uptime-kuma), 5001 (dockge), 5432/5435
(postgres), почтовые. **suslicke берёт свободный блок 18xxx**, всё строго
`127.0.0.1` (наружу — только через nginx):

| Сервис | Порт |
|---|---|
| `suslicke-web` (Next.js standalone) | `127.0.0.1:18000` |
| `suslicke-hub` (FastAPI + бот) | `127.0.0.1:18001` |
| `suslicke-postgres` (postgres:16) | `127.0.0.1:18432` |

- Compose в `/opt/suslicke`, три сервиса, `restart: always`, healthchecks;
  volume для Postgres; pg_dump-бэкап кроном (как у platform).
- nginx `/etc/nginx/conf.d/suslicke.com.conf`: `/` → 18000; `/qr`,
  `/api/event-status`, `/api/event-survey`, `/api/hit`, `/api/settings`,
  `/api/qr-config`, `/hub/` → 18001; `@qr_fallback` на 502; HTTP→HTTPS, HSTS.
- Certbot для suslicke.com + www.
- CI: GitHub Actions push-to-main → build → ssh netcup → pull/restart.
  Секреты hub (`BOT_TOKEN`, `ADMIN_CHAT_ID`, `HUB_ADMIN_PASSWORD`,
  `POSTGRES_PASSWORD`) — в `/opt/suslicke/.env` (chmod 600, как у Twenty);
  PostHog key (build-time NEXT_PUBLIC) — в GitHub Actions secrets.
- Мониторинг: добавить `https://suslicke.com/qr` (ожидаемый 307) и
  `/api/event-status` в **уже работающий uptime-kuma (:3001)**.
- **suslicketeam-platform и лид-бот не затрагиваются вообще.**

## Аналитика (сводка)

- Hub-счётчик: все визиты, cookieless, `/today` + дашборд `/hub`.
- PostHog EU consent-gated (как на студии): `persona_selected`,
  `persona_switch`, `tg_click`/`wa_click` (channel+persona+UTM),
  `vcard_download`, `qr_survey_response`; UTM first-touch — паттерн
  utm-capture студии.
- Сканы /qr — `qr_scans` (боту в `/today`).

## Фазы

**Фаза 1 (MVP, можно печатать футболку):** каркас web (i18n, seo, layout,
палитра) → hero + sticky-CTA + чипы → 4 персона-страницы с контентом →
/vcard.vcf → hub: Postgres + /qr + бот (`/qr`, `/event`, `/today`) + survey +
hit-счётчик → Docker+nginx+certbot+CI+uptime-kuma → ивент-режим на сайте
(баннер + попап) → PostHog → OG build-time → GSC. 3D-фаза 1: воксельный QR
(сборка из частиц, интерактив) **без** суслика.

**Фаза 2:** морф QR → суслик (SVG-силуэт → точки), реакции на персону,
ленточка в ивент-режиме; админ-UI `/hub` (дашборд + формы; до него всё
управляется ботом); `/set` в боте.

**Фаза 3 (по желанию):** runtime CV PDF из persona-content.ts, Sentry,
динамический дефолт-персона по типу ивента, GeoIP для стран в счётчике.

## Риски

1. 3D на бюджетных Android (основной сканирующий девайс) — lazy-mount, DPR
   clamp, авто-деградация, реальный тест на дешёвом устройстве до релиза.
2. Морф из SVG-сэмплинга — самая техноёмкая часть → фаза 2; запасной план
   crossfade.
3. Силуэт суслика — нужен приличный SVG; плохой талисман хуже отсутствия.
4. **VPS — единая точка отказа** (там же CRM, platform, почта): упал сервер
   посреди ивента — QR мёртв. Принято осознанно. Митигация: nginx
   `@qr_fallback` (редирект живёт, пока жив nginx), uptime-kuma, pg-бэкапы.
5. Двойной бренд: личный сайт продаёт **знакомство**, студия — **проект**;
   biz-персона явно мостит на suslicketeam.com, кейсы не копировать —
   ссылаться.
6. Контент 4 персоны × 2 языка — единый типизированный источник
   `persona-content.ts`, из него и страницы, и CV.
7. Сканируемость 3D-QR с экрана (блики/углы) — EC level H, пауза сборки при
   наведении; если не взлетит — сцена остаётся красивой, ссылка не теряется.
8. HR-персона: в резюме Berlin, на сайте Алматы — согласовать легенду до CV.
9. Админ-UI `/hub` — поверхность атаки: логин с rate-limit, session cookie
   `Secure/HttpOnly/SameSite=Strict`, noindex; ничего публичного из
   qr_config наружу кроме `{active,name}`.
