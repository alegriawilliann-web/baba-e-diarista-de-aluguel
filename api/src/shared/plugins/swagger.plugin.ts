import { swagger } from "@elysiajs/swagger";

export const swaggerPlugin = swagger({
  path: "/docs",
  documentation: {
    info: {
      title: "Baba de Aluguel / Diarista de Aluguel API",
      version: "1.0.0",
      description: "API para o app de aluguel de babás e diaristas.",
    },
    tags: [
      { name: "auth", description: "Autenticação e sessão" },
      { name: "users", description: "Usuários e perfis de cliente" },
      { name: "professionals", description: "Perfis de babás e diaristas" },
      { name: "bookings", description: "Contratações/agendamentos" },
      { name: "reviews", description: "Avaliações" },
      { name: "payments", description: "Pagamentos (Mercado Pago)" },
      { name: "boosts", description: "Planos de impulsionamento" },
      { name: "trust-safety", description: "Bloqueios e denúncias" },
      { name: "notifications", description: "Notificações" },
      { name: "messages", description: "Conversas e mensagens" },
      { name: "verifications", description: "Verificação de antecedentes" },
    ],
  },
});
