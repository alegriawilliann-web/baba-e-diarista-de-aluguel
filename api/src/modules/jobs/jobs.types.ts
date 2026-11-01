import type { ServiceType, JobStatus, JobApplicationStatus } from "../../config/constants";

export interface CreateJobPostInput {
  serviceType: ServiceType;
  descricao: string;
  bairro?: string;
  cidade?: string;
}

export interface JobPostDTO {
  id: string;
  clientId: string;
  serviceType: ServiceType;
  descricao: string;
  bairro: string | null;
  cidade: string | null;
  status: JobStatus;
  createdAt: Date;
  candidaturasCount?: number;
  jaCandidatei?: boolean;
}

export interface JobApplicationDTO {
  id: string;
  jobPostId: string;
  professionalId: string;
  mensagem: string;
  status: JobApplicationStatus;
  createdAt: Date;
  profissional?: {
    nome: string;
    fotoUrl: string | null;
    rating: number;
    ratingCount: number;
  };
}
