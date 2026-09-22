import { pgTable, uuid, varchar, text, timestamp, pgEnum, unique, index } from "drizzle-orm/pg-core";
import { REPORT_REASONS, REPORT_STATUSES } from "../../config/constants";
import { users } from "../users/users.model";
import { professionalProfiles } from "../professionals/professionals.model";

export const reportReasonEnum = pgEnum("report_reason", [...REPORT_REASONS]);
export const reportStatusEnum = pgEnum("report_status", [...REPORT_STATUSES]);

export const blocks = pgTable(
  "blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerUserId: uuid("blocker_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedProfessionalId: uuid("blocked_professional_id").notNull().references(() => professionalProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.blockerUserId, t.blockedProfessionalId)]
);

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterUserId: uuid("reporter_user_id").notNull().references(() => users.id),
    targetProfessionalId: uuid("target_professional_id").notNull().references(() => professionalProfiles.id),
    motivo: reportReasonEnum("motivo").notNull(),
    detalhes: text("detalhes"),
    status: reportStatusEnum("status").notNull().default("aberto"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reports_target_idx").on(t.targetProfessionalId), index("reports_status_idx").on(t.status)]
);
