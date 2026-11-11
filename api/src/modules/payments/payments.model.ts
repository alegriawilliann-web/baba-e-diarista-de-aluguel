import { pgTable, uuid, varchar, integer, char, timestamp, pgEnum, jsonb, index } from "drizzle-orm/pg-core";
import { PAYMENT_PROVIDERS, PAYMENT_PURPOSES, PAYMENT_STATUSES } from "../../config/constants";
import { users } from "../users/users.model";
import { paymentMethodEnum, professionalProfiles } from "../professionals/professionals.model";

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
    // Marca quando o lembrete de "Pix pendente" foi enviado pra esse
    // pagamento específico — garante que cada Pix gerado só recebe um
    // lembrete, mesmo com o job rodando a cada 30min.
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("payments_user_id_idx").on(t.userId),
    index("payments_provider_payment_id_idx").on(t.providerPaymentId),
    index("payments_purpose_reference_idx").on(t.purpose, t.referenceId),
  ]
);

// Desconto pontual na mensalidade, concedido manualmente (ex: campanha de
// reativação pra quem gerou o Pix e não pagou) — não é um sistema de cupom
// público, só uma linha por pessoa. `usedAt` marca consumido assim que um
// pagamento é gerado com ele (mesmo que esse Pix específico nunca seja
// pago), pra não dar pra gerar vários Pix com desconto repetidamente.
export const mensalidadeDiscounts = pgTable(
  "mensalidade_discounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // null = vale pra qualquer perfil profissional dessa pessoa (campanha
    // manual); preenchido = só pro perfil específico (ex: boas-vindas da
    // primeira mensalidade de UM cadastro — se a pessoa também for babá E
    // diarista, cada cadastro ganha o seu próprio desconto).
    professionalId: uuid("professional_id").references(() => professionalProfiles.id, { onDelete: "cascade" }),
    percentOff: integer("percent_off").notNull(),
    motivo: varchar("motivo", { length: 150 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mensalidade_discounts_user_id_idx").on(t.userId)]
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
