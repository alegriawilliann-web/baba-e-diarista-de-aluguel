import { eq, and } from "drizzle-orm";
import { db } from "../../config/database";
import { notifications } from "./notifications.model";
import { NotFoundError, ForbiddenError } from "../../shared/errors";
import type { NotifyInput } from "./notifications.types";

/** Chamada por outros módulos (bookings, reviews, trust-safety, ...) quando
 * algo relevante acontece — não é exposta como rota própria. */
export async function notify(input: NotifyInput) {
  await db.insert(notifications).values({ userId: input.userId, tipo: input.tipo, texto: input.texto, link: input.link });
}

export async function list(userId: string) {
  return db.query.notifications.findMany({ where: eq(notifications.userId, userId), orderBy: (n, { desc }) => [desc(n.criadoEm)] });
}

export async function markRead(userId: string, id: string) {
  const existing = await db.query.notifications.findFirst({ where: eq(notifications.id, id) });
  if (!existing) throw new NotFoundError("Notificação não encontrada");
  if (existing.userId !== userId) throw new ForbiddenError();

  const [row] = await db.update(notifications).set({ lida: true }).where(eq(notifications.id, id)).returning();
  return row;
}

export async function markAllRead(userId: string) {
  await db.update(notifications).set({ lida: true }).where(and(eq(notifications.userId, userId), eq(notifications.lida, false)));
  return { ok: true };
}
