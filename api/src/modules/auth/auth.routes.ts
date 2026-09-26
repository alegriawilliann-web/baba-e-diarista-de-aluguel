import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import { refreshJwt } from "../../shared/plugins/jwt.plugin";
import { rateLimitPlugin } from "../../shared/plugins/rate-limit.plugin";
import * as authController from "./auth.controller";
import { registerBody, loginBody, refreshBody, authResponse, forgotPasswordBody, resetPasswordBody } from "./auth.schema";

const FIFTEEN_MIN = 15 * 60 * 1000;

export const authRoutes = new Elysia({ prefix: "/auth", tags: ["auth"] })
  .use(authPlugin)
  .use(refreshJwt)
  .use(rateLimitPlugin)
  .post("/register", authController.register, {
    body: registerBody, response: { 201: authResponse },
    rateLimit: { scope: "register", limit: 8, windowMs: FIFTEEN_MIN },
  })
  .post("/login", authController.login, {
    body: loginBody, response: { 200: authResponse },
    rateLimit: { scope: "login", limit: 15, windowMs: FIFTEEN_MIN },
  })
  .post("/refresh", authController.refresh, { body: refreshBody })
  .post("/logout", authController.logout, { body: refreshBody })
  .get("/me", authController.me, { role: [] })
  .get("/verify-email", authController.verifyEmail, {
    rateLimit: { scope: "verify-email", limit: 20, windowMs: FIFTEEN_MIN },
  })
  .post("/resend-verification", authController.resendVerification, {
    role: [], rateLimit: { scope: "resend-verification", limit: 5, windowMs: FIFTEEN_MIN },
  })
  .post("/forgot-password", authController.forgotPassword, {
    body: forgotPasswordBody, rateLimit: { scope: "forgot-password", limit: 5, windowMs: FIFTEEN_MIN },
  })
  .post("/reset-password", authController.resetPassword, {
    body: resetPasswordBody, rateLimit: { scope: "reset-password", limit: 8, windowMs: FIFTEEN_MIN },
  });
