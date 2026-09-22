import * as notificationsService from "./notifications.service";

export async function list(ctx: any) {
  return notificationsService.list(ctx.user.sub);
}

export async function markRead(ctx: any) {
  return notificationsService.markRead(ctx.user.sub, ctx.params.id);
}

export async function markAllRead(ctx: any) {
  return notificationsService.markAllRead(ctx.user.sub);
}
