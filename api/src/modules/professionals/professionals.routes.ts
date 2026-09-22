import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as professionalsController from "./professionals.controller";
import { createProfessionalBody, updateProfessionalBody, searchProfessionalsQuery, portfolioPostBody } from "./professionals.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const professionalsRoutes = new Elysia({ prefix: "/professionals", tags: ["professionals"] })
  .use(authPlugin)
  .get("/", professionalsController.search, { query: searchProfessionalsQuery })
  .get("/me", professionalsController.getMe, { role: [...PROFISSIONAL_ROLES] })
  .patch("/me", professionalsController.updateMe, { body: updateProfessionalBody, role: [...PROFISSIONAL_ROLES] })
  .post("/me/portfolio", professionalsController.addPortfolioPost, { body: portfolioPostBody, role: ["profissional_diarista"] })
  .delete("/me/portfolio/:id", professionalsController.deletePortfolioPost, { role: ["profissional_diarista"] })
  .post("/", professionalsController.create, { body: createProfessionalBody, role: [] })
  .get("/:id", professionalsController.getById);
