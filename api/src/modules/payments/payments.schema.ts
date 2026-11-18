import { t } from "elysia";

export const previewMensalidadePriceQuery = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
});

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

export const confirmMensalidadeAppleBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  // JWS da transação (StoreKit 2 `jwsRepresentation`), assinado pela Apple.
  signedTransaction: t.String({ minLength: 20, maxLength: 20000 }),
});

export const appleNotificationBody = t.Object({
  signedPayload: t.String({ minLength: 20, maxLength: 100000 }),
});
