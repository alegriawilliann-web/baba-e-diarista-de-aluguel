import { pgTable, uuid, varchar, text, smallint, integer, timestamp, pgEnum, index, unique } from "drizzle-orm/pg-core";
import { BOOST_STATUSES } from "../../config/constants";
import { professionalProfiles } from "../professionals/professionals.model";
import { payments } from "../payments/payments.model";

export const boostStatusEnum = pgEnum("boost_status", [...BOOST_STATUSES]);

export const boostPlans = pgTable("boost_plans", {
  key: varchar("key", { length: 30 }).primaryKey(),
  titulo: varchar("titulo", { length: 100 }).notNull(),
  descricao: text("descricao").notNull(),
  iconeKey: varchar("icone_key", { length: 30 }).notNull(),
});

export const boostPlanOptions = pgTable(
  "boost_plan_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    planKey: varchar("plan_key", { length: 30 }).notNull().references(() => boostPlans.key),
    duracaoDias: smallint("duracao_dias").notNull(),
    precoCents: integer("preco_cents").notNull(),
  },
  (t) => [unique().on(t.planKey, t.duracaoDias)]
);

export const boostPurchases = pgTable(
  "boost_purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id),
    planKey: varchar("plan_key", { length: 30 }).notNull().references(() => boostPlans.key),
    duracaoDias: smallint("duracao_dias").notNull(),
    precoCents: integer("preco_cents").notNull(),
    paymentId: uuid("payment_id").references(() => payments.id),
    status: boostStatusEnum("status").notNull().default("pendente"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("boost_purchases_professional_id_idx").on(t.professionalId, t.status)]
);
