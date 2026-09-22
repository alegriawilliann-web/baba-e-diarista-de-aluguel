import type { Role } from "../../config/constants";

export interface UpdateMeInput {
  name?: string;
  phone?: string;
  photoUrl?: string;
}

export interface GrantClientRoleInput {
  serviceType: "baba" | "diarista";
  bairro: string;
}

export interface TrustedContactInput {
  nome: string;
  telefone: string;
  relacao: string;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  photoUrl: string | null;
  roles: Role[];
}
