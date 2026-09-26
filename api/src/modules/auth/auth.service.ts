import { createHash, randomBytes, randomInt } from "node:crypto";
import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../../config/database";
import { users, userRoles, refreshTokens, authTokens } from "./auth.model";
import { hashPassword, verifyPassword } from "../../shared/utils/hash";
import { ConflictError, UnauthorizedError } from "../../shared/errors";
import { addMinutes } from "../../shared/utils/dates";
import { sendEmail, verificationEmailHtml, passwordResetEmailHtml } from "../../shared/utils/email";
import { env } from "../../config/env";
import type { Role } from "../../config/constants";
import type { RegisterInput } from "./auth.types";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const EMAIL_VERIFICATION_HOURS = 24;
const PASSWORD_RESET_MINUTES = 15;

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

  await sendVerificationEmail(user!.id, user!.email).catch((err) => {
    console.error("Falha ao enviar e-mail de confirmação:", err);
  });

  return { id: user!.id, email: user!.email, name: user!.name, roles: [] as Role[] };
}

export async function sendVerificationEmail(userId: string, email: string) {
  const rawToken = randomBytes(32).toString("hex");
  await db.insert(authTokens).values({
    userId,
    purpose: "email_verification",
    tokenHash: sha256(rawToken),
    expiresAt: addMinutes(new Date(), EMAIL_VERIFICATION_HOURS * 60),
  });
  const confirmUrl = `${env.APP_BASE_URL}/api/auth/verify-email?token=${rawToken}`;
  await sendEmail({ to: email, subject: "Confirme seu e-mail", html: verificationEmailHtml(confirmUrl) });
}

export async function verifyEmailToken(rawToken: string) {
  const tokenHash = sha256(rawToken);
  const row = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.tokenHash, tokenHash),
      eq(authTokens.purpose, "email_verification"),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, new Date())
    ),
  });
  if (!row) throw new UnauthorizedError("Link de confirmação inválido ou expirado");

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, row.userId));
  return row.userId;
}

export async function requestPasswordReset(email: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Não revela se o e-mail existe ou não — resposta é sempre a mesma pro chamador.
  if (!user) return;

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await db.insert(authTokens).values({
    userId: user.id,
    purpose: "password_reset",
    tokenHash: sha256(code),
    expiresAt: addMinutes(new Date(), PASSWORD_RESET_MINUTES),
  });
  await sendEmail({ to: user.email, subject: "Código para redefinir sua senha", html: passwordResetEmailHtml(code) });
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) throw new UnauthorizedError("Código inválido ou expirado");

  const tokenHash = sha256(code);
  const row = await db.query.authTokens.findFirst({
    where: and(
      eq(authTokens.userId, user.id),
      eq(authTokens.tokenHash, tokenHash),
      eq(authTokens.purpose, "password_reset"),
      isNull(authTokens.usedAt),
      gt(authTokens.expiresAt, new Date())
    ),
  });
  if (!row) throw new UnauthorizedError("Código inválido ou expirado");

  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.id, row.id));
  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  // Derruba todas as sessões existentes — depois de trocar a senha, força login de novo em todo lugar.
  await db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.userId, user.id));
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
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    roles,
    photoUrl: user.photoUrl,
    emailVerified: !!user.emailVerifiedAt,
  };
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
