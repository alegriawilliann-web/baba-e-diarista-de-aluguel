import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import { rateLimitPlugin } from "../../shared/plugins/rate-limit.plugin";
import * as paymentsController from "./payments.controller";
import { createMensalidadePixBody, createMensalidadeCardBody } from "./payments.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;
const CLIENTE_ROLES = ["cliente_baba", "cliente_diarista"] as const;
const FIFTEEN_MIN = 15 * 60 * 1000;

export const paymentsRoutes = new Elysia({ prefix: "/payments", tags: ["payments"] })
  .use(authPlugin)
  .use(rateLimitPlugin)
  .get("/config/public-key", paymentsController.publicKey)
  .post("/mensalidade/pix", paymentsController.createMensalidadePix, {
    body: createMensalidadePixBody, role: [...PROFISSIONAL_ROLES],
    rateLimit: { scope: "mensalidade-pix", limit: 10, windowMs: FIFTEEN_MIN },
  })
  .post("/mensalidade/cartao", paymentsController.createMensalidadeCard, {
    body: createMensalidadeCardBody, role: [...PROFISSIONAL_ROLES],
    rateLimit: { scope: "mensalidade-cartao", limit: 10, windowMs: FIFTEEN_MIN },
  })
  .get("/:id", paymentsController.getStatus, { role: [] })
  .post("/bookings/:bookingId/pix", paymentsController.bookingPaymentStub, { role: [...CLIENTE_ROLES] })
  .post("/bookings/:bookingId/cartao", paymentsController.bookingPaymentStub, { role: [...CLIENTE_ROLES] });

// Webhook fica fora do prefixo /payments e sem exigir autenticação — é o
// Mercado Pago quem chama essa URL. Rate limit aqui é só contra spam/DoS —
// a lógica em si já reconsulta o status direto na API do Mercado Pago
// (nunca confia no corpo que chega), então não dá pra forjar aprovação.
export const paymentsWebhookRoutes = new Elysia({ tags: ["payments"] })
  .use(rateLimitPlugin)
  .post("/webhooks/mercadopago", paymentsController.webhook, {
    rateLimit: { scope: "mp-webhook", limit: 60, windowMs: FIFTEEN_MIN },
  });
