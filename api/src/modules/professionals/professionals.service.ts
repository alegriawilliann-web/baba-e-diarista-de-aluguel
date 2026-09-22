import { eq, and, gte, lte, ilike, or, sql, count } from "drizzle-orm";
import { db } from "../../config/database";
import { professionalProfiles, portfolioPosts } from "./professionals.model";
import { users, addresses } from "../users/users.model";
import { userRoles } from "../users/users.model";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "../../shared/errors";
import { parsePagination, buildPageMeta } from "../../shared/utils/pagination";
import type { Role } from "../../config/constants";
import type { CreateProfessionalInput, SearchProfessionalsQuery } from "./professionals.types";

function validateDetails(input: CreateProfessionalInput) {
  const d = input.details as Record<string, unknown>;
  if (input.serviceType === "baba") {
    if (typeof d.experienciaBebe !== "boolean" || typeof d.localTrabalho !== "string") {
      throw new ValidationError("Campos de detalhes obrigatórios para babá ausentes (experienciaBebe, localTrabalho, ...)");
    }
  } else {
    if (typeof d.fazFaxina !== "boolean") {
      throw new ValidationError("Campos de detalhes obrigatórios para diarista ausentes (fazFaxina, ...)");
    }
  }
  if (!input.valorCombinar && !input.precoHoraCents) {
    throw new ValidationError("Informe precoHoraCents ou marque valorCombinar");
  }
}

function shapeProfile(row: {
  profile: typeof professionalProfiles.$inferSelect;
  user: { name: string; email: string; photoUrl: string | null } | null;
  address: { neighborhood: string | null; city: string | null } | null;
}) {
  const { profile, user, address } = row;
  return {
    id: profile.id,
    name: user?.name ?? "",
    email: user?.email ?? "",
    fotoUrl: user?.photoUrl ?? null,
    idade: profile.idade,
    bairro: address?.neighborhood ?? null,
    cidade: address?.city ?? null,
    precoHora: profile.precoHoraCents ? profile.precoHoraCents / 100 : null,
    valorCombinar: profile.valorCombinar,
    rating: Number(profile.rating),
    ratingCount: profile.ratingCount,
    verificada: profile.verificada,
    bio: profile.bio,
    disponibilidadeNoite: profile.disponibilidadeNoite,
    disponibilidadeFimDeSemana: profile.disponibilidadeFds,
    transporte: profile.transporte,
    tags: profile.tags,
    breakdown: profile.ratingBreakdown as Record<string, number>,
    agenda: profile.agenda as Record<string, string>,
    formaPagamento: profile.formaPagamento,
    statusPagamento: profile.statusPagamento,
    seguidores: profile.seguidoresCount,
    serviceType: profile.serviceType,
    details: profile.details,
  };
}

async function fetchProfileRow(where: ReturnType<typeof eq>) {
  const rows = await db
    .select({ profile: professionalProfiles, user: { name: users.name, email: users.email, photoUrl: users.photoUrl }, address: { neighborhood: addresses.neighborhood, city: addresses.city } })
    .from(professionalProfiles)
    .leftJoin(users, eq(professionalProfiles.userId, users.id))
    .leftJoin(addresses, eq(professionalProfiles.addressId, addresses.id))
    .where(where)
    .limit(1);
  return rows[0];
}

export async function createProfessionalProfile(userId: string, input: CreateProfessionalInput) {
  validateDetails(input);

  const existing = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, input.serviceType)),
  });
  if (existing) throw new ConflictError(`Você já tem um perfil de ${input.serviceType} cadastrado`);

  const role: Role = input.serviceType === "baba" ? "profissional_baba" : "profissional_diarista";
  const statusPagamento = input.formaPagamento === "boleto" ? "pendente" : "processando";

  const profileId = await db.transaction(async (tx) => {
    const [address] = await tx
      .insert(addresses)
      .values({
        userId,
        countryCode: input.endereco.countryCode ?? "BR",
        postalCode: input.endereco.postalCode,
        street: input.endereco.street,
        number: input.endereco.number,
        complement: input.endereco.complement,
        neighborhood: input.endereco.neighborhood,
        city: input.endereco.city,
        region: input.endereco.region,
      })
      .returning();

    const [profile] = await tx
      .insert(professionalProfiles)
      .values({
        userId,
        serviceType: input.serviceType,
        addressId: address!.id,
        idade: input.idade,
        bio: input.bio,
        precoHoraCents: input.valorCombinar ? null : input.precoHoraCents,
        valorCombinar: input.valorCombinar,
        disponibilidadeNoite: input.disponibilidadeNoite ?? false,
        disponibilidadeFds: input.disponibilidadeFds ?? false,
        transporte: input.transporte,
        formaPagamento: input.formaPagamento,
        statusPagamento,
        details: input.details,
      })
      .returning();

    const existingRole = await tx.query.userRoles.findFirst({ where: and(eq(userRoles.userId, userId), eq(userRoles.role, role)) });
    if (!existingRole) await tx.insert(userRoles).values({ userId, role });

    return profile!.id;
  });

  const row = await fetchProfileRow(eq(professionalProfiles.id, profileId));
  return shapeProfile(row!);
}

