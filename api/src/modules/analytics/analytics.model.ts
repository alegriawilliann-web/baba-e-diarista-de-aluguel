import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";

// Um clique no link curto de download (/baixar) — sem usuário associado,
// é só pra medir de que sistema vem o tráfego (ex: saber se vale a pena
// fazer versão iOS um dia). Sem IP, sem nada identificável.
export const downloadLinkClicks = pgTable(
  "download_link_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    os: varchar("os", { length: 20 }).notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("download_link_clicks_os_idx").on(t.os)]
);
