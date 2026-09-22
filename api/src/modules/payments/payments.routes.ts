import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as paymentsController from "./payments.controller";
import { createMensalidadePixBody, createMensalidadeCardBody } from "./payments.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;
const CLIENTE_ROLES = ["cliente_baba", "cliente_diarista"] as const;

export const paymentsRoutes = new Elysia({ prefix: "/payments", tags: ["payments"] })
  .use(authPlugin)
  .get("/config/public-key", paymentsController.publicKey)
  .post("/mensalidade/pix", paymentsController.createMensalidadePix, { body: createMensalidadePixBody, role: [...PROFISSIONAL_ROLES] })
  .post("/mensalidade/cartao", paymentsController.createMensalidadeCard, { body: createMensalidadeCardBody, role: [...PROFISSIONAL_ROLES] })
  .get("/:id", paymentsController.getStatus, { role: [] })
  .post("/bookings/:bookingId/pix", paymentsController.bookingPaymentStub, { role: [...CLIENTE_ROLES] })
  .post("/bookings/:bookingId/cartao", paymentsController.bookingPaymentStub, { role: [...CLIENTE_ROLES] });

// Webhook fica fora do prefixo /payments e sem exigir autenticação — é o
// Mercado Pago quem chama essa URL.
export const paymentsWebhookRoutes = new Elysia({ tags: ["payments"] }).post("/webhooks/mercadopago", paymentsController.webhook);
