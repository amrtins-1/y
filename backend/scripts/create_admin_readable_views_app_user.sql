-- Human-readable operational view focused on app_user
-- Run with:
--   psql -d instituto_site -f backend/scripts/create_admin_readable_views_app_user.sql

DROP VIEW IF EXISTS app.vw_admin_users CASCADE;
CREATE VIEW app.vw_admin_users AS
SELECT
    u.id                                      AS user_id,
    u.full_name                               AS nome_completo,
    u.email                                   AS email,
    u.phone                                   AS telefone,
    u.cpf                                     AS cpf,
    u.role                                    AS role_code,
    CASE u.role
        WHEN 'ADMIN' THEN 'Administrador'
        WHEN 'MEMBER' THEN 'Membro'
        ELSE 'Nao mapeado'
    END                                       AS role_label,
    u.is_active                               AS ativo,
    u.preferred_lang                          AS idioma_preferido,
    u.last_login_at                           AS ultimo_login_em,
    u.created_at                              AS criado_em,
    u.updated_at                              AS atualizado_em
FROM app.app_user u;
