import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as usersController from "./users.controller";
import { updateMeBody, grantClientRoleBody, trustedContactBody, trustedContactUpdateBody, roleUpdateBody } from "./users.schema";

export const usersRoutes = new Elysia({ prefix: "/users", tags: ["users"] })
  .use(authPlugin)
  .get("/me", usersController.getMe, { role: [] })
  .patch("/me", usersController.updateMe, { body: updateMeBody, role: [] })
  .post("/me/roles/client", usersController.grantClientRole, { body: grantClientRoleBody, role: [] })
  .get("/me/trusted-contacts", usersController.listTrustedContacts, { role: [] })
  .post("/me/trusted-contacts", usersController.addTrustedContact, { body: trustedContactBody, role: [] })
  .patch("/me/trusted-contacts/:id", usersController.updateTrustedContact, { body: trustedContactUpdateBody, role: [] })
  .delete("/me/trusted-contacts/:id", usersController.deleteTrustedContact, { role: [] })
  .get("/", usersController.listUsers, { role: ["admin"] })
  .patch("/:id/roles", usersController.updateUserRoles, { body: roleUpdateBody, role: ["admin"] });
