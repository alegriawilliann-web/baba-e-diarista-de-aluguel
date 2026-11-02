import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as pushController from "./push.controller";
import { registerPushTokenBody, unregisterPushTokenBody } from "./push.schema";

export const pushRoutes = new Elysia({ prefix: "/push", tags: ["push"] })
  .use(authPlugin)
  .post("/register", pushController.register, { body: registerPushTokenBody, role: [] })
  .post("/unregister", pushController.unregister, { body: unregisterPushTokenBody, role: [] });
