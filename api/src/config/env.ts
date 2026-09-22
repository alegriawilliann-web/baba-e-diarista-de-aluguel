// Loads and validates process.env once at boot. Fails fast (throws) if a
// required variable is missing, instead of surfacing a confusing error deep
// inside a request handler later.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 3000),

  DATABASE_URL: required("DATABASE_URL"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  CORS_ORIGIN: (process.env.CORS_ORIGIN ?? "*").split(",").map((s) => s.trim()),

  MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ?? "",
  MP_PUBLIC_KEY: process.env.MP_PUBLIC_KEY ?? "",
  MP_WEBHOOK_SECRET: process.env.MP_WEBHOOK_SECRET ?? "",

  DEFAULT_COUNTRY_CODE: process.env.DEFAULT_COUNTRY_CODE ?? "BR",
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY ?? "BRL",

  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:3000",
};
