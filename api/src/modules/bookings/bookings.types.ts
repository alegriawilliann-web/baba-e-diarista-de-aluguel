import type { BookingStatus, PaymentMethod, ServiceType } from "../../config/constants";

export interface CreateBookingInput {
  professionalId: string;
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:MM"
  servico: string;
  amountCents: number;
  formaPagamento: PaymentMethod;
}

export interface BookingDTO {
  id: string;
  clientId: string;
  professionalId: string;
  serviceType: ServiceType;
  data: string;
  horario: string;
  servico: string;
  valorCents: number;
  formaPagamento: PaymentMethod;
  status: BookingStatus;
  checkin: string | null;
  checkout: string | null;
}
