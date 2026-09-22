import type { ReportReason, ReportStatus } from "../../config/constants";

export interface ReportInput {
  targetProfessionalId: string;
  motivo: ReportReason;
  detalhes?: string;
}

export interface UpdateReportStatusInput {
  status: ReportStatus;
}
