import { t } from "elysia";

export const createReviewBody = t.Object({
  bookingId: t.String({ format: "uuid" }),
  estrelas: t.Integer({ minimum: 1, maximum: 5 }),
  comentario: t.Optional(t.String()),
});
