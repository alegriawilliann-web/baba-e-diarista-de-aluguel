import { jwt } from "@elysiajs/jwt";
import { env } from "../../config/env";

export const accessJwt = jwt({
  name: "accessJwt",
  secret: env.JWT_SECRET,
  exp: env.JWT_EXPIRES_IN,
});

// Separate secret namespace (same secret value is fine, but a distinct
// plugin name) so a refresh token can never be replayed as an access token.
export const refreshJwt = jwt({
  name: "refreshJwt",
  secret: `${env.JWT_SECRET}:refresh`,
  exp: env.JWT_REFRESH_EXPIRES_IN,
});
