CREATE TABLE IF NOT EXISTS app.email_verification_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app.app_user(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    code_hash VARCHAR(255) NOT NULL,
    code_salt VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user_open
    ON app.email_verification_token (user_id)
    WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at
    ON app.email_verification_token (expires_at);
