import { t } from "elysia";

export const submitVerificationBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  documentType: t.Union([t.Literal("rg"), t.Literal("cnh"), t.Literal("cpf"), t.Literal("selfie")]),
  documentRef: t.String(),
});

export const reviewVerificationBody = t.Object({
  status: t.Union([t.Literal("approved"), t.Literal("rejected")]),
  notes: t.Optional(t.String()),
});
