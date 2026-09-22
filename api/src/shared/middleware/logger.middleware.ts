import { Elysia } from "elysia";

export const loggerMiddleware = new Elysia({ name: "logger-middleware" })
  .derive({ as: "global" }, () => ({ __startedAt: Date.now() }))
  .onAfterResponse({ as: "global" }, ({ request, path, set, __startedAt }) => {
    const ms = Date.now() - __startedAt;
    console.log(`${request.method} ${path} -> ${set.status ?? 200} (${ms}ms)`);
  });
