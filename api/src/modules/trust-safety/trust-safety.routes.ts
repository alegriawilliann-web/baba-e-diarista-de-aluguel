import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as trustSafetyController from "./trust-safety.controller";
import { blockBody, reportBody, updateReportStatusBody } from "./trust-safety.schema";

export const trustSafetyRoutes = new Elysia({ tags: ["trust-safety"] })
  .use(authPlugin)
  .post("/blocks", trustSafetyController.block, { body: blockBody, role: [] })
  .get("/blocks/mine", trustSafetyController.listMyBlocks, { role: [] })
  .delete("/blocks/:id", trustSafetyController.unblock, { role: [] })
  .post("/reports", trustSafetyController.report, { body: reportBody, role: [] })
  .get("/reports", trustSafetyController.listReports, { role: ["admin"] })
  .patch("/reports/:id", trustSafetyController.updateReportStatus, { body: updateReportStatusBody, role: ["admin"] });
