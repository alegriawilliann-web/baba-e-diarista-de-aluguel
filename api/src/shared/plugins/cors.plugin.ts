import { cors } from "@elysiajs/cors";
import { env } from "../../config/env";

export const corsPlugin = cors({
  origin: env.CORS_ORIGIN.includes("*") ? true : env.CORS_ORIGIN,
  credentials: true,
});
