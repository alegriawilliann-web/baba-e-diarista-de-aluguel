import { t } from "elysia";

export const createReviewBody = t.Object({
  professionalId: t.String({ format: "uuid" }),
  bookingId: t.Optional(t.String({ format: "uuid" })),
  estrelas: t.Integer({ minimum: 1, maximum: 5 }),
  comentario: t.Optional(t.String()),
});
