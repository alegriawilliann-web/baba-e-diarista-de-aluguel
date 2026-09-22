import { t } from "elysia";

export const purchaseBoostBody = t.Object({
  planKey: t.String(),
  durationDays: t.Integer(),
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
});
