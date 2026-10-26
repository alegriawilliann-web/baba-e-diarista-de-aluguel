import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as professionalsController from "./professionals.controller";
import * as teamMembersController from "./team-members.controller";
import { createProfessionalBody, updateProfessionalBody, searchProfessionalsQuery, portfolioPostBody, reorderPortfolioBody } from "./professionals.schema";
import { submitTeamMemberBody, reviewTeamMemberBody } from "./team-members.schema";

const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const professionalsRoutes = new Elysia({ prefix: "/professionals", tags: ["professionals"] })
  .use(authPlugin)
  .get("/", professionalsController.search, { query: searchProfessionalsQuery })
  .get("/me", professionalsController.getMe, { role: [...PROFISSIONAL_ROLES] })
  .patch("/me", professionalsController.updateMe, { body: updateProfessionalBody, role: [...PROFISSIONAL_ROLES] })
  .get("/me/portfolio", professionalsController.listPortfolio, { role: ["profissional_diarista"] })
  .post("/me/portfolio", professionalsController.addPortfolioPost, { body: portfolioPostBody, role: ["profissional_diarista"] })
  .delete("/me/portfolio/:id", professionalsController.deletePortfolioPost, { role: ["profissional_diarista"] })
  .patch("/me/portfolio/reorder", professionalsController.reorderPortfolio, { body: reorderPortfolioBody, role: ["profissional_diarista"] })
  .post("/me/equipe", teamMembersController.submit, { body: submitTeamMemberBody, role: [...PROFISSIONAL_ROLES] })
  .get("/me/equipe", teamMembersController.listMine, { role: [...PROFISSIONAL_ROLES] })
  .delete("/me/equipe/:id", teamMembersController.remove, { role: [...PROFISSIONAL_ROLES] })
  .get("/equipe/queue", teamMembersController.listQueue, { role: ["admin"] })
  .patch("/equipe/:id", teamMembersController.review, { body: reviewTeamMemberBody, role: ["admin"] })
  .post("/", professionalsController.create, { body: createProfessionalBody, role: [] })
  .get("/:id", professionalsController.getById);
