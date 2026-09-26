import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, unique, index, numeric, integer } from "drizzle-orm/pg-core";
import { ROLES } from "../../config/constants";

export const roleEnum = pgEnum("role", [...ROLES]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  photoUrl: varchar("photo_url", { length: 2048 }),
  countryCode: varchar("country_code", { length: 2 }).notNull().default("BR"),
  locale: varchar("locale", { length: 10 }).notNull().default("pt-BR"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.role), index("user_roles_user_id_idx").on(t.userId)]
);

export const authTokenPurposeEnum = pgEnum("auth_token_purpose", ["email_verification", "password_reset"]);

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    purpose: authTokenPurposeEnum("purpose").notNull(),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("auth_tokens_user_id_idx").on(t.userId), index("auth_tokens_token_hash_idx").on(t.tokenHash)]
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("refresh_tokens_user_id_idx").on(t.userId), index("refresh_tokens_token_hash_idx").on(t.tokenHash)]
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 30 }),
    countryCode: varchar("country_code", { length: 2 }).notNull().default("BR"),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    street: varchar("street", { length: 200 }).notNull(),
    number: varchar("number", { length: 20 }),
    complement: varchar("complement", { length: 100 }),
    neighborhood: varchar("neighborhood", { length: 100 }),
    city: varchar("city", { length: 100 }).notNull(),
    region: varchar("region", { length: 100 }),
    latitude: numeric("latitude", { precision: 9, scale: 6 }),
    longitude: numeric("longitude", { precision: 9, scale: 6 }),
    isPrimary: boolean("is_primary").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("addresses_user_id_idx").on(t.userId)]
);

// Lives here (not in `professionals`) because it has no FK relationship to
// professional_profiles at all — it's a plain per-user enrichment row for
// the "mãe" / "cliente-diarista" side, same as addresses/trusted_contacts.
export const clientProfiles = pgTable("client_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  bairro: varchar("bairro", { length: 100 }).notNull(),
  photoUrl: varchar("photo_url", { length: 2048 }),
  seguindoCount: integer("seguindo_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const trustedContacts = pgTable(
  "trusted_contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 150 }).notNull(),
    telefone: varchar("telefone", { length: 20 }).notNull(),
    relacao: varchar("relacao", { length: 60 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("trusted_contacts_user_id_idx").on(t.userId)]
);
