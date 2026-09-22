import * as trustSafetyService from "./trust-safety.service";
import type { ReportInput, UpdateReportStatusInput } from "./trust-safety.types";

export async function block(ctx: any) {
  ctx.set.status = 201;
  return trustSafetyService.block(ctx.user.sub, (ctx.body as { professionalId: string }).professionalId);
}

export async function unblock(ctx: any) {
  return trustSafetyService.unblock(ctx.user.sub, ctx.params.id);
}

export async function listMyBlocks(ctx: any) {
  return trustSafetyService.listMyBlocks(ctx.user.sub);
}

export async function report(ctx: any) {
  ctx.set.status = 201;
  return trustSafetyService.report(ctx.user.sub, ctx.body as ReportInput);
}

export async function listReports(ctx: any) {
  return trustSafetyService.listReports(ctx.query?.status);
}

export async function updateReportStatus(ctx: any) {
  const { status } = ctx.body as UpdateReportStatusInput;
  return trustSafetyService.updateReportStatus(ctx.params.id, status);
}
