// Single source of truth for enums shared across modules, and the
// multi-country defaults hook: adding a new country/gateway later means
// adding one entry here, not touching schema or route code.

export const ROLES = [
  "admin",
  "cliente_baba",
  "profissional_baba",
  "cliente_diarista",
  "profissional_diarista",
] as const;
export type Role = (typeof ROLES)[number];

export const SERVICE_TYPES = ["baba", "diarista"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const PAYMENT_METHODS = ["pix", "credito", "debito", "boleto"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const BOOKING_STATUSES = ["pendente", "agendado", "recusado", "concluido", "cancelado"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const SUBSCRIPTION_STATUSES = ["pendente", "processando", "liberado", "vencida"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

// Dias de tolerância após o vencimento antes do perfil ser bloqueado
// (statusPagamento vira "vencida", some da busca até pagar de novo).
export const MENSALIDADE_GRACE_DAYS = 5;

export const PAYMENT_PROVIDERS = ["mercadopago"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const PAYMENT_PURPOSES = ["mensalidade", "boost", "booking"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_STATUSES = ["pendente", "processando", "aprovado", "rejeitado", "cancelado", "reembolsado"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOST_STATUSES = ["pendente", "ativo", "expirado"] as const;
export type BoostStatus = (typeof BOOST_STATUSES)[number];

export const REPORT_REASONS = [
  "comportamento_inadequado",
  "cobranca_indevida",
  "perfil_falso",
  "assedio",
  "outro",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ["aberto", "revisado", "arquivado"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const VERIFICATION_STATUSES = ["pending", "approved", "rejected"] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const TRANSPORTE_OPTIONS = ["carro", "moto", "buscada"] as const;
export type Transporte = (typeof TRANSPORTE_OPTIONS)[number];

export const MENSALIDADE_CENTS = 2990;

interface CountryDefaults {
  currency: string;
  locale: string;
  phonePrefix: string;
  paymentProviders: PaymentProvider[];
}

export const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  BR: { currency: "BRL", locale: "pt-BR", phonePrefix: "+55", paymentProviders: ["mercadopago"] },
};

export const DEFAULT_COUNTRY_CODE = "BR";
