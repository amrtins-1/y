# Backend Java CRUD - Instituto

## Requisitos
- Java 17+
- Maven 3.9+
- PostgreSQL com schema `app`

## Configuração
As variáveis abaixo são opcionais (há defaults em `application.properties`):
- `DB_URL` (default: `jdbc:postgresql://localhost:5432/instituto_site`)
- `DB_USER` (default: `postgres`)
- `DB_PASSWORD` (default: `postgres`)
- `DB_SCHEMA` (default: `app`)

## Subir API
```bash
cd backend
mvn spring-boot:run
```

## Base URL
`http://localhost:8080/api`

## CRUDs disponíveis
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

## Operações por recurso
- `GET /{resource}` lista
- `GET /{resource}/{id}` detalhe
- `POST /{resource}` cria
- `PUT /{resource}/{id}` atualiza
- `DELETE /{resource}/{id}` remove
