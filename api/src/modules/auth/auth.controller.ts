import * as authService from "./auth.service";
import { addDays } from "../../shared/utils/dates";
import type { LoginInput, RegisterInput } from "./auth.types";

// `ctx` is the Elysia request context (typed loosely here on purpose — the
// precise generic Elysia produces per-route is painful to hand-annotate and
// Bun doesn't type-check at runtime anyway; `bun run`/`bun test` catch real
// mistakes). Each handler destructures exactly what it needs.

const REFRESH_TOKEN_DAYS = 30;

async function issueTokens(ctx: any, user: { id: string; email: string; name: string; roles: string[] }) {
  const accessToken = await ctx.accessJwt.sign({ sub: user.id, email: user.email, roles: user.roles });
  const refreshToken = await ctx.refreshJwt.sign({ sub: user.id });
  await authService.storeRefreshToken(user.id, refreshToken, addDays(new Date(), REFRESH_TOKEN_DAYS));
  return { accessToken, refreshToken, user };
}

export async function register(ctx: any) {
  const body = ctx.body as RegisterInput;
  const user = await authService.registerUser(body);
  ctx.set.status = 201;
  return issueTokens(ctx, user);
}

export async function login(ctx: any) {
  const body = ctx.body as LoginInput;
  const user = await authService.verifyCredentials(body.email, body.password);
  return issueTokens(ctx, user);
}

export async function refresh(ctx: any) {
  const { refreshToken } = ctx.body as { refreshToken: string };
  const payload = await ctx.refreshJwt.verify(refreshToken);
  if (!payload) {
    ctx.set.status = 401;
    return { error: { code: "UNAUTHORIZED", message: "Refresh token inválido" } };
  }
  await authService.consumeRefreshToken(refreshToken);
  const me = await authService.getMe(payload.sub as string);
  return issueTokens(ctx, me);
}

export async function logout(ctx: any) {
  const { refreshToken } = ctx.body as { refreshToken: string };
  await authService.revokeRefreshToken(refreshToken);
  return { ok: true };
}

export async function me(ctx: any) {
  return authService.getMe(ctx.user.sub);
}

const CONFIRM_PAGE_STYLE = `font-family: sans-serif; max-width: 420px; margin: 80px auto; padding: 24px; text-align: center; color: #16403C;`;

export async function verifyEmail(ctx: any) {
  const { token } = ctx.query as { token?: string };
  try {
    if (!token) throw new Error("missing token");
    await authService.verifyEmailToken(token);
    ctx.set.headers["content-type"] = "text/html; charset=utf-8";
    return `<div style="${CONFIRM_PAGE_STYLE}"><h2>E-mail confirmado!</h2><p>Pode voltar para o aplicativo — seu acesso já está liberado.</p></div>`;
  } catch {
    ctx.set.status = 400;
    ctx.set.headers["content-type"] = "text/html; charset=utf-8";
    return `<div style="${CONFIRM_PAGE_STYLE}"><h2>Link inválido ou expirado</h2><p>Volte ao aplicativo e peça para reenviar o e-mail de confirmação.</p></div>`;
  }
}

export async function resendVerification(ctx: any) {
  const me = await authService.getMe(ctx.user.sub);
  if (!me.emailVerified) {
    await authService.sendVerificationEmail(me.id, me.email);
  }
  return { ok: true };
}

export async function forgotPassword(ctx: any) {
  const { email } = ctx.body as { email: string };
  await authService.requestPasswordReset(email);
  return { ok: true };
}

export async function resetPassword(ctx: any) {
  const { email, code, newPassword } = ctx.body as { email: string; code: string; newPassword: string };
  await authService.resetPassword(email, code, newPassword);
  return { ok: true };
}
