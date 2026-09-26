// auth doesn't own tables — it operates on the users module's tables.
// Re-exported here so auth.service.ts can import everything it needs from
// one local path, per the file-per-concern convention.
export { users, userRoles, refreshTokens, authTokens } from "../users/users.model";
