import { t } from "elysia";

export const updateMeBody = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  phone: t.Optional(t.String()),
  photoUrl: t.Optional(t.String()),
});

export const grantClientRoleBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  bairro: t.String({ minLength: 2, maxLength: 100 }),
});

export const trustedContactBody = t.Object({
  nome: t.String({ minLength: 2, maxLength: 150 }),
  telefone: t.String({ minLength: 8, maxLength: 20 }),
  relacao: t.String({ minLength: 2, maxLength: 60 }),
});

export const trustedContactUpdateBody = t.Object({
  nome: t.Optional(t.String({ minLength: 2, maxLength: 150 })),
  telefone: t.Optional(t.String({ minLength: 8, maxLength: 20 })),
  relacao: t.Optional(t.String({ minLength: 2, maxLength: 60 })),
});

export const roleUpdateBody = t.Object({
  roles: t.Array(t.String()),
});
