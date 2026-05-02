# Dashboard Interna de Leads

## Escopo

Implementacao de uma area administrativa isolada em `/admin-interno`, sem alteracao de componentes, rotas, layout, CSS ou copy do site publico.

## Estrutura criada

- Area interna isolada: `src/app/admin-interno/**`
- API interna protegida: `src/app/admin-interno/api/**`
- Endpoint publico de captura de leads: `src/app/api/leads/route.ts`
- Modulos internos: `src/lib/admin-interno/**`
- CSS exclusivo da dashboard: `src/styles/dashboard/**`

## Banco SQL (Prisma)

Modelos adicionados:

- `admin_roles`
- `admin_users`
- `internal_admin_sessions`
- `internal_ip_locks`
- `internal_login_attempts`
- `leads`
- `lead_notes`
- `lead_tags`
- `lead_tag_relations`
- `lead_status_history`
- `notification_recipients`
- `notification_logs`
- `notification_jobs`
- `audit_logs`
- `analytics_visitors`
- `analytics_sessions`
- `analytics_events`
- `crm_accounts`
- `crm_contacts`
- `crm_deals`
- `crm_activities`
- `crm_tasks`

Migration criada:

- `prisma/migrations/20260421093000_internal_dashboard/migration.sql`

## Seguranca implementada

- Login por e-mail e senha com hash seguro (`scrypt`).
- Politica de senha forte (minimo de 12 caracteres + complexidade).
- Sessao por cookie seguro (`httpOnly`, `secure`, `sameSite=strict`, escopo `/admin-interno`).
- Expiracao absoluta e timeout por inatividade.
- Rotacao/revogacao de sessoes no login e reset de senha.
- Logout seguro com revogacao server-side.
- Controle RBAC (`SUPERADMIN`, `ADMIN`, `VISUALIZADOR`).
- Validacao por permissao em todas as rotas sensiveis.
- CSRF para operacoes mutaveis (`x-admin-csrf-token` + cookie).
- Bloqueio temporario contra brute force por usuario e IP.
- Validacao rigorosa de input com Zod.
- Sanitizacao de campos e mitigacao de CSV Injection.
- Protecao de indexacao na area interna (`noindex` + `robots` + `X-Robots-Tag`).
- Auditoria de eventos criticos e acoes administrativas.

## Leads

- Captura de lead no endpoint publico `/api/leads`.
- Persistencia SQL relacional completa.
- Campos de lead com origem e UTMs.
- Estados: `NOVO`, `EM_ANALISE`, `CONTATADO`, `QUALIFICADO`, `CONVERTIDO`, `PERDIDO`, `SPAM`.
- Prioridade: `BAIXA`, `MEDIA`, `ALTA`, `URGENTE`.
- Historico de alteracoes e observacoes internas.
- Atribuicao de responsavel.
- Exportacao CSV com controle de permissao.
- Vinculo automatico do lead com visitante/sessao de analytics.

## Analytics

- Coleta server-side de pageviews via `src/proxy.ts` (sem script exposto no site publico).
- Cookies internos de rastreio (`credpago_anonymous_id` e `credpago_session_id`) com politica segura.
- Captura de origem, UTMs, geolocalizacao aproximada, dispositivo, browser e sistema operacional.
- Trilha de jornada por sessao e visitante em SQL (`analytics_events`).
- Conversao de lead registrada no funil analytics (`LEAD_SUBMITTED`).
- Dashboard interna em `/admin-interno/analytics` com metricas, top paginas e fontes.

## CRM

- Pipeline comercial em SQL (`crm_deals`) com etapas:
  - `NOVO_CONTATO`, `DIAGNOSTICO`, `PROPOSTA`, `NEGOCIACAO`, `GANHO`, `PERDIDO`
- Estrutura relacional com contas, contatos, atividades e tarefas.
- Vinculo com leads (`leadId`) para acompanhar conversao ponta a ponta.
- APIs internas protegidas para criacao/edicao de negocios, atividades e tarefas.
- Dashboard CRM em `/admin-interno/crm` com visao de pipeline e operacao diaria.

## Alertas de e-mail

- Cadastro de destinatarios (`notification_recipients`).
- Ativacao/desativacao por destinatario.
- Fila de envio (`notification_jobs`) com retry exponencial por janela.
- Logs de sucesso/falha (`notification_logs`).
- Execucao manual da fila: `POST /admin-interno/api/notifications/process`.

## Variaveis de ambiente

Ver `.env.example` para todas as variaveis novas.

Principais:

- Sessao e protecao:
  - `INTERNAL_SESSION_TTL_HOURS`
  - `INTERNAL_SESSION_IDLE_TIMEOUT_MINUTES`
  - `INTERNAL_LOGIN_USER_MAX_ATTEMPTS`
  - `INTERNAL_LOGIN_IP_MAX_ATTEMPTS`
  - `INTERNAL_LOGIN_WINDOW_MINUTES`
  - `INTERNAL_LOGIN_LOCK_MINUTES`
  - `ANALYTICS_INGEST_TOKEN`

- Seed da area interna:
  - `INTERNAL_ADMIN_EMAIL`
  - `INTERNAL_ADMIN_PASSWORD`
  - `INTERNAL_ADMIN_NAME`
  - `INTERNAL_ADMIN_ROLE`

- SMTP e notificacoes:
  - `INTERNAL_ALERT_FROM`
  - `INTERNAL_SMTP_HOST`
  - `INTERNAL_SMTP_PORT`
  - `INTERNAL_SMTP_USER`
  - `INTERNAL_SMTP_PASS`
  - `INTERNAL_SMTP_SECURE`
  - `INTERNAL_NOTIFICATION_MAX_ATTEMPTS`
  - `INTERNAL_NOTIFICATION_PROCESS_TOKEN` (opcional)

## Operacao

1. Gerar client Prisma:
   - `npm run prisma:generate`
2. Aplicar migration no ambiente alvo:
   - `npm run prisma:migrate`
3. Popular usuario interno inicial:
   - `npm run prisma:seed`
4. Executar aplicacao:
   - `npm run dev`

## Observacao de isolamento

Nao foi adicionada nenhuma navegacao publica para `/admin-interno`. A dashboard permanece oculta do site publico e com estilos isolados.
