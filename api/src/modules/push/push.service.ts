import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../config/database";
import { pushTokens } from "./push.model";

export async function registerToken(userId: string, token: string, platform = "android") {
  const existing = await db.query.pushTokens.findFirst({ where: eq(pushTokens.token, token) });
  if (existing) {
    // Mesmo token, dono diferente — acontece quando alguém troca de conta
    // no mesmo celular sem desinstalar o app. O token passa a valer pra
    // quem está logado agora.
    if (existing.userId !== userId || existing.platform !== platform) {
      await db.update(pushTokens).set({ userId, platform }).where(eq(pushTokens.id, existing.id));
    }
    return { ok: true };
  }
  await db.insert(pushTokens).values({ userId, token, platform });
  return { ok: true };
}

export async function unregisterToken(userId: string, token: string) {
  await db.delete(pushTokens).where(and(eq(pushTokens.userId, userId), eq(pushTokens.token, token)));
  return { ok: true };
}

export async function tokensForUser(userId: string) {
  const rows = await db.query.pushTokens.findMany({ where: eq(pushTokens.userId, userId) });
  return rows.map((r) => r.token);
}

export async function deleteTokens(tokens: string[]) {
  if (tokens.length === 0) return;
  await db.delete(pushTokens).where(inArray(pushTokens.token, tokens));
}
