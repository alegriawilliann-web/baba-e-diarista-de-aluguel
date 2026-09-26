import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import { refreshJwt } from "../../shared/plugins/jwt.plugin";
import * as authController from "./auth.controller";
import { registerBody, loginBody, refreshBody, authResponse, forgotPasswordBody, resetPasswordBody } from "./auth.schema";

export const authRoutes = new Elysia({ prefix: "/auth", tags: ["auth"] })
  .use(authPlugin)
  .use(refreshJwt)
  .post("/register", authController.register, { body: registerBody, response: { 201: authResponse } })
  .post("/login", authController.login, { body: loginBody, response: { 200: authResponse } })
  .post("/refresh", authController.refresh, { body: refreshBody })
  .post("/logout", authController.logout, { body: refreshBody })
  .get("/me", authController.me, { role: [] })
  .get("/verify-email", authController.verifyEmail)
  .post("/resend-verification", authController.resendVerification, { role: [] })
  .post("/forgot-password", authController.forgotPassword, { body: forgotPasswordBody })
  .post("/reset-password", authController.resetPassword, { body: resetPasswordBody });
