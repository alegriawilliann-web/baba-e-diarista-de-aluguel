import * as teamMembersService from "./team-members.service";

export async function submit(ctx: any) {
  const { serviceType, ...input } = ctx.body as { serviceType: "baba" | "diarista"; nome: string; cpf: string; certidaoNegativaFoto?: string };
  ctx.set.status = 201;
  return teamMembersService.submit(ctx.user.sub, serviceType, input);
}

export async function listMine(ctx: any) {
  return teamMembersService.listMine(ctx.user.sub, ctx.query.serviceType);
}

export async function remove(ctx: any) {
  return teamMembersService.remove(ctx.user.sub, ctx.query.serviceType, ctx.params.id);
}

export async function listQueue(ctx: any) {
  return teamMembersService.listQueue(ctx.query?.status);
}

export async function review(ctx: any) {
  const { status } = ctx.body as { status: "approved" | "rejected" };
  return teamMembersService.review(ctx.user.sub, ctx.params.id, status);
}
