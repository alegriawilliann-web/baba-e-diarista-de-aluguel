import { pgTable, uuid, smallint, text, timestamp, index, check, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../users/users.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { bookings } from "../bookings/bookings.model";

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Opcional agora — qualquer contratante pode avaliar direto no perfil,
    // sem precisar ter passado por uma contratação de verdade dentro do
    // app (pedido explícito: deixar o depoimento mais fácil de dar).
    bookingId: uuid("booking_id").references(() => bookings.id),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id),
    authorId: uuid("author_id").notNull().references(() => users.id),
    estrelas: smallint("estrelas").notNull(),
    comentario: text("comentario"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("reviews_professional_id_idx").on(t.professionalId, t.createdAt),
    check("reviews_estrelas_range", sql`${t.estrelas} between 1 and 5`),
    // Uma avaliação por par contratante/profissional — enviar de novo edita
    // a que já existe em vez de duplicar.
    unique().on(t.authorId, t.professionalId),
  ]
);
