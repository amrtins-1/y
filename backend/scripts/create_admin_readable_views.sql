-- Human-readable operational views (PostgreSQL)
-- Run with:
--   psql -d <database> -f backend/scripts/create_admin_readable_views.sql
-- Notes:
-- - Views are read-only by design for operations/reporting.
-- - Base tables remain unchanged; this improves observability/logistics.

-- 1) Users
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

-- 2) Contact messages
DROP VIEW IF EXISTS app.vw_admin_contact_messages CASCADE;
CREATE VIEW app.vw_admin_contact_messages AS
SELECT
    cm.id                                     AS mensagem_id,
    cm.user_id                                AS user_id,
    u.full_name                               AS usuario_nome,
    cm.name                                   AS contato_nome,
    cm.email                                  AS contato_email,
    cm.phone                                  AS contato_telefone,
    cm.subject                                AS assunto,
    cm.message                                AS mensagem,
    cm.country                                AS pais,
    cm.state                                  AS estado,
    cm.city                                   AS cidade,
    cm.is_manual_location                     AS localizacao_manual,
    cm.newsletter_opt_in                      AS optin_newsletter,
    cm.status                                 AS status_code,
    CASE cm.status
        WHEN 'NOVO' THEN 'Novo'
        WHEN 'EM_ANALISE' THEN 'Em analise'
        WHEN 'RESPONDIDO' THEN 'Respondido'
        WHEN 'ENCERRADO' THEN 'Encerrado'
        ELSE 'Nao mapeado'
    END                                       AS status_label,
    cm.created_at                             AS criado_em
FROM app.contact_message cm
LEFT JOIN app.app_user u ON u.id = cm.user_id;

-- 3) Consultancy requests
DROP VIEW IF EXISTS app.vw_admin_consultancy_requests CASCADE;
CREATE VIEW app.vw_admin_consultancy_requests AS
SELECT
    cr.id                                     AS solicitacao_id,
    cr.user_id                                AS user_id,
    u.full_name                               AS usuario_nome,
    cr.requester_name                         AS solicitante_nome,
    cr.requester_email                        AS solicitante_email,
    cr.requester_phone                        AS solicitante_telefone,
    cr.farm_name                              AS propriedade_nome,
    cr.country                                AS pais,
    cr.state                                  AS estado,
    cr.city                                   AS cidade,
    cr.is_manual_location                     AS localizacao_manual,
    cr.conflict_status                        AS conflito_code,
    CASE cr.conflict_status
        WHEN 'AMEACA' THEN 'Ameaca'
        WHEN 'INVADIDA_PARCIAL' THEN 'Invadida parcial'
        WHEN 'INVADIDA_TOTAL' THEN 'Invadida total'
        WHEN 'PROCESSO' THEN 'Em processo'
        WHEN 'OUTROS' THEN 'Outros'
        ELSE 'Nao mapeado'
    END                                       AS conflito_label,
    cr.involved_group                         AS grupo_envolvido,
    cr.case_report                            AS relato_caso,
    cr.status                                 AS status_code,
    CASE cr.status
        WHEN 'NOVO' THEN 'Novo'
        WHEN 'EM_ANALISE' THEN 'Em analise'
        WHEN 'RESPONDIDO' THEN 'Respondido'
        WHEN 'ENCERRADO' THEN 'Encerrado'
        ELSE 'Nao mapeado'
    END                                       AS status_label,
    cr.created_at                             AS criado_em,
    cr.updated_at                             AS atualizado_em
FROM app.consultancy_request cr
LEFT JOIN app.app_user u ON u.id = cr.user_id;

-- 4) Donations
DROP VIEW IF EXISTS app.vw_admin_donations CASCADE;
CREATE VIEW app.vw_admin_donations AS
SELECT
    d.id                                      AS doacao_id,
    d.user_id                                 AS user_id,
    u.full_name                               AS usuario_nome,
    d.donor_name                              AS doador_nome,
    d.donor_email                             AS doador_email,
    d.donor_phone                             AS doador_telefone,
    d.amount                                  AS valor,
    d.currency                                AS moeda,
    d.frequency                               AS frequencia_code,
    CASE d.frequency
        WHEN 'ONE_TIME' THEN 'Unica'
        WHEN 'MONTHLY' THEN 'Mensal'
        ELSE 'Nao mapeado'
    END                                       AS frequencia_label,
    d.status                                  AS pagamento_status_code,
    CASE d.status
        WHEN 'PENDING' THEN 'Pendente'
        WHEN 'PAID' THEN 'Pago'
        WHEN 'FAILED' THEN 'Falhou'
        WHEN 'REFUNDED' THEN 'Reembolsado'
        WHEN 'CANCELED' THEN 'Cancelado'
        ELSE 'Nao mapeado'
    END                                       AS pagamento_status_label,
    d.payment_provider                        AS provedor_pagamento,
    d.provider_payment_id                     AS pagamento_externo_id,
    d.receipt_url                             AS recibo_url,
    d.paid_at                                 AS pago_em,
    d.created_at                              AS criado_em
