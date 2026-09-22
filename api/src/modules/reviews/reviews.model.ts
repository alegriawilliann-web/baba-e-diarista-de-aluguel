import { pgTable, uuid, smallint, text, timestamp, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../users/users.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { bookings } from "../bookings/bookings.model";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id").notNull().unique().references(() => bookings.id),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id),
    authorId: uuid("author_id").notNull().references(() => users.id),
    estrelas: smallint("estrelas").notNull(),
    comentario: text("comentario"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_professional_id_idx").on(t.professionalId, t.createdAt),
    check("reviews_estrelas_range", sql`${t.estrelas} between 1 and 5`),
  ]
);
