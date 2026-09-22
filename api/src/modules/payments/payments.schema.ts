import { t } from "elysia";

export const createMensalidadePixBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
});

export const createMensalidadeCardBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  token: t.String(),
  parcelas: t.Optional(t.Number({ minimum: 1, maximum: 12 })),
  issuerId: t.Optional(t.String()),
  paymentMethodId: t.String(),
});
