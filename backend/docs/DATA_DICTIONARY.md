# Dicionario de Dados (Operacional)

Este documento descreve os campos principais para operacao humana no banco.

## Como usar

1. Execute o script de views legiveis:
`backend/scripts/create_admin_readable_views.sql`
2. Consulte as views `app.vw_admin_*` no lugar das tabelas brutas quando o foco for atendimento, financeiro e suporte.

## Views operacionais

### `app.vw_admin_users`
- Finalidade: leitura de usuarios com role/status legiveis.
- Chaves:
`user_id`, `nome_completo`, `email`, `telefone`, `cpf`, `role_label`, `ativo`, `ultimo_login_em`.

### `app.vw_admin_contact_messages`
- Finalidade: atendimento de mensagens de contato.
- Chaves:
`mensagem_id`, `contato_nome`, `contato_email`, `assunto`, `mensagem`, `status_label`, `criado_em`.

### `app.vw_admin_consultancy_requests`
- Finalidade: triagem juridica.
- Chaves:
`solicitacao_id`, `solicitante_nome`, `propriedade_nome`, `conflito_label`, `grupo_envolvido`, `status_label`.

### `app.vw_admin_donations`
- Finalidade: operacao financeira de doacoes.
- Chaves:
`doacao_id`, `doador_nome`, `valor`, `moeda`, `frequencia_label`, `pagamento_status_label`, `pago_em`.

### `app.vw_admin_subscriptions`
- Finalidade: controle de assinaturas.
- Chaves:
`assinatura_id`, `usuario_nome`, `plano_nome`, `assinatura_status_label`, `periodo_fim_em`, `cancelada_em`.

### `app.vw_admin_newsletter_subscribers`
- Finalidade: gestao de base de newsletter.
- Chaves:
`inscricao_id`, `email`, `nome`, `origem`, `ativo`, `inscrito_em`, `descadastrado_em`.

### `app.vw_admin_market_quotes`
- Finalidade: leitura de cotacoes com labels.
- Chaves:
`cotacao_id`, `ativo_code`, `ativo_label`, `preco`, `variacao_pct`, `direcao_label`, `cotado_em`.

### `app.vw_admin_active_sessions`
- Finalidade: auditoria de sessoes.
- Chaves:
`sessao_id`, `usuario_nome`, `usuario_email`, `ip`, `criada_em`, `expira_em`, `ativa`.

## Mapeamentos de enums (labels)

### `user.role`
- `ADMIN` -> `Administrador`
- `MEMBER` -> `Membro`

### `ticket.status` (`contact_message`, `consultancy_request`)
- `NOVO` -> `Novo`
- `EM_ANALISE` -> `Em analise`
- `RESPONDIDO` -> `Respondido`
- `ENCERRADO` -> `Encerrado`

### `consultancy_request.conflict_status`
- `AMEACA` -> `Ameaca`
- `INVADIDA_PARCIAL` -> `Invadida parcial`
- `INVADIDA_TOTAL` -> `Invadida total`
- `PROCESSO` -> `Em processo`
- `OUTROS` -> `Outros`

### `donation.frequency`
- `ONE_TIME` -> `Unica`
- `MONTHLY` -> `Mensal`

### `donation.status`
- `PENDING` -> `Pendente`
- `PAID` -> `Pago`
- `FAILED` -> `Falhou`
- `REFUNDED` -> `Reembolsado`
- `CANCELED` -> `Cancelado`

### `user_subscription.status`
- `ACTIVE` -> `Ativa`
- `PAST_DUE` -> `Atrasada`
- `CANCELED` -> `Cancelada`
- `TRIALING` -> `Em teste`
- `EXPIRED` -> `Expirada`

### `market_quote.direction`
- `UP` -> `Alta`
- `DOWN` -> `Queda`
- `EQUAL` -> `Estavel`
- `UNKNOWN` -> `Indefinido`

## Observacoes de seguranca

- As views sao para leitura operacional. Permissoes de escrita devem continuar nas tabelas de origem via API.
- Campos sensiveis (`refresh_token_hash`, ids externos de pagamento) permanecem tecnicos e nao devem ser usados como chave visual principal.
- Recomendacao: conceder `SELECT` das views para equipe operacional e restringir acesso direto a tabelas brutas.
