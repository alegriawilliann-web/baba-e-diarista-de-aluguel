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
