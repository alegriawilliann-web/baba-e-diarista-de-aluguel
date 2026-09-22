import type { PaymentMethod, ServiceType, SubscriptionStatus, Transporte } from "../../config/constants";

export interface Pacote {
  label: string;
  valorCents: number | null;
}

export interface BabaDetails {
  experienciaBebe: boolean;
  experienciaRecemNascido: boolean;
  sabeCozinhar: boolean;
  localTrabalho: "minha_casa" | "casa_familia" | "ambos";
  pacotes: Pacote[];
}

export interface DiaristaDetails {
  fazFaxina: boolean;
  fazComida: boolean;
  trabalhaComEquipe: boolean;
  servicos: Pacote[];
}

export type ProfessionalDetails = BabaDetails | DiaristaDetails;

export interface AddressInput {
  postalCode: string;
  street: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city: string;
  region?: string;
  countryCode?: string;
}

export interface CreateProfessionalInput {
  serviceType: ServiceType;
  idade: number;
  bio?: string;
  endereco: AddressInput;
  transporte: Transporte;
  disponibilidadeNoite?: boolean;
  disponibilidadeFds?: boolean;
  valorCombinar: boolean;
  precoHoraCents?: number;
  formaPagamento: PaymentMethod;
  details: ProfessionalDetails;
}

export interface SearchProfessionalsQuery {
  serviceType: ServiceType;
  q?: string;
  bairro?: string;
  minRating?: string | number;
  priceMin?: string | number;
  priceMax?: string | number;
  page?: string | number;
  limit?: string | number;
}

// Mesmos nomes de campo que `construirPerfilBaba`/`construirPerfilDiarista`
// no App.jsx produzem hoje — facilita a futura migração do front pra API real.
export interface ProfessionalProfileDTO {
  id: string;
  name: string;
  email: string;
  fotoUrl: string | null;
  idade: number;
  bairro: string | null;
  cidade: string | null;
  precoHora: number | null;
  valorCombinar: boolean;
  rating: number;
  ratingCount: number;
  verificada: boolean;
  bio: string | null;
  disponibilidadeNoite: boolean;
  disponibilidadeFimDeSemana: boolean;
  transporte: Transporte;
  tags: string[];
  breakdown: Record<string, number>;
  agenda: Record<string, string>;
  formaPagamento: PaymentMethod;
  statusPagamento: SubscriptionStatus;
  seguidores: number;
  serviceType: ServiceType;
  details: ProfessionalDetails;
}
