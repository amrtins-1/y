# Email Verification Setup

## What was implemented

1. Domain validation for email `@domain` already happens through DNS checks (MX/A) in:
- `EmailValidationService`

2. Account confirmation flow now exists (numeric code):
- User registers (`POST /api/users`)
- Account is created with `is_active = false`
- Verification code (6 digits) is generated and emailed
- User goes to `/confirmar-email` and submits email + code
- Account becomes active and redirects to `/login?emailConfirmed=1`

3. Login is blocked until email confirmation.

## New endpoints

- `POST /api/email-verification/request`
  - Body:
    ```json
    { "email": "usuario@dominio.com" }
    ```
  - Re-sends verification for inactive accounts.

- `POST /api/email-verification/confirm-code`
  - Body:
    ```json
    { "email": "usuario@dominio.com", "code": "123456" }
    ```
  - Activates account when code is valid.

- `GET /api/email-verification/confirm?token=<token>`
  - Marks token as used, activates account, redirects to frontend login.

## SMTP configuration (how to send real emails)

Set these environment variables on your server:

- `APP_MAIL_ENABLED=true`
- `APP_MAIL_FROM=no-reply@seu-dominio.com`
- `SMTP_HOST=smtp.seu-provedor.com`
- `SMTP_PORT=587`
- `SMTP_USER=seu-usuario-smtp`
- `SMTP_PASS=sua-senha-smtp`
- `SMTP_AUTH=true`
- `SMTP_STARTTLS=true`

Optional:

- `APP_FRONTEND_BASE_URL=https://seu-site.com`
- `APP_API_BASE_URL=https://api.seu-site.com`
- `APP_EMAIL_VERIFICATION_TTL_HOURS=24`

If `APP_MAIL_ENABLED=false`, the system keeps working but does not send email.

## Common SMTP examples

### Gmail (workspace/pessoal com senha de app)
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_AUTH=true`
- `SMTP_STARTTLS=true`

### Outlook / Microsoft 365
- `SMTP_HOST=smtp.office365.com`
- `SMTP_PORT=587`
- `SMTP_AUTH=true`
- `SMTP_STARTTLS=true`

## Database change required

Because JPA is in `ddl-auto=validate`, table creation must be done manually.

Run:

```bash
psql -h localhost -U postgres -d instituto_site -f backend/scripts/create_email_verification_table.sql
```
Alternative variable names also accepted:

- `EMAIL_SENDER` (same as `SMTP_USER`)
- `EMAIL_PASSWORD` (same as `SMTP_PASS`)
