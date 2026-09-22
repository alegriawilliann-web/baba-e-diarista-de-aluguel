import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, integer, numeric, text, jsonb, index, unique, primaryKey } from "drizzle-orm/pg-core";
import { SERVICE_TYPES, TRANSPORTE_OPTIONS, PAYMENT_METHODS, SUBSCRIPTION_STATUSES } from "../../config/constants";
import { users, addresses } from "../users/users.model";

export const serviceTypeEnum = pgEnum("service_type", [...SERVICE_TYPES]);
export const transporteEnum = pgEnum("transporte", [...TRANSPORTE_OPTIONS]);
export const paymentMethodEnum = pgEnum("payment_method", [...PAYMENT_METHODS]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [...SUBSCRIPTION_STATUSES]);

export const professionalProfiles = pgTable(
  "professional_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    serviceType: serviceTypeEnum("service_type").notNull(),
    addressId: uuid("address_id").references(() => addresses.id),
    idade: integer("idade").notNull(),
    bio: text("bio"),
    precoHoraCents: integer("preco_hora_cents"),
    valorCombinar: boolean("valor_combinar").notNull().default(false),
    disponibilidadeNoite: boolean("disponibilidade_noite").notNull().default(false),
    disponibilidadeFds: boolean("disponibilidade_fds").notNull().default(false),
    transporte: transporteEnum("transporte").notNull(),
    tags: text("tags").array().notNull().default([]),
    agenda: jsonb("agenda").notNull().default({}),
    rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
    ratingCount: integer("rating_count").notNull().default(0),
    ratingBreakdown: jsonb("rating_breakdown").notNull().default({ "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 }),
    seguidoresCount: integer("seguidores_count").notNull().default(0),
    verificada: boolean("verificada").notNull().default(false),
    formaPagamento: paymentMethodEnum("forma_pagamento").notNull(),
    statusPagamento: subscriptionStatusEnum("status_pagamento").notNull().default("pendente"),
    subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
    // Campos que divergem entre baba/diarista — ver BabaDetails/DiaristaDetails em professionals.types.ts
    details: jsonb("details").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.userId, t.serviceType),
    index("professional_profiles_search_idx").on(t.serviceType, t.statusPagamento),
    index("professional_profiles_address_idx").on(t.addressId),
  ]
);

export const portfolioPosts = pgTable(
  "portfolio_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    professionalId: uuid("professional_id").notNull().references(() => professionalProfiles.id, { onDelete: "cascade" }),
    cor: varchar("cor", { length: 20 }),
    legenda: text("legenda"),
    url: text("url"),
    marcado: boolean("marcado").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("portfolio_posts_professional_id_idx").on(t.professionalId)]
);

// Colocado aqui (não em users.model.ts) para não criar import circular:
// professional_profiles já depende de users.model, então follows (que
// referencia as duas) fica no módulo que fica "por cima" na cadeia de imports.
export const follows = pgTable(
  "follows",
  {
    followerUserId: uuid("follower_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followeeProfessionalId: uuid("followee_professional_id")
      .notNull()
      .references(() => professionalProfiles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.followerUserId, t.followeeProfessionalId] })]
);
