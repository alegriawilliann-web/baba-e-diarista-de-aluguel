import { createHash } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../../config/database";
import { users, userRoles, refreshTokens } from "./auth.model";
import { hashPassword, verifyPassword } from "../../shared/utils/hash";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import type { Role } from "../../config/constants";
import type { RegisterInput } from "./auth.types";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function registerUser(input: RegisterInput) {
  const existing = await db.query.users.findFirst({ where: eq(users.email, input.email) });
  if (existing) throw new ConflictError("Já existe uma conta com esse e-mail");

  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      name: input.name,
      phone: input.phone,
      countryCode: input.countryCode ?? "BR",
    })
    .returning();

  return { id: user!.id, email: user!.email, name: user!.name, roles: [] as Role[] };
}

export async function verifyCredentials(email: string, password: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new UnauthorizedError("E-mail ou senha inválidos");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError("E-mail ou senha inválidos");

  const roles = await getRolesForUser(user.id);
  return { id: user.id, email: user.email, name: user.name, roles };
}

export async function getRolesForUser(userId: string): Promise<Role[]> {
  const rows = await db.query.userRoles.findMany({ where: eq(userRoles.userId, userId) });
  return rows.map((r) => r.role);
}

export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new UnauthorizedError();
  const roles = await getRolesForUser(userId);
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, roles, photoUrl: user.photoUrl };
}

export async function storeRefreshToken(userId: string, rawToken: string, expiresAt: Date) {
  await db.insert(refreshTokens).values({ userId, tokenHash: sha256(rawToken), expiresAt });
}

export async function consumeRefreshToken(rawToken: string) {
  const tokenHash = sha256(rawToken);
  const row = await db.query.refreshTokens.findFirst({
    where: and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())),
  });
  if (!row) throw new UnauthorizedError("Sessão expirada, faça login novamente");

  // Rotate: revoke the used token so it can't be replayed.
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, row.id));
  return row;
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = sha256(rawToken);
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.tokenHash, tokenHash));
}
