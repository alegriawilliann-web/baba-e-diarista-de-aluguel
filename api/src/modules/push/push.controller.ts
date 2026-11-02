import * as pushService from "./push.service";
import type { RegisterPushTokenInput } from "./push.types";

export async function register(ctx: any) {
  const { token, platform } = ctx.body as RegisterPushTokenInput;
  return pushService.registerToken(ctx.user.sub, token, platform);
}

export async function unregister(ctx: any) {
  const { token } = ctx.body as { token: string };
  return pushService.unregisterToken(ctx.user.sub, token);
}
