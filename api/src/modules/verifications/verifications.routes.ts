import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as verificationsController from "./verifications.controller";
import { submitVerificationBody, reviewVerificationBody } from "./verifications.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const verificationsRoutes = new Elysia({ prefix: "/verifications", tags: ["verifications"] })
  .use(authPlugin)
  .post("/", verificationsController.submit, { body: submitVerificationBody, role: [...PROFISSIONAL_ROLES] })
  .get("/mine", verificationsController.listMine, { role: [...PROFISSIONAL_ROLES] })
  .get("/", verificationsController.listQueue, { role: ["admin"] })
  .patch("/:id", verificationsController.review, { body: reviewVerificationBody, role: ["admin"] });
