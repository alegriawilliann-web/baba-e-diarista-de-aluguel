import { t } from "elysia";

export const createJobPostBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  descricao: t.String({ minLength: 10, maxLength: 1000 }),
  bairro: t.Optional(t.String({ maxLength: 150 })),
  cidade: t.Optional(t.String({ maxLength: 150 })),
});

export const listOpenJobsQuery = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export const listMyApplicationsQuery = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
});

export const applyToJobBody = t.Object({
  mensagem: t.String({ minLength: 10, maxLength: 1000 }),
});

export const updateApplicationStatusBody = t.Object({
  status: t.Union([t.Literal("aceita"), t.Literal("recusada")]),
});
