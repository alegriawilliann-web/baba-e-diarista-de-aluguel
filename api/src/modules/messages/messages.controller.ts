import * as messagesService from "./messages.service";
import type { CreateConversationInput, SendMessageInput } from "./messages.types";

export async function listMine(ctx: any) {
  return messagesService.listMine(ctx.user.sub);
}

export async function create(ctx: any) {
  ctx.set.status = 201;
  return messagesService.createConversation(ctx.user.sub, ctx.body as CreateConversationInput);
}

export async function listMessages(ctx: any) {
  return messagesService.listMessages(ctx.user.sub, ctx.params.id);
}

export async function sendMessage(ctx: any) {
  ctx.set.status = 201;
  return messagesService.sendMessage(ctx.user.sub, ctx.params.id, (ctx.body as SendMessageInput).texto);
}
