import { t } from "elysia";

export const submitTeamMemberBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  nome: t.String({ minLength: 2, maxLength: 150 }),
  cpf: t.String({ minLength: 11, maxLength: 14 }),
  certidaoNegativaUrl: t.Optional(t.String()),
});

export const reviewTeamMemberBody = t.Object({
  status: t.Union([t.Literal("approved"), t.Literal("rejected")]),
});
