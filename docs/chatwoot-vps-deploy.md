# Chatwoot на VPS — деплой и настройка (+ сравнение с Twenty)

Self-hosted Chatwoot (Docker Compose) как единый инбокс WhatsApp/Telegram/Instagram +
лёгкая CRM. Это **фаза 2** из `lead-tracking-system.md` — разворачивать, когда Sheets
начнёт жать (десятки активных лидов), не раньше.

Инструкции свериены с официальной докой (docs.chatwoot.com, docs.twenty.com).

---

## 0. Что понадобится

- **VPS:** Ubuntu 22.04+, **минимум 2 ГБ RAM, реально 4 ГБ** (Chatwoot = Rails + Sidekiq
  + Postgres + Redis, прожорлив). Напр. Hetzner CX22 (4 ГБ, ~€5.5/мес) или DigitalOcean.
- **Домен:** поддомен под CRM, напр. `crm.suslicketeam.com` → A-запись на IP VPS.
  (Основной сайт остаётся на Cloudflare — CRM живёт отдельно на VPS.)
- **Docker + Docker Compose** на сервере.
- Для WhatsApp — доступ к **WhatsApp Cloud API** (Meta Business). Telegram — бесплатно
  через бота.

---

## 1. Подготовка сервера

```bash
# на свежем VPS под root
apt update && apt upgrade -y
# Docker + Compose (официальный скрипт)
curl -fsSL https://get.docker.com | sh
# проверка
docker --version && docker compose version
```

DNS: в панели домена создай A-запись `crm → <IP сервера>`. Дай ей распространиться.

---

## 2. Скачать шаблоны Chatwoot

```bash
mkdir -p /opt/chatwoot && cd /opt/chatwoot
# .env-шаблон
wget -O .env https://raw.githubusercontent.com/chatwoot/chatwoot/develop/.env.example
# production docker-compose
wget -O docker-compose.yaml https://raw.githubusercontent.com/chatwoot/chatwoot/develop/docker-compose.production.yaml
```

> **Пин версии.** В `docker-compose.yaml` замени тег образа `chatwoot/chatwoot:latest`
> на конкретный стабильный релиз (напр. `:v4.x.y`) — чтобы апдейт был осознанным, а не
> «сломалось само при рестарте».

---

## 3. Настроить `.env` (главное)

Открой `.env` и заполни:

```env
# Адрес инсталляции
FRONTEND_URL=https://crm.suslicketeam.com
RAILS_ENV=production
NODE_ENV=production

# Секрет (сгенерируй: openssl rand -hex 64)
SECRET_KEY_BASE=<длинная_случайная_строка>

# PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_DATABASE=chatwoot_production
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=<сильный_пароль_БД>

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=<сильный_пароль_redis>

# Почта (для инвайтов агентов, сброса пароля, email-канала)
MAILER_SENDER_EMAIL=Suslicketeam <crm@suslicketeam.com>
SMTP_ADDRESS=<smtp-хост>      # напр. SendGrid/Postmark/Mailgun
SMTP_PORT=587
SMTP_USERNAME=<...>
SMTP_PASSWORD=<...>

# Часовой пояс
TZ=Asia/Almaty
```

> **Важно:** тот же `POSTGRES_PASSWORD` пропиши и в `docker-compose.yaml` (сервис
> postgres) — пароли должны совпадать, иначе приложение не подключится к БД.

---

## 4. Инициализировать БД и запустить

```bash
cd /opt/chatwoot
# подготовка БД (миграции + схема)
docker compose run --rm rails bundle exec rails db:chatwoot_prepare
# запуск в фоне
docker compose up -d
# логи
docker compose logs -f
```

Поднимутся: `rails` (web, :3000), `sidekiq` (фоновые задачи), `postgres`, `redis`.

---

## 5. Домен + HTTPS

**Вариант A (документированный) — Nginx + Let's Encrypt:**

```nginx
server {
  server_name crm.suslicketeam.com;
  set $upstream 127.0.0.1:3000;
  underscores_in_headers on;          # Chatwoot использует _ в заголовках API — обязательно
  location /.well-known {
    alias /var/www/ssl-proof/chatwoot/.well-known;
  }
  location / {
    proxy_pass http://$upstream;
    proxy_pass_header Authorization;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
    proxy_buffering off;
    client_max_body_size 0;
    proxy_read_timeout 36000s;         # длинные WebSocket-соединения чата
    proxy_redirect off;
  }
  listen 80;
}
```

```bash
apt install certbot python3-certbot-nginx -y
mkdir -p /var/www/ssl-proof/chatwoot/.well-known
certbot --webroot -w /var/www/ssl-proof/chatwoot/ -d crm.suslicketeam.com -i nginx
```

