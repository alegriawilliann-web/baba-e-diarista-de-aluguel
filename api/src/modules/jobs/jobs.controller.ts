import * as jobsService from "./jobs.service";
import type { CreateJobPostInput } from "./jobs.types";
import type { ServiceType } from "../../config/constants";

export async function create(ctx: any) {
  ctx.set.status = 201;
  return jobsService.createJobPost(ctx.user.sub, ctx.body as CreateJobPostInput);
}

export async function listMine(ctx: any) {
  return jobsService.listMyJobPosts(ctx.user.sub);
}

export async function close(ctx: any) {
  return jobsService.closeJobPost(ctx.user.sub, ctx.params.id);
}

export async function listOpen(ctx: any) {
  return jobsService.listOpenJobsForProfessional(ctx.user.sub, ctx.query.serviceType as ServiceType, { page: ctx.query.page, limit: ctx.query.limit });
}

export async function apply(ctx: any) {
  ctx.set.status = 201;
  return jobsService.applyToJob(ctx.user.sub, ctx.params.id, (ctx.body as { mensagem: string }).mensagem);
}

export async function listMyApplications(ctx: any) {
  return jobsService.listMyApplications(ctx.user.sub, ctx.query.serviceType as ServiceType);
}

export async function getApplications(ctx: any) {
  return jobsService.getJobPostApplications(ctx.user.sub, ctx.params.id);
}

export async function updateApplicationStatus(ctx: any) {
  return jobsService.updateApplicationStatus(ctx.user.sub, ctx.params.id, ctx.params.applicationId, (ctx.body as { status: "aceita" | "recusada" }).status);
}
