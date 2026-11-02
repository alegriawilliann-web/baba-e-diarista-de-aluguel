import { pgTable, uuid, text, varchar, timestamp, unique, index } from "drizzle-orm/pg-core";
import { users } from "../users/users.model";

// Um token por linha (não por usuário) — a mesma pessoa pode ter mais de
// um celular logado, e um token velho é substituído automaticamente pelo
// novo quando o Firebase o reemite pro mesmo aparelho.
export const pushTokens = pgTable(
  "push_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    platform: varchar("platform", { length: 20 }).notNull().default("android"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.token), index("push_tokens_user_id_idx").on(t.userId)]
);
