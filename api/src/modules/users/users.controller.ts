import * as usersService from "./users.service";
import type { GrantClientRoleInput, TrustedContactInput, UpdateMeInput } from "./users.types";

export async function getMe(ctx: any) {
  return usersService.getMe(ctx.user.sub);
}

export async function updateMe(ctx: any) {
  return usersService.updateMe(ctx.user.sub, ctx.body as UpdateMeInput);
}

export async function grantClientRole(ctx: any) {
  return usersService.grantClientRole(ctx.user.sub, ctx.body as GrantClientRoleInput);
}

export async function listTrustedContacts(ctx: any) {
  return usersService.listTrustedContacts(ctx.user.sub);
}

export async function addTrustedContact(ctx: any) {
  ctx.set.status = 201;
  return usersService.addTrustedContact(ctx.user.sub, ctx.body as TrustedContactInput);
}

export async function updateTrustedContact(ctx: any) {
  return usersService.updateTrustedContact(ctx.user.sub, ctx.params.id, ctx.body as Partial<TrustedContactInput>);
}

export async function deleteTrustedContact(ctx: any) {
  return usersService.deleteTrustedContact(ctx.user.sub, ctx.params.id);
}

export async function listUsers(ctx: any) {
  return usersService.listUsers(ctx.query);
}

export async function updateUserRoles(ctx: any) {
  const { roles } = ctx.body as { roles: string[] };
  return usersService.updateUserRoles(ctx.params.id, roles as never);
}