**Вариант B (проще) — Caddy:** авто-HTTPS из коробки, `Caddyfile` в 3 строки:
```
crm.suslicketeam.com {
    reverse_proxy 127.0.0.1:3000
}
```
Для соло я бы взял Caddy — меньше возни с сертификатами (обновляются сами).

---

## 6. Первый вход и настройка «внутри»

Открой `https://crm.suslicketeam.com` → **первая регистрация = супер-админ**.

Что настраивается в интерфейсе (это и есть «всё там»):

| Раздел | Что делаешь | Связь с твоей системой |
|---|---|---|
| **Inboxes** | подключаешь каналы (WA/TG/IG/email/веб-виджет) | сюда стекаются все первые касания |
| **Agents / Teams** | ты (+ команда позже) | кто ведёт диалог |
| **Labels** | метки лидов | **зеркалят `Статус`**: `написал/ответил/квалифицирован/КП/выиграл/слил` |
| **Canned responses** | заготовки ответов | твои `/бриф`, `/кейсы`, `/цена` из `whatsapp-messages.md` |
| **Automation rules** | авто-метки, авто-назначение | напр. новый диалог → метка `ответил` |
| **Contacts** | карточки контактов | CRM-часть: компания, телефон, заметки |
| **Reports** | метрики диалогов | время ответа, объём, по агентам |

> Лайфхак: **метки Chatwoot = твои enum-статусы**, а **canned responses = твои
> quick-replies**. То есть твой уже описанный процесс переносится 1:1.

---

## 7. Подключение каналов

- **Telegram (бесплатно, 2 минуты):** @BotFather → создаёшь бота → токен → в Chatwoot
  *Inboxes → Add → Telegram* → вставляешь токен. Готово.
- **WhatsApp (через Cloud API):** *Inboxes → Add → WhatsApp → API provider* →
  подключаешь номер через **Meta WhatsApp Cloud API** (нужен Meta Business аккаунт,
  верифицированный номер, permanent token). Альтернатива — 360dialog/Twilio как BSP.
  ⚠️ Личный WhatsApp Business (приложение) так не подключается — нужен именно Cloud API,
  и за разговоры Meta берёт плату. На старте проще оставить `wa.me`-ссылки + ручной лог.
- **Instagram / веб-чат / email** — аналогично, отдельными inbox'ами.

---

## 8. Эксплуатация

- **Бэкап:** ежедневный дамп Postgres (`docker compose exec postgres pg_dump …`) +
  папка хранилища (вложения). Складывай в S3/R2.
- **Апдейт:** поменял тег образа → `docker compose pull && docker compose up -d` →
  при необходимости миграции (`rails db:migrate`). Сначала бэкап.
- **Мониторинг:** healthcheck `/`, следи за RAM (Sidekiq любит память).

---

# Chatwoot vs Twenty — что выбрать

| Критерий | **Chatwoot** | **Twenty** |
|---|---|---|
| Суть | омниканальный **инбокс** + лёгкая CRM | классическая **CRM** (сделки/контакты) |
| Базовая единица | **диалог** (conversation) | **запись** (deal / contact) |
| Каналы из коробки | WA / TG / IG / email / веб-чат | нет (только CRM-данные) |
| Пайплайн сделок | слабый (метки, нет стадий-сделок) | **сильный** (канбан, стадии, суммы) |
| Стек | Ruby on Rails + Vue + Postgres + Redis + Sidekiq | TS/NestJS + React + Postgres + Redis |
| Установка | docker-compose, **~4 ГБ RAM**, больше частей | `install.sh` / compose, **~2 ГБ RAM**, легче |
| WhatsApp | **нативный inbox** (Cloud API) | только через интеграции/n8n |
| Отчёты | по диалогам (время ответа, нагрузка) | по продажам (воронка, выручка) |
| Зрелость | очень зрелый, большое комьюнити | моложе, быстро развивается, красивый UI |
| Лучшее «для чего» | **первый контакт в мессенджерах** | **пайплайн после квалификации** |

### Решение под твою модель

- Продажи начинаются в WhatsApp/Telegram → **первый контакт держит Chatwoot.** Как
  одиночный инструмент на старте фазы 2 — он полезнее: управляет самими разговорами, а
  не карточками о них.
- **Twenty** оправдан, когда появляется настоящая многостадийная воронка со сделками и
  суммами, которую надо вести как пайплайн.
- **Связка (позже):** Chatwoot = разговоры → квалифицированный лид уходит в Twenty =
  пайплайн (через API/n8n). Но соло на старте **держи что-то одно** — это Chatwoot.
- Если важнее лёгкость хостинга и красивый канбан, а каналы не нужны нативно → Twenty
  (легче по RAM, `bash <(curl -sL …/install.sh)` ставит в одну строку).

> **Не разворачивай ни то, ни другое сейчас.** На нуле лидов это yak-shaving. Sheets →
> поток → Chatwoot. Этот гайд — на момент, когда поток реально появится.
