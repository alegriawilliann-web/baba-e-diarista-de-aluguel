import * as professionalsService from "./professionals.service";
import type { CreateProfessionalInput, SearchProfessionalsQuery } from "./professionals.types";

export async function create(ctx: any) {
  ctx.set.status = 201;
  return professionalsService.createProfessionalProfile(ctx.user.sub, ctx.body as CreateProfessionalInput);
}

export async function search(ctx: any) {
  return professionalsService.searchProfessionals(ctx.query as SearchProfessionalsQuery);
}

export async function getById(ctx: any) {
  return professionalsService.getProfessionalById(ctx.params.id);
}

export async function getMe(ctx: any) {
  const serviceType = ctx.query.serviceType as "baba" | "diarista";
  return professionalsService.getMyProfile(ctx.user.sub, serviceType);
}

export async function updateMe(ctx: any) {
  const serviceType = ctx.query.serviceType as "baba" | "diarista";
  return professionalsService.updateMyProfile(ctx.user.sub, serviceType, ctx.body as Record<string, unknown>);
}

export async function addPortfolioPost(ctx: any) {
  ctx.set.status = 201;
  return professionalsService.addPortfolioPost(ctx.user.sub, ctx.body);
}

export async function deletePortfolioPost(ctx: any) {
  return professionalsService.deletePortfolioPost(ctx.user.sub, ctx.params.id);
}
