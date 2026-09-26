import { Elysia } from "elysia";
import { corsPlugin } from "./shared/plugins/cors.plugin";
import { swaggerPlugin } from "./shared/plugins/swagger.plugin";
import { globalRateLimit } from "./shared/plugins/rate-limit.plugin";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import { loggerMiddleware } from "./shared/middleware/logger.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { professionalsRoutes } from "./modules/professionals/professionals.routes";
import { bookingsRoutes } from "./modules/bookings/bookings.routes";
import { reviewsRoutes } from "./modules/reviews/reviews.routes";
import { paymentsRoutes, paymentsWebhookRoutes } from "./modules/payments/payments.routes";
import { boostsRoutes } from "./modules/boosts/boosts.routes";
import { notificationsRoutes } from "./modules/notifications/notifications.routes";
import { trustSafetyRoutes } from "./modules/trust-safety/trust-safety.routes";
import { messagesRoutes } from "./modules/messages/messages.routes";
import { verificationsRoutes } from "./modules/verifications/verifications.routes";

export const app = new Elysia()
  .use(errorMiddleware)
  .use(loggerMiddleware)
  .use(globalRateLimit(300, 60 * 1000))
  .onAfterHandle({ as: "global" }, ({ set }) => {
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["x-frame-options"] = "DENY";
    set.headers["referrer-policy"] = "no-referrer";
    set.headers["strict-transport-security"] = "max-age=15552000; includeSubDomains";
  })
  .use(corsPlugin)
  .use(swaggerPlugin)
  .get("/health", () => ({ ok: true, service: "baba-de-aluguel-api" }))
  .get("/", () => ({ ok: true, docs: "/docs" }))
  .group("/api", (api) =>
    api
      .use(authRoutes)
      .use(usersRoutes)
      .use(professionalsRoutes)
      .use(bookingsRoutes)
      .use(reviewsRoutes)
      .use(paymentsRoutes)
      .use(paymentsWebhookRoutes)
      .use(boostsRoutes)
      .use(notificationsRoutes)
      .use(trustSafetyRoutes)
      .use(messagesRoutes)
      .use(verificationsRoutes)
  );
// Each checkpoint adds `.use(xModuleRoutes)` inside the group above.
