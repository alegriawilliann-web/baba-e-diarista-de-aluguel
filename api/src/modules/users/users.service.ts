import { eq, and, count } from "drizzle-orm";
import { db } from "../../config/database";
import { users, userRoles, clientProfiles, trustedContacts, roleEnum } from "./users.model";
import { NotFoundError, ForbiddenError } from "../../shared/errors";
import { parsePagination, buildPageMeta, type PaginationQuery } from "../../shared/utils/pagination";
import type { Role } from "../../config/constants";
import type { GrantClientRoleInput, TrustedContactInput, UpdateMeInput } from "./users.types";

export async function getRolesForUser(userId: string): Promise<Role[]> {
  const rows = await db.query.userRoles.findMany({ where: eq(userRoles.userId, userId) });
  return rows.map((r) => r.role);
}

export async function getMe(userId: string) {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) throw new NotFoundError("Usuário não encontrado");
  const roles = await getRolesForUser(userId);
  return { id: user.id, email: user.email, name: user.name, phone: user.phone, photoUrl: user.photoUrl, roles };
}

export async function updateMe(userId: string, input: UpdateMeInput) {
  const [updated] = await db
    .update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!updated) throw new NotFoundError("Usuário não encontrado");
  return getMe(userId);
}

export async function grantClientRole(userId: string, input: GrantClientRoleInput) {
  const role: Role = input.serviceType === "baba" ? "cliente_baba" : "cliente_diarista";

  await db.transaction(async (tx) => {
    const existingRole = await tx.query.userRoles.findFirst({
      where: and(eq(userRoles.userId, userId), eq(userRoles.role, role)),
    });
    if (!existingRole) {
      await tx.insert(userRoles).values({ userId, role });
    }

    const existingProfile = await tx.query.clientProfiles.findFirst({ where: eq(clientProfiles.userId, userId) });
    if (existingProfile) {
      await tx.update(clientProfiles).set({ bairro: input.bairro }).where(eq(clientProfiles.userId, userId));
    } else {
      await tx.insert(clientProfiles).values({ userId, bairro: input.bairro });
    }
  });

  return getMe(userId);
}

export async function listTrustedContacts(userId: string) {
  return db.query.trustedContacts.findMany({ where: eq(trustedContacts.userId, userId) });
}

export async function addTrustedContact(userId: string, input: TrustedContactInput) {
  const [row] = await db.insert(trustedContacts).values({ userId, ...input }).returning();
  return row;
}

export async function updateTrustedContact(userId: string, contactId: string, input: Partial<TrustedContactInput>) {
  const existing = await db.query.trustedContacts.findFirst({ where: eq(trustedContacts.id, contactId) });
  if (!existing) throw new NotFoundError("Contato de confiança não encontrado");
  if (existing.userId !== userId) throw new ForbiddenError();

  const [row] = await db.update(trustedContacts).set(input).where(eq(trustedContacts.id, contactId)).returning();
  return row;
}

export async function deleteTrustedContact(userId: string, contactId: string) {
  const existing = await db.query.trustedContacts.findFirst({ where: eq(trustedContacts.id, contactId) });
  if (!existing) throw new NotFoundError("Contato de confiança não encontrado");
  if (existing.userId !== userId) throw new ForbiddenError();

  await db.delete(trustedContacts).where(eq(trustedContacts.id, contactId));
  return { ok: true };
}

export async function listUsers(query: PaginationQuery) {
  const { page, limit, offset } = parsePagination(query);
  const [rows, [{ total }]] = await Promise.all([
    db.query.users.findMany({ limit, offset, orderBy: (u, { desc }) => [desc(u.createdAt)] }),
    db.select({ total: count() }).from(users),
  ]);
  return { data: rows, meta: buildPageMeta(total, page, limit) };
}

export async function updateUserRoles(targetUserId: string, roles: Role[]) {
  const validRoles = roles.filter((r): r is Role => (roleEnum.enumValues as readonly string[]).includes(r));

  await db.transaction(async (tx) => {
    await tx.delete(userRoles).where(eq(userRoles.userId, targetUserId));
    if (validRoles.length > 0) {
      await tx.insert(userRoles).values(validRoles.map((role) => ({ userId: targetUserId, role })));
    }
  });

  return getMe(targetUserId);
}
