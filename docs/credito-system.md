# Sistema de Crédito Credpagos

## Escopo

Módulo separado para simulação, solicitação, análise, proposta, contrato, status do cliente e gestão administrativa de crédito.

## Rotas públicas

- `/simular-credito`
- `/solicitacao/pf`
- `/solicitacao/mei`
- `/solicitacao/pj`
- `/solicitacao/status/[id]`
- `/cartao/emissao/[token]`
- `/cliente/login`
- `/cliente/cadastro`
- `/cliente/dashboard`

## Rotas administrativas

- `/admin/credito`
- `/admin/credito/solicitacoes`
- `/admin/credito/solicitacoes/[id]`
- `/admin/credito/propostas`
- `/admin/credito/contratos`
- `/admin/credito/pix`
- `/admin/credito/regras`
- `/admin/credito/auditoria`

## APIs principais

- `POST /api/credito/solicitacoes`
- `GET /api/credito/solicitacoes`
- `GET /api/credito/solicitacoes/[id]`
- `PATCH /api/credito/solicitacoes/[id]/status`
- `PATCH /api/credito/solicitacoes/[id]/proposta`
- `PATCH /api/credito/solicitacoes/[id]/contrato/aceite`
- `GET|POST /api/credito/solicitacoes/[id]/pix`
- `POST /api/credito/pix/webhook`
- `GET|PATCH /api/credito/regras`
- `POST /api/credito/uploads`
- `POST /api/credito/cartao/solicitacoes`
- `POST /api/credito/cartao/emissao/[token]/pix`
- `POST /api/credito/cartao/emissao/[token]/status`
- `GET|POST /api/credito/cartao/solicitacoes/emails/processar`
- `POST /api/cliente/cadastro`
- `POST /api/cliente/login`
- `POST /api/cliente/logout`
- `GET /api/cliente/me`

## Regra de simulação

Percentual de ajuste operacional padrão: `23%` (configurável no admin).

```
valorAjuste = valorSolicitado * (percentual/100)
valorLiquidoEstimado = valorSolicitado - valorAjuste
```

## PIX

Implementação com provider abstrato e provider `mock` funcional. O uso de PIX no módulo está limitado a obrigações contratuais legítimas (parcelas, quitação, entrada contratual permitida e cobrança administrativa autorizada).

## Variáveis de ambiente

Consulte `.env.example` para os parâmetros de integração PIX.

### E-mail de análise do cartão

O fluxo de solicitação do cartão agenda o resultado aprovado para envio 10 minutos após a conclusão da análise. O envio usa a API da Resend com o remetente `naoresponda@credpagos.com.br`. Configure `CREDPAGOS_RESEND_API_KEY` no ambiente. Opcionalmente, use `CREDPAGOS_RESEND_EMAILS_ENDPOINT` para sobrescrever o endpoint padrão da Resend e `CREDPAGOS_RESEND_FROM_EMAIL` para trocar o remetente.

O e-mail aprovado inclui um link individual de emissão em `/cartao/emissao/[token]`. Configure `CREDPAGOS_APP_URL` ou `NEXT_PUBLIC_SITE_URL` para gerar o link público correto em produção. Se essas variáveis não existirem, o sistema usa a origem da requisição ou `https://www.credpagos.com.br` como fallback.

O atraso padrão pode ser ajustado por `CREDPAGOS_APPROVAL_EMAIL_DELAY_MINUTES`, mas o valor configurado para o fluxo Credpagos deve permanecer `10`. O endpoint `/api/credito/cartao/solicitacoes/emails/processar` processa e-mails vencidos e é chamado pelo cron configurado em `vercel.json` a cada minuto. Para proteger esse endpoint, configure `CREDPAGOS_EMAIL_JOB_SECRET` ou `CRON_SECRET` e envie o valor em `Authorization: Bearer ...` ou `x-cron-secret`.
