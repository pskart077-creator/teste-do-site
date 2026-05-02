# Sistema de Crédito Credpagos

## Escopo

Módulo separado para simulação, solicitação, análise, proposta, contrato, status do cliente e gestão administrativa de crédito.

## Rotas públicas

- `/simular-credito`
- `/solicitacao/pf`
- `/solicitacao/mei`
- `/solicitacao/pj`
- `/solicitacao/status/[id]`
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
