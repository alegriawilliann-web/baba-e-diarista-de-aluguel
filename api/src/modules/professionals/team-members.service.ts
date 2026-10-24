import { eq, desc, and } from "drizzle-orm";
import { db } from "../../config/database";
import { professionalProfiles, teamMembers } from "./professionals.model";
import { users } from "../users/users.model";
import { NotFoundError, ForbiddenError } from "../../shared/errors";

async function ownProfile(userId: string, serviceType: "baba" | "diarista") {
  const profile = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");
  return profile;
}

export async function submit(userId: string, serviceType: "baba" | "diarista", input: { nome: string; cpf: string; certidaoNegativaFoto?: string }) {
  const profile = await ownProfile(userId, serviceType);
  const [row] = await db
    .insert(teamMembers)
    .values({ professionalId: profile.id, nome: input.nome, cpf: input.cpf, certidaoNegativaFoto: input.certidaoNegativaFoto })
    .returning();
  return row;
}

export async function listMine(userId: string, serviceType: "baba" | "diarista") {
  const profile = await ownProfile(userId, serviceType);
  return db.query.teamMembers.findMany({ where: eq(teamMembers.professionalId, profile.id), orderBy: desc(teamMembers.submittedAt) });
}

export async function remove(userId: string, serviceType: "baba" | "diarista", id: string) {
  const profile = await ownProfile(userId, serviceType);
  const membro = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
  if (!membro) throw new NotFoundError("Pessoa não encontrada");
  if (membro.professionalId !== profile.id) throw new ForbiddenError();
  await db.delete(teamMembers).where(eq(teamMembers.id, id));
  return { ok: true };
}

async function listQueueRows(where?: ReturnType<typeof eq>) {
  const rows = await db
    .select({ membro: teamMembers, professionalServiceType: professionalProfiles.serviceType, professionalName: users.name })
    .from(teamMembers)
    .leftJoin(professionalProfiles, eq(teamMembers.professionalId, professionalProfiles.id))
    .leftJoin(users, eq(professionalProfiles.userId, users.id))
    .where(where)
    .orderBy(desc(teamMembers.submittedAt));

  return rows.map((r) => ({ ...r.membro, professionalServiceType: r.professionalServiceType, professionalName: r.professionalName }));
}

export async function listQueue(status?: string) {
  if (status) return listQueueRows(eq(teamMembers.status, status as never));
  return listQueueRows();
}

export async function review(reviewerId: string, id: string, status: "approved" | "rejected") {
  const membro = await db.query.teamMembers.findFirst({ where: eq(teamMembers.id, id) });
  if (!membro) throw new NotFoundError("Pessoa não encontrada");

  const [updated] = await db
    .update(teamMembers)
    .set({ status, reviewedAt: new Date(), reviewerId })
    .where(eq(teamMembers.id, id))
    .returning();
  return updated;
}