FROM app.donation d
LEFT JOIN app.app_user u ON u.id = d.user_id;

-- 5) Subscriptions
DROP VIEW IF EXISTS app.vw_admin_subscriptions CASCADE;
CREATE VIEW app.vw_admin_subscriptions AS
SELECT
    s.id                                      AS assinatura_id,
    s.user_id                                 AS user_id,
    u.full_name                               AS usuario_nome,
    s.plan_id                                 AS plano_id,
    mp.code                                   AS plano_code,
    mp.name                                   AS plano_nome,
    s.status                                  AS assinatura_status_code,
    CASE s.status
        WHEN 'ACTIVE' THEN 'Ativa'
        WHEN 'PAST_DUE' THEN 'Atrasada'
        WHEN 'CANCELED' THEN 'Cancelada'
        WHEN 'TRIALING' THEN 'Em teste'
        WHEN 'EXPIRED' THEN 'Expirada'
        ELSE 'Nao mapeado'
    END                                       AS assinatura_status_label,
    s.started_at                              AS inicio_em,
    s.current_period_start                    AS periodo_inicio_em,
    s.current_period_end                      AS periodo_fim_em,
    s.canceled_at                             AS cancelada_em,
    s.payment_provider                        AS provedor_pagamento,
    s.provider_customer_id                    AS cliente_externo_id,
    s.provider_subscription_id                AS assinatura_externa_id,
    s.created_at                              AS criado_em
FROM app.user_subscription s
JOIN app.app_user u ON u.id = s.user_id
JOIN app.membership_plan mp ON mp.id = s.plan_id;

-- 6) Newsletter subscribers
DROP VIEW IF EXISTS app.vw_admin_newsletter_subscribers CASCADE;
CREATE VIEW app.vw_admin_newsletter_subscribers AS
SELECT
    n.id                                      AS inscricao_id,
    n.email                                   AS email,
    n.name                                    AS nome,
    n.source                                  AS origem,
    n.is_active                               AS ativo,
    n.created_at                              AS inscrito_em,
    n.unsubscribed_at                         AS descadastrado_em
FROM app.newsletter_subscriber n;

-- 7) Market quotes with asset label
DROP VIEW IF EXISTS app.vw_admin_market_quotes CASCADE;
CREATE VIEW app.vw_admin_market_quotes AS
SELECT
    q.id                                      AS cotacao_id,
    q.asset_id                                AS ativo_id,
    a.code                                    AS ativo_code,
    a.label                                   AS ativo_label,
    a.category                                AS categoria,
    a.section                                 AS secao,
    q.price                                   AS preco,
    q.variation_pct                           AS variacao_pct,
    q.direction                               AS direcao_code,
    CASE q.direction
        WHEN 'UP' THEN 'Alta'
        WHEN 'DOWN' THEN 'Queda'
        WHEN 'EQUAL' THEN 'Estavel'
        WHEN 'UNKNOWN' THEN 'Indefinido'
        ELSE 'Nao mapeado'
    END                                       AS direcao_label,
    q.source                                  AS fonte,
    q.quoted_at                               AS cotado_em
FROM app.market_quote q
JOIN app.market_asset a ON a.id = q.asset_id;

-- 8) Active auth sessions
DROP VIEW IF EXISTS app.vw_admin_active_sessions CASCADE;
CREATE VIEW app.vw_admin_active_sessions AS
SELECT
    s.id                                      AS sessao_id,
    s.user_id                                 AS user_id,
    u.full_name                               AS usuario_nome,
    u.email                                   AS usuario_email,
    s.remember_me                             AS lembrar_sessao,
    s.ip                                      AS ip,
    s.user_agent                              AS user_agent,
    s.created_at                              AS criada_em,
    s.expires_at                              AS expira_em,
    s.revoked_at                              AS revogada_em,
    (s.revoked_at IS NULL AND s.expires_at > now()) AS ativa
FROM app.auth_session s
JOIN app.app_user u ON u.id = s.user_id;