export async function searchProfessionals(query: SearchProfessionalsQuery) {
  const { page, limit, offset } = parsePagination(query);
  const conditions = [
    eq(professionalProfiles.serviceType, query.serviceType),
    eq(professionalProfiles.statusPagamento, "liberado"),
  ];

  if (query.bairro) conditions.push(ilike(addresses.neighborhood, `%${query.bairro}%`));
  if (query.minRating) conditions.push(gte(professionalProfiles.rating, String(query.minRating)));
  if (query.priceMin) conditions.push(gte(professionalProfiles.precoHoraCents, Number(query.priceMin) * 100));
  if (query.priceMax) conditions.push(lte(professionalProfiles.precoHoraCents, Number(query.priceMax) * 100));
  if (query.q) {
    conditions.push(or(ilike(users.name, `%${query.q}%`), ilike(professionalProfiles.bio, `%${query.q}%`))!);
  }

  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ profile: professionalProfiles, user: { name: users.name, email: users.email, photoUrl: users.photoUrl }, address: { neighborhood: addresses.neighborhood, city: addresses.city } })
      .from(professionalProfiles)
      .leftJoin(users, eq(professionalProfiles.userId, users.id))
      .leftJoin(addresses, eq(professionalProfiles.addressId, addresses.id))
      .where(where)
      .orderBy(sql`${professionalProfiles.rating} desc`)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(professionalProfiles).leftJoin(addresses, eq(professionalProfiles.addressId, addresses.id)).leftJoin(users, eq(professionalProfiles.userId, users.id)).where(where),
  ]);

  return { data: rows.map(shapeProfile), meta: buildPageMeta(total, page, limit) };
}

export async function getProfessionalById(id: string) {
  const row = await fetchProfileRow(eq(professionalProfiles.id, id));
  if (!row) throw new NotFoundError("Profissional não encontrado");
  return shapeProfile(row);
}

export async function getMyProfile(userId: string, serviceType: "baba" | "diarista") {
  const row = await fetchProfileRow(and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType))!);
  if (!row) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");
  return shapeProfile(row);
}

async function loadOwnProfileByServiceType(userId: string, serviceType: "baba" | "diarista") {
  const profile = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");
  return profile;
}

export async function updateMyProfile(userId: string, serviceType: "baba" | "diarista", input: Record<string, unknown>) {
  const profile = await loadOwnProfileByServiceType(userId, serviceType);
  await db
    .update(professionalProfiles)
    .set({ ...input, updatedAt: new Date() } as never)
    .where(eq(professionalProfiles.id, profile.id));
  const row = await fetchProfileRow(eq(professionalProfiles.id, profile.id));
  return shapeProfile(row!);
}

export async function addPortfolioPost(userId: string, input: { cor?: string; legenda?: string; url?: string; marcado?: boolean }) {
  const profile = await loadOwnProfileByServiceType(userId, "diarista");
  const [row] = await db.insert(portfolioPosts).values({ professionalId: profile.id, ...input }).returning();
  return row;
}

export async function deletePortfolioPost(userId: string, postId: string) {
  const profile = await loadOwnProfileByServiceType(userId, "diarista");
  const post = await db.query.portfolioPosts.findFirst({ where: eq(portfolioPosts.id, postId) });
  if (!post || post.professionalId !== profile.id) throw new NotFoundError("Post não encontrado");

  await db.delete(portfolioPosts).where(eq(portfolioPosts.id, postId));
  return { ok: true };
}
