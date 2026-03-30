ALTER TABLE app.email_verification_token
    ADD COLUMN IF NOT EXISTS code_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS code_salt VARCHAR(80);

UPDATE app.email_verification_token
SET code_hash = COALESCE(code_hash, token_hash),
    code_salt = COALESCE(code_salt, 'legacy')
WHERE code_hash IS NULL OR code_salt IS NULL;

ALTER TABLE app.email_verification_token
    ALTER COLUMN code_hash SET NOT NULL,
    ALTER COLUMN code_salt SET NOT NULL;
