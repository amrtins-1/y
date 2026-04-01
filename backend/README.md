# Backend NestJS - Instituto

## Requisitos
- Node.js 18+
- PostgreSQL com schema `app`

## Variaveis de ambiente (opcionais)
- `PORT` (default: 8080)
- `DB_URL` (default: `postgresql://localhost:5432/instituto_site`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD`
- `DB_SCHEMA` (default: `app`)
- `APP_ALLOWED_ORIGINS` (default: `http://localhost:4321,http://127.0.0.1:4321`)
- `APP_FRONTEND_BASE_URL` (default: `http://localhost:4321`)
- `APP_API_BASE_URL` (default: `http://localhost:8080`)
- `APP_TRUST_PROXY_HEADERS` (default: `false`)
- `APP_AUTH_COOKIE_SECURE` (default: `false`)
- `APP_AUTH_COOKIE_SAMESITE` (default: `Lax`)
- `APP_AUTH_LOGIN_MAX_ATTEMPTS` (default: `10`)
- `APP_AUTH_LOGIN_WINDOW_SECONDS` (default: `900`)
- `APP_AUTH_LOGIN_BLOCK_SECONDS` (default: `900`)
- `APP_EMAIL_VERIFICATION_TTL_HOURS` (default: `24`)
- `APP_EMAIL_DISPOSABLE_UPDATE_ENABLED` (default: `true`)
- `APP_EMAIL_DISPOSABLE_REFRESH_MS` (default: `86400000`)
- `APP_EMAIL_DISPOSABLE_SOURCES` (default: listas publicas)
- `APP_MAIL_ENABLED` (default: `true`)
- `APP_MAIL_FROM` (default: `no-reply@instituto.local`)
- `APP_SECURITY_HSTS_ENABLED` (default: `false`)

## SMTP
- `SMTP_HOST` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_AUTH` (default: `true`)
- `SMTP_STARTTLS` (default: `true`)
- `EMAIL_SENDER` (fallback do remetente)
- `EMAIL_PASSWORD` (fallback de senha)

## Subir API
```bash
cd backend
npm install
npm run start:dev
```

## Base URL
`http://localhost:8080/api`

## CRUDs disponiveis
- `/users`
- `/user-addresses`
- `/auth-sessions`
- `/membership-plans`
- `/user-subscriptions`
- `/donations`
- `/contact-messages`
- `/newsletter-subscribers`
- `/consultancy-requests`
- `/services`
- `/products`
- `/news-articles`
- `/videos`
- `/market-assets`
- `/market-quotes`
- `/market-watchlist`

## Operacoes por recurso
- `GET /{resource}` lista
- `GET /{resource}/{id}` detalhe
- `POST /{resource}` cria
- `PUT /{resource}/{id}` atualiza
- `DELETE /{resource}/{id}` remove
