import { t } from "elysia";

export const registerBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String({ minLength: 8 }),
  name: t.String({ minLength: 2, maxLength: 150 }),
  phone: t.Optional(t.String()),
  countryCode: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
});

export const loginBody = t.Object({
  email: t.String({ format: "email" }),
  password: t.String(),
});

export const refreshBody = t.Object({
  refreshToken: t.String(),
});

export const forgotPasswordBody = t.Object({
  email: t.String({ format: "email" }),
});

export const resetPasswordBody = t.Object({
  email: t.String({ format: "email" }),
  code: t.String({ minLength: 6, maxLength: 6 }),
  newPassword: t.String({ minLength: 8 }),
});

export const authResponse = t.Object({
  accessToken: t.String(),
  refreshToken: t.String(),
  user: t.Object({
    id: t.String(),
    email: t.String(),
    name: t.String(),
    roles: t.Array(t.String()),
  }),
});
