import { eq, and, desc, count } from "drizzle-orm";
import { db } from "../../config/database";
import { reviews } from "./reviews.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors";
import { parsePagination, buildPageMeta, type PaginationQuery } from "../../shared/utils/pagination";

export async function createReview(authorId: string, input: { professionalId: string; bookingId?: string; estrelas: number; comentario?: string }) {
  if (input.estrelas < 1 || input.estrelas > 5) throw new ValidationError("estrelas deve ser entre 1 e 5");

  return db.transaction(async (tx) => {
    const profile = await tx.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, input.professionalId) });
    if (!profile) throw new NotFoundError("Profissional não encontrado");
    if (profile.userId === authorId) throw new ForbiddenError("Você não pode avaliar seu próprio perfil");

    // Um contratante pode avaliar uma vez por profissional — mandar de novo
    // edita a avaliação existente (recalculando a média certo) em vez de
    // criar uma duplicada.
    const existing = await tx.query.reviews.findFirst({
      where: and(eq(reviews.authorId, authorId), eq(reviews.professionalId, input.professionalId)),
    });

    const breakdown = { ...(profile.ratingBreakdown as Record<string, number>) };

    if (existing) {
      const [review] = await tx
        .update(reviews)
        .set({ estrelas: input.estrelas, comentario: input.comentario, bookingId: input.bookingId ?? existing.bookingId, updatedAt: new Date() })
        .where(eq(reviews.id, existing.id))
        .returning();

      const chaveAntiga = String(existing.estrelas);
      breakdown[chaveAntiga] = Math.max(0, (breakdown[chaveAntiga] ?? 0) - 1);
      const chaveNova = String(input.estrelas);
      breakdown[chaveNova] = (breakdown[chaveNova] ?? 0) + 1;

      const somaAtual = Number(profile.rating) * profile.ratingCount;
      const novaSoma = somaAtual - existing.estrelas + input.estrelas;
      const novaMedia = profile.ratingCount > 0 ? novaSoma / profile.ratingCount : 0;

      await tx.update(professionalProfiles).set({ rating: novaMedia.toFixed(2), ratingBreakdown: breakdown }).where(eq(professionalProfiles.id, input.professionalId));
      return review!;
    }

    const [review] = await tx
      .insert(reviews)
      .values({ bookingId: input.bookingId, professionalId: input.professionalId, authorId, estrelas: input.estrelas, comentario: input.comentario })
      .returning();

    const oldCount = profile.ratingCount;
    const oldRating = Number(profile.rating);
    const newCount = oldCount + 1;
    const newRating = (oldRating * oldCount + input.estrelas) / newCount;
    const chave = String(input.estrelas);
    breakdown[chave] = (breakdown[chave] ?? 0) + 1;

    await tx
      .update(professionalProfiles)
      .set({ ratingCount: newCount, rating: newRating.toFixed(2), ratingBreakdown: breakdown })
      .where(eq(professionalProfiles.id, input.professionalId));

    return review!;
  });
}

export async function listForProfessional(professionalId: string, query: PaginationQuery) {
  const { page, limit, offset } = parsePagination(query);
  const where = eq(reviews.professionalId, professionalId);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ review: reviews, authorName: users.name })
      .from(reviews)
      .leftJoin(users, eq(reviews.authorId, users.id))
      .where(where)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(reviews).where(where),
  ]);

  const data = rows.map((r) => ({
    id: r.review.id,
    estrelas: r.review.estrelas,
    comentario: r.review.comentario,
    autor: r.authorName ?? "Usuário",
    createdAt: r.review.createdAt,
  }));

  return { data, meta: buildPageMeta(total, page, limit) };
}
