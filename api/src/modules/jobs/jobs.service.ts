import { eq, and, inArray, count } from "drizzle-orm";
import { db } from "../../config/database";
import { jobPosts, jobApplications } from "./jobs.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../../shared/errors";
import { parsePagination, buildPageMeta } from "../../shared/utils/pagination";
import { notify } from "../notifications/notifications.service";
import type { ServiceType } from "../../config/constants";
import type { CreateJobPostInput } from "./jobs.types";

async function loadOwnJobPost(clientId: string, jobId: string) {
  const job = await db.query.jobPosts.findFirst({ where: eq(jobPosts.id, jobId) });
  if (!job) throw new NotFoundError("Vaga não encontrada");
  if (job.clientId !== clientId) throw new ForbiddenError();
  return job;
}

async function loadOwnProfessionalProfile(userId: string, serviceType: ServiceType) {
  const profile = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType)),
  });
  if (!profile) throw new ForbiddenError("Você não tem um perfil profissional desse tipo");
  return profile;
}

export async function createJobPost(clientId: string, input: CreateJobPostInput) {
  const [row] = await db
    .insert(jobPosts)
    .values({ clientId, serviceType: input.serviceType, descricao: input.descricao, bairro: input.bairro, cidade: input.cidade })
    .returning();
  return row;
}

export async function listMyJobPosts(clientId: string) {
  const jobs = await db.query.jobPosts.findMany({ where: eq(jobPosts.clientId, clientId), orderBy: (j, { desc }) => [desc(j.createdAt)] });
  if (jobs.length === 0) return [];

  const counts = await db
    .select({ jobPostId: jobApplications.jobPostId, total: count() })
    .from(jobApplications)
    .where(inArray(jobApplications.jobPostId, jobs.map((j) => j.id)))
    .groupBy(jobApplications.jobPostId);
  const countMap = new Map(counts.map((c) => [c.jobPostId, c.total]));

  return jobs.map((job) => ({ ...job, candidaturasCount: countMap.get(job.id) ?? 0 }));
}

export async function closeJobPost(clientId: string, jobId: string) {
  await loadOwnJobPost(clientId, jobId);
  const [row] = await db.update(jobPosts).set({ status: "fechada", updatedAt: new Date() }).where(eq(jobPosts.id, jobId)).returning();
  return row;
}

export async function listOpenJobsForProfessional(userId: string, serviceType: ServiceType, query: { page?: number; limit?: number }) {
  const profile = await loadOwnProfessionalProfile(userId, serviceType);
  const { page, limit, offset } = parsePagination(query);

  const where = and(eq(jobPosts.serviceType, serviceType), eq(jobPosts.status, "aberta"));
  const [jobs, [{ total }]] = await Promise.all([
    db.query.jobPosts.findMany({ where, orderBy: (j, { desc }) => [desc(j.createdAt)], limit, offset }),
    db.select({ total: count() }).from(jobPosts).where(where),
  ]);

  if (jobs.length === 0) return { data: [], meta: buildPageMeta(total, page, limit) };

  const minhasCandidaturas = await db.query.jobApplications.findMany({
    where: and(inArray(jobApplications.jobPostId, jobs.map((j) => j.id)), eq(jobApplications.professionalId, profile.id)),
  });
  const candidatadas = new Set(minhasCandidaturas.map((a) => a.jobPostId));

  return { data: jobs.map((job) => ({ ...job, jaCandidatei: candidatadas.has(job.id) })), meta: buildPageMeta(total, page, limit) };
}

export async function applyToJob(userId: string, jobId: string, mensagem: string) {
  const job = await db.query.jobPosts.findFirst({ where: eq(jobPosts.id, jobId) });
  if (!job) throw new NotFoundError("Vaga não encontrada");
  if (job.status !== "aberta") throw new ConflictError("Essa vaga não está mais aberta");

  const profile = await loadOwnProfessionalProfile(userId, job.serviceType);

  const existing = await db.query.jobApplications.findFirst({
    where: and(eq(jobApplications.jobPostId, jobId), eq(jobApplications.professionalId, profile.id)),
  });
  if (existing) throw new ConflictError("Você já enviou uma candidatura para essa vaga");

  const [row] = await db.insert(jobApplications).values({ jobPostId: jobId, professionalId: profile.id, mensagem }).returning();

  // `link` não é uma URL — é "serviceType:jobId", o suficiente pra tela de
  // notificações abrir a aba de vagas certa (vertical + papel) sem precisar
  // de uma rota de verdade (o app não tem roteador).
  await notify({ userId: job.clientId, tipo: "nova_candidatura", texto: "Você recebeu uma nova candidatura para sua vaga", link: `${job.serviceType}:${jobId}` });

  return row;
}

export async function listMyApplications(userId: string, serviceType: ServiceType) {
  const profile = await loadOwnProfessionalProfile(userId, serviceType);
  const applications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.professionalId, profile.id),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });
  if (applications.length === 0) return [];

  const jobs = await db.query.jobPosts.findMany({ where: inArray(jobPosts.id, applications.map((a) => a.jobPostId)) });
  const jobMap = new Map(jobs.map((j) => [j.id, j]));

  return applications.map((a) => ({ ...a, vaga: jobMap.get(a.jobPostId) ?? null }));
}

export async function getJobPostApplications(clientId: string, jobId: string) {
  await loadOwnJobPost(clientId, jobId);
  const applications = await db.query.jobApplications.findMany({
    where: eq(jobApplications.jobPostId, jobId),
    orderBy: (a, { desc }) => [desc(a.createdAt)],
  });
  if (applications.length === 0) return [];

  const rows = await db
    .select({ profile: professionalProfiles, user: { name: users.name, photoUrl: users.photoUrl } })
    .from(professionalProfiles)
    .leftJoin(users, eq(professionalProfiles.userId, users.id))
    .where(inArray(professionalProfiles.id, applications.map((a) => a.professionalId)));
  const profileMap = new Map(rows.map((r) => [r.profile.id, r]));

  return applications.map((a) => {
    const row = profileMap.get(a.professionalId);
    return {
      ...a,
      profissional: row
        ? { id: row.profile.id, nome: row.user?.name ?? "", fotoUrl: row.user?.photoUrl ?? null, rating: Number(row.profile.rating), ratingCount: row.profile.ratingCount }
        : null,
    };
  });
}

export async function updateApplicationStatus(clientId: string, jobId: string, applicationId: string, status: "aceita" | "recusada") {
  await loadOwnJobPost(clientId, jobId);
  const application = await db.query.jobApplications.findFirst({ where: eq(jobApplications.id, applicationId) });
  if (!application || application.jobPostId !== jobId) throw new NotFoundError("Candidatura não encontrada");

  const [row] = await db.update(jobApplications).set({ status }).where(eq(jobApplications.id, applicationId)).returning();

  if (status === "aceita") {
    const profile = await db.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, application.professionalId) });
    if (profile) {
      await notify({ userId: profile.userId, tipo: "candidatura_aceita", texto: "Sua candidatura foi aceita! A contratante pode te procurar pra combinar os detalhes.", link: `${profile.serviceType}:${jobId}` });
    }
  }

  return row;
}
