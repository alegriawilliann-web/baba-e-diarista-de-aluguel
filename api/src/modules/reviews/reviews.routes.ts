import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as reviewsController from "./reviews.controller";
import { createReviewBody } from "./reviews.schema";

const CLIENTE_ROLES = ["cliente_baba", "cliente_diarista"] as const;

export const reviewsRoutes = new Elysia({ tags: ["reviews"] })
  .use(authPlugin)
  .post("/reviews", reviewsController.create, { body: createReviewBody, role: [...CLIENTE_ROLES] })
  .get("/professionals/:id/reviews", reviewsController.listForProfessional);
