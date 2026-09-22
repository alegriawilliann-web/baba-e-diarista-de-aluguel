import { Elysia } from "elysia";
import { corsPlugin } from "./shared/plugins/cors.plugin";
import { swaggerPlugin } from "./shared/plugins/swagger.plugin";
import { errorMiddleware } from "./shared/middleware/error.middleware";
import { loggerMiddleware } from "./shared/middleware/logger.middleware";
import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";

export const app = new Elysia()
  .use(errorMiddleware)
  .use(loggerMiddleware)
  .use(corsPlugin)
  .use(swaggerPlugin)
  .get("/health", () => ({ ok: true, service: "baba-de-aluguel-api" }))
  .get("/", () => ({ ok: true, docs: "/docs" }))
  .group("/api", (api) => api.use(authRoutes).use(usersRoutes));
// Each checkpoint adds `.use(xModuleRoutes)` inside the group above.
