import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from "drizzle-orm/pg-core";
import { VERIFICATION_STATUSES } from "../../config/constants";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";

export const verificationStatusEnum = pgEnum("verification_status", [...VERIFICATION_STATUSES]);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id),
    status: verificationStatusEnum("status").notNull().default("pending"),
    documentType: varchar("document_type", { length: 30 }).notNull(),
    documentRef: text("document_ref").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewerId: uuid("reviewer_id").references(() => users.id),
    notes: text("notes"),
  },
  (t) => [index("verifications_professional_id_idx").on(t.professionalId, t.status)]
);
