import { pgTable, uuid, varchar, timestamp, pgEnum, integer, date, time, char, index } from "drizzle-orm/pg-core";
import { BOOKING_STATUSES } from "../../config/constants";
import { users } from "../users/users.model";
import { professionalProfiles, serviceTypeEnum, paymentMethodEnum } from "../professionals/professionals.model";

export const bookingStatusEnum = pgEnum("booking_status", [...BOOKING_STATUSES]);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id").notNull().references(() => users.id),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id),
    serviceType: serviceTypeEnum("service_type").notNull(),
    scheduledDate: date("scheduled_date").notNull(),
    scheduledTime: time("scheduled_time").notNull(),
    servico: varchar("servico", { length: 150 }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: char("currency", { length: 3 }).notNull().default("BRL"),
    formaPagamento: paymentMethodEnum("forma_pagamento").notNull(),
    status: bookingStatusEnum("status").notNull().default("pendente"),
    checkinAt: timestamp("checkin_at", { withTimezone: true }),
    checkoutAt: timestamp("checkout_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("bookings_client_id_idx").on(t.clientId),
    index("bookings_professional_id_idx").on(t.professionalId),
    index("bookings_status_idx").on(t.status),
  ]
);
