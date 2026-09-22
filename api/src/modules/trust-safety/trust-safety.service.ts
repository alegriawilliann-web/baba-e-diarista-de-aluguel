import { eq, and } from "drizzle-orm";
import { db } from "../../config/database";
import { blocks, reports } from "./trust-safety.model";
import { ConflictError, ForbiddenError, NotFoundError } from "../../shared/errors";
import type { ReportReason } from "../../config/constants";

export async function block(userId: string, professionalId: string) {
  const existing = await db.query.blocks.findFirst({ where: and(eq(blocks.blockerUserId, userId), eq(blocks.blockedProfessionalId, professionalId)) });
  if (existing) throw new ConflictError("Você já bloqueou esse profissional");

  const [row] = await db.insert(blocks).values({ blockerUserId: userId, blockedProfessionalId: professionalId }).returning();
  return row;
}

export async function unblock(userId: string, blockId: string) {
  const existing = await db.query.blocks.findFirst({ where: eq(blocks.id, blockId) });
  if (!existing) throw new NotFoundError("Bloqueio não encontrado");
  if (existing.blockerUserId !== userId) throw new ForbiddenError();

  await db.delete(blocks).where(eq(blocks.id, blockId));
  return { ok: true };
}

export async function listMyBlocks(userId: string) {
  return db.query.blocks.findMany({ where: eq(blocks.blockerUserId, userId) });
}

/** Usado pela busca de profissionais para excluir quem o usuário bloqueou. */
export async function blockedProfessionalIds(userId: string): Promise<string[]> {
  const rows = await db.query.blocks.findMany({ where: eq(blocks.blockerUserId, userId) });
  return rows.map((r) => r.blockedProfessionalId);
}

export async function report(reporterUserId: string, input: { targetProfessionalId: string; motivo: ReportReason; detalhes?: string }) {
  const [row] = await db
    .insert(reports)
    .values({ reporterUserId, targetProfessionalId: input.targetProfessionalId, motivo: input.motivo, detalhes: input.detalhes })
    .returning();
  return row;
}

export async function listReports(status?: string) {
  if (status) return db.query.reports.findMany({ where: eq(reports.status, status as never), orderBy: (r, { desc }) => [desc(r.createdAt)] });
  return db.query.reports.findMany({ orderBy: (r, { desc }) => [desc(r.createdAt)] });
}

export async function updateReportStatus(id: string, status: "aberto" | "revisado" | "arquivado") {
  const [row] = await db.update(reports).set({ status }).where(eq(reports.id, id)).returning();
  if (!row) throw new NotFoundError("Denúncia não encontrada");
  return row;
}
