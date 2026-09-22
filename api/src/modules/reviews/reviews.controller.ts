import * as reviewsService from "./reviews.service";
import type { CreateReviewInput } from "./reviews.types";

export async function create(ctx: any) {
  ctx.set.status = 201;
  return reviewsService.createReview(ctx.user.sub, ctx.body as CreateReviewInput);
}

export async function listForProfessional(ctx: any) {
  return reviewsService.listForProfessional(ctx.params.id, ctx.query);
}
