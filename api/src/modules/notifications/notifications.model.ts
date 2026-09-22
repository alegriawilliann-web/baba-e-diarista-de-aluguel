import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "../users/users.model";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tipo: varchar("tipo", { length: 40 }).notNull(),
    texto: text("texto").notNull(),
    link: text("link"),
    lida: boolean("lida").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_id_idx").on(t.userId, t.lida, t.criadoEm)]
);
