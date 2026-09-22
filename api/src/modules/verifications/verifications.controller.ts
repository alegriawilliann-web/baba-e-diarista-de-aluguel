import * as verificationsService from "./verifications.service";
import type { SubmitVerificationInput } from "./verifications.types";

export async function submit(ctx: any) {
  const { serviceType, ...input } = ctx.body as SubmitVerificationInput;
  ctx.set.status = 201;
  return verificationsService.submit(ctx.user.sub, serviceType, input);
}

export async function listMine(ctx: any) {
  return verificationsService.listMine(ctx.user.sub, ctx.query.serviceType);
}

export async function listQueue(ctx: any) {
  return verificationsService.listQueue(ctx.query?.status);
}

export async function review(ctx: any) {
  const { status, notes } = ctx.body as { status: "approved" | "rejected"; notes?: string };
  return verificationsService.review(ctx.user.sub, ctx.params.id, status, notes);
}
