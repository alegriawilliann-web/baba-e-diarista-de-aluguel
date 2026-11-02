import { t } from "elysia";

export const registerPushTokenBody = t.Object({
  token: t.String({ minLength: 10 }),
  platform: t.Optional(t.String({ maxLength: 20 })),
});

export const unregisterPushTokenBody = t.Object({
  token: t.String({ minLength: 10 }),
});
