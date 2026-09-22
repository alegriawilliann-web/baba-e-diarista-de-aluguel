import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as notificationsController from "./notifications.controller";

export const notificationsRoutes = new Elysia({ prefix: "/notifications", tags: ["notifications"] })
  .use(authPlugin)
  .get("/", notificationsController.list, { role: [] })
  .patch("/read-all", notificationsController.markAllRead, { role: [] })
  .patch("/:id/read", notificationsController.markRead, { role: [] });
