import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import { rateLimitPlugin } from "../../shared/plugins/rate-limit.plugin";
import * as boostsController from "./boosts.controller";
import { purchaseBoostBody } from "./boosts.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const boostsRoutes = new Elysia({ prefix: "/boosts", tags: ["boosts"] })
  .use(authPlugin)
  .use(rateLimitPlugin)
  .get("/plans", boostsController.listPlans)
  .post("/purchase", boostsController.purchase, {
    body: purchaseBoostBody, role: [...PROFISSIONAL_ROLES],
    rateLimit: { scope: "boost-purchase", limit: 10, windowMs: 15 * 60 * 1000 },
  })
  .get("/mine", boostsController.listMine, { role: [...PROFISSIONAL_ROLES] });
