import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as bookingsController from "./bookings.controller";
import { createBookingBody, listMineQuery } from "./bookings.schema";

const CLIENTE_ROLES = ["cliente_baba", "cliente_diarista"] as const;

export const bookingsRoutes = new Elysia({ prefix: "/bookings", tags: ["bookings"] })
  .use(authPlugin)
  .post("/", bookingsController.create, { body: createBookingBody, role: [...CLIENTE_ROLES] })
  .get("/mine", bookingsController.listMine, { query: listMineQuery, role: [] })
  .get("/:id", bookingsController.getById, { role: [] })
  .patch("/:id/accept", bookingsController.accept, { role: [] })
  .patch("/:id/reject", bookingsController.reject, { role: [] })
  .patch("/:id/cancel", bookingsController.cancel, { role: [] })
  .patch("/:id/checkin", bookingsController.checkin, { role: [] })
  .patch("/:id/checkout", bookingsController.checkout, { role: [] })
  .patch("/:id/complete", bookingsController.complete, { role: [] });
