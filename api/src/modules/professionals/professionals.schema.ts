import { t } from "elysia";

const enderecoSchema = t.Object({
  postalCode: t.String({ minLength: 3 }),
  street: t.String({ minLength: 2 }),
  number: t.Optional(t.String()),
  complement: t.Optional(t.String()),
  neighborhood: t.Optional(t.String()),
  city: t.String({ minLength: 2 }),
  region: t.Optional(t.String()),
  countryCode: t.Optional(t.String({ minLength: 2, maxLength: 2 })),
});

// `details` fica frouxamente tipado aqui (validação fina de quais campos são
// obrigatórios para baba vs. diarista acontece no service, onde dá pra
// checar contra `serviceType` sem lutar com union discriminado no TypeBox).
export const createProfessionalBody = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  idade: t.Number({ minimum: 16, maximum: 100 }),
  bio: t.Optional(t.String()),
  endereco: enderecoSchema,
  transporte: t.Union([t.Literal("carro"), t.Literal("moto"), t.Literal("buscada")]),
  disponibilidadeNoite: t.Optional(t.Boolean()),
  disponibilidadeFds: t.Optional(t.Boolean()),
  valorCombinar: t.Boolean(),
  precoHoraCents: t.Optional(t.Number({ minimum: 0 })),
  formaPagamento: t.Union([t.Literal("pix"), t.Literal("credito"), t.Literal("debito"), t.Literal("boleto")]),
  details: t.Record(t.String(), t.Any()),
});

export const updateProfessionalBody = t.Object({
  bio: t.Optional(t.String()),
  transporte: t.Optional(t.Union([t.Literal("carro"), t.Literal("moto"), t.Literal("buscada")])),
  disponibilidadeNoite: t.Optional(t.Boolean()),
  disponibilidadeFds: t.Optional(t.Boolean()),
  valorCombinar: t.Optional(t.Boolean()),
  precoHoraCents: t.Optional(t.Number({ minimum: 0 })),
  agenda: t.Optional(t.Record(t.String(), t.String())),
  details: t.Optional(t.Record(t.String(), t.Any())),
});

export const searchProfessionalsQuery = t.Object({
  serviceType: t.Union([t.Literal("baba"), t.Literal("diarista")]),
  q: t.Optional(t.String()),
  bairro: t.Optional(t.String()),
  minRating: t.Optional(t.Numeric()),
  priceMin: t.Optional(t.Numeric()),
  priceMax: t.Optional(t.Numeric()),
  page: t.Optional(t.Numeric()),
  limit: t.Optional(t.Numeric()),
});

export const portfolioPostBody = t.Object({
  cor: t.Optional(t.String()),
  legenda: t.Optional(t.String()),
  url: t.Optional(t.String()),
  marcado: t.Optional(t.Boolean()),
});
