# API — Baba de Aluguel / Diarista de Aluguel

Backend real do app: Elysia (Bun) + DrizzleORM + PostgreSQL (Neon), com autenticação por roles e integração de pagamento (Mercado Pago).

Ver o plano completo de arquitetura em `../` (histórico da conversa) — resumo rápido abaixo.

## Rodar localmente

1. Instale as dependências (uma vez): `bun install`
2. Copie `.env.example` para `.env` e preencha:
   - `DATABASE_URL`: crie um projeto grátis em [neon.tech](https://neon.tech) e cole a connection string.
   - `JWT_SECRET`: qualquer string longa aleatória.
   - `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY`: credenciais de **teste** do Mercado Pago (Painel > Suas integrações > sua aplicação).
3. Gere e aplique as migrations: `bun run db:generate && bun run db:migrate`
4. Suba o servidor: `bun run dev` (recarrega sozinho ao salvar)
5. Acesse `http://localhost:3000/docs` para a documentação Swagger interativa.

## Estrutura

Ver `src/` — um módulo por domínio (`modules/auth`, `modules/users`, `modules/professionals`, etc.), cada um com `controller` (HTTP), `service` (regra de negócio), `model` (tabelas Drizzle), `schema` (validação de entrada/saída), `routes` (registro das rotas) e `types`.

## Deploy (Render)

- Runtime: Bun
- Build command: `bun install`
- Start command: `bun run start`
- Variáveis de ambiente: as mesmas do `.env`, configuradas no painel do Render (nunca commitadas).
- Configure o webhook do Mercado Pago apontando para `https://<seu-servico>.onrender.com/api/webhooks/mercadopago`.
