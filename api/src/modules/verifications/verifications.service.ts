import { eq, desc } from "drizzle-orm";
import { db } from "../../config/database";
import { verifications } from "./verifications.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { NotFoundError } from "../../shared/errors";

export async function submit(userId: string, serviceType: "baba" | "diarista", input: { documentType: string; documentRef: string }) {
  const profile = await db.query.professionalProfiles.findFirst({
    where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.userId, userId), eqOp(p.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");

  const [row] = await db.insert(verifications).values({ professionalId: profile.id, documentType: input.documentType, documentRef: input.documentRef }).returning();
  return row;
}

export async function listMine(userId: string, serviceType: "baba" | "diarista") {
  const profile = await db.query.professionalProfiles.findFirst({
    where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.userId, userId), eqOp(p.serviceType, serviceType)),
  });
  if (!profile) return [];
  return db.query.verifications.findMany({ where: eq(verifications.professionalId, profile.id) });
}

// Junta com professional_profiles/users pra fila de admin não precisar de
// uma segunda chamada só pra saber de quem é cada pedido.
async function listQueueRows(where?: ReturnType<typeof eq>) {
  const rows = await db
    .select({
      verification: verifications,
      professionalServiceType: professionalProfiles.serviceType,
      professionalName: users.name,
    })
    .from(verifications)
    .leftJoin(professionalProfiles, eq(verifications.professionalId, professionalProfiles.id))
    .leftJoin(users, eq(professionalProfiles.userId, users.id))
    .where(where)
    .orderBy(desc(verifications.submittedAt));

  return rows.map((r) => ({ ...r.verification, professionalServiceType: r.professionalServiceType, professionalName: r.professionalName }));
}

export async function listQueue(status?: string) {
  if (status) return listQueueRows(eq(verifications.status, status as never));
  return listQueueRows();
}

export async function review(reviewerId: string, id: string, status: "approved" | "rejected", notes?: string) {
  const verification = await db.query.verifications.findFirst({ where: eq(verifications.id, id) });
  if (!verification) throw new NotFoundError("Verificação não encontrada");

  const [updated] = await db
    .update(verifications)
    .set({ status, reviewedAt: new Date(), reviewerId, notes })
    .where(eq(verifications.id, id))
    .returning();

  if (status === "approved") {
    if (verification.documentType === "certidao_negativa") {
      await db
        .update(professionalProfiles)
        .set({ certidaoNegativaUrl: verification.documentRef })
        .where(eq(professionalProfiles.id, verification.professionalId));
    } else {
      await db.update(professionalProfiles).set({ verificada: true }).where(eq(professionalProfiles.id, verification.professionalId));
    }
  }

  return updated;
}
