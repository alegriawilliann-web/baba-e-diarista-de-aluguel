import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as boostsController from "./boosts.controller";
import { purchaseBoostBody } from "./boosts.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const boostsRoutes = new Elysia({ prefix: "/boosts", tags: ["boosts"] })
  .use(authPlugin)
  .get("/plans", boostsController.listPlans)
  .post("/purchase", boostsController.purchase, { body: purchaseBoostBody, role: [...PROFISSIONAL_ROLES] })
  .get("/mine", boostsController.listMine, { role: [...PROFISSIONAL_ROLES] });
