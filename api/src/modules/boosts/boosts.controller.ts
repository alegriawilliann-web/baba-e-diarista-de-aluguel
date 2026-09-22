import * as boostsService from "./boosts.service";
import type { PurchaseBoostInput } from "./boosts.types";

export async function listPlans() {
  return boostsService.listPlans();
}

export async function purchase(ctx: any) {
  const body = ctx.body as PurchaseBoostInput & { serviceType: "baba" | "diarista" };
  ctx.set.status = 201;
  return boostsService.purchase(ctx.user.sub, body.serviceType, body.planKey, body.durationDays);
}

export async function listMine(ctx: any) {
  return boostsService.listMine(ctx.user.sub);
}
