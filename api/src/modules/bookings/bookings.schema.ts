import { t } from "elysia";

export const createBookingBody = t.Object({
  professionalId: t.String({ format: "uuid" }),
  scheduledDate: t.String(),
  scheduledTime: t.String(),
  servico: t.String({ minLength: 2, maxLength: 150 }),
  amountCents: t.Number({ minimum: 0 }),
  formaPagamento: t.Union([t.Literal("pix"), t.Literal("credito"), t.Literal("debito"), t.Literal("boleto")]),
});

export const listMineQuery = t.Object({
  as: t.Optional(t.Union([t.Literal("client"), t.Literal("professional")])),
});
