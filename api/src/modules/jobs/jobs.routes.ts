import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as jobsController from "./jobs.controller";
import { createJobPostBody, listOpenJobsQuery, listMyApplicationsQuery, applyToJobBody, updateApplicationStatusBody } from "./jobs.schema";

const CLIENTE_ROLES = ["cliente_baba", "cliente_diarista"] as const;
const PROFISSIONAL_ROLES = ["profissional_baba", "profissional_diarista"] as const;

export const jobsRoutes = new Elysia({ prefix: "/jobs", tags: ["jobs"] })
  .use(authPlugin)
  .post("/", jobsController.create, { body: createJobPostBody, role: [...CLIENTE_ROLES] })
  .get("/mine", jobsController.listMine, { role: [...CLIENTE_ROLES] })
  .get("/open", jobsController.listOpen, { query: listOpenJobsQuery, role: [...PROFISSIONAL_ROLES] })
  .get("/applications/mine", jobsController.listMyApplications, { query: listMyApplicationsQuery, role: [...PROFISSIONAL_ROLES] })
  .patch("/:id/close", jobsController.close, { role: [...CLIENTE_ROLES] })
  .get("/:id/applications", jobsController.getApplications, { role: [...CLIENTE_ROLES] })
  .post("/:id/applications", jobsController.apply, { body: applyToJobBody, role: [...PROFISSIONAL_ROLES] })
  .patch("/:id/applications/:applicationId", jobsController.updateApplicationStatus, { body: updateApplicationStatusBody, role: [...CLIENTE_ROLES] });
