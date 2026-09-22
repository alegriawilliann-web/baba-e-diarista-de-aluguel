import { eq, desc, count } from "drizzle-orm";
import { db } from "../../config/database";
import { reviews } from "./reviews.model";
import { bookings } from "../bookings/bookings.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors";
import { parsePagination, buildPageMeta, type PaginationQuery } from "../../shared/utils/pagination";

export async function createReview(authorId: string, input: { bookingId: string; estrelas: number; comentario?: string }) {
  if (input.estrelas < 1 || input.estrelas > 5) throw new ValidationError("estrelas deve ser entre 1 e 5");

  return db.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({ where: eq(bookings.id, input.bookingId) });
    if (!booking) throw new NotFoundError("Contratação não encontrada");
    if (booking.clientId !== authorId) throw new ForbiddenError();
    if (booking.status !== "concluido") throw new ConflictError("Só é possível avaliar contratações concluídas");

    const existing = await tx.query.reviews.findFirst({ where: eq(reviews.bookingId, input.bookingId) });
    if (existing) throw new ConflictError("Essa contratação já foi avaliada");

    const [review] = await tx
      .insert(reviews)
      .values({ bookingId: input.bookingId, professionalId: booking.professionalId, authorId, estrelas: input.estrelas, comentario: input.comentario })
      .returning();

    const profile = await tx.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, booking.professionalId) });
    if (profile) {
      const oldCount = profile.ratingCount;
      const oldRating = Number(profile.rating);
      const newCount = oldCount + 1;
      const newRating = (oldRating * oldCount + input.estrelas) / newCount;
      const breakdown = { ...(profile.ratingBreakdown as Record<string, number>) };
      const key = String(input.estrelas);
      breakdown[key] = (breakdown[key] ?? 0) + 1;

      await tx
        .update(professionalProfiles)
        .set({ ratingCount: newCount, rating: newRating.toFixed(2), ratingBreakdown: breakdown })
        .where(eq(professionalProfiles.id, booking.professionalId));
    }

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
