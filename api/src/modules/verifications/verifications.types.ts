export interface SubmitVerificationInput {
  serviceType: "baba" | "diarista";
  documentType: "rg" | "cnh" | "cpf" | "selfie";
  documentRef: string;
}
