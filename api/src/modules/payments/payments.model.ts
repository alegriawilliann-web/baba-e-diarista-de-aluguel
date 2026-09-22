import { pgTable, uuid, varchar, integer, char, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { PAYMENT_PROVIDERS, PAYMENT_PURPOSES, PAYMENT_STATUSES } from "../../config/constants";
import { users } from "../users/users.model";
import { paymentMethodEnum } from "../professionals/professionals.model";

export const paymentProviderEnum = pgEnum("payment_provider", [...PAYMENT_PROVIDERS]);
export const paymentPurposeEnum = pgEnum("payment_purpose", [...PAYMENT_PURPOSES]);
export const paymentStatusEnum = pgEnum("payment_status", [...PAYMENT_STATUSES]);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    provider: paymentProviderEnum("provider").notNull().default("mercadopago"),
    providerPaymentId: varchar("provider_payment_id", { length: 100 }).unique(),
    purpose: paymentPurposeEnum("purpose").notNull(),
    referenceId: uuid("reference_id"),
    method: paymentMethodEnum("method").notNull(),
    currency: char("currency", { length: 3 }).notNull().default("BRL"),
    amountCents: integer("amount_cents").notNull(),
    status: paymentStatusEnum("status").notNull().default("pendente"),
    description: varchar("description", { length: 255 }),
    payerEmail: varchar("payer_email", { length: 255 }),
    payerName: varchar("payer_name", { length: 150 }),
    externalReference: varchar("external_reference", { length: 100 }),
    rawProviderPayload: jsonb("raw_provider_payload"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_user_id_idx").on(t.userId),
    index("payments_provider_payment_id_idx").on(t.providerPaymentId),
    index("payments_purpose_reference_idx").on(t.purpose, t.referenceId),
  ]
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id").references(() => payments.id),
    eventType: varchar("event_type", { length: 50 }),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payment_events_payment_id_idx").on(t.paymentId)]
);
