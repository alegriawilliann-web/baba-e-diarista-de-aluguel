import { Elysia } from "elysia";
import { accessJwt } from "../plugins/jwt.plugin";
import type { JwtPayload } from "../types/global";
import type { Role } from "../../config/constants";
import { ForbiddenError, UnauthorizedError } from "../errors";

/**
 * Decodes the `Authorization: Bearer <token>` header (if present) into
 * `user`, and exposes a `role([...])` macro routes opt into via their config
 * object, e.g. `.get('/me', handler, { role: ['profissional_baba'] })`.
 * An empty array (`{ role: [] }`) just requires *some* authenticated user.
 * `admin` always passes, regardless of the roles list.
 */
export const authPlugin = new Elysia({ name: "auth-plugin" })
  .use(accessJwt)
  .derive({ as: "scoped" }, async ({ headers, accessJwt }) => {
    const header = headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const payload = token ? await accessJwt.verify(token) : false;
    return { user: (payload || null) as JwtPayload | null };
  })
  .macro(({ onBeforeHandle }) => ({
    role(roles: Role[]) {
      onBeforeHandle(({ user }) => {
        if (!user) throw new UnauthorizedError();
        if (roles.length === 0) return;
        const allowed = user.roles.includes("admin") || roles.some((r) => user.roles.includes(r));
        if (!allowed) throw new ForbiddenError();
      });
    },
  }));
