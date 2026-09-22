import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./env";
import * as schema from "../database/schema";

const client = postgres(env.DATABASE_URL, {
  // Neon (and most managed Postgres) require TLS; postgres.js needs this
  // explicit for connection strings that don't already carry ?sslmode=require.
  ssl: env.DATABASE_URL.includes("localhost") ? false : "require",
});

export const db = drizzle(client, { schema });
