export interface CreatePixInput {
  valorCentavos: number;
  descricao: string;
  email: string;
  nome?: string;
  referenciaExterna: string;
}

export interface PixResult {
  providerPaymentId: string;
  status: string;
  qrCodeBase64: string | null;
  qrCodeCopiaECola: string | null;
  expiraEm: string | null;
}

export interface CreateCardInput {
  valorCentavos: number;
  descricao: string;
  email: string;
  token: string;
  parcelas?: number;
  issuerId?: string;
  paymentMethodId: string;
  referenciaExterna: string;
}

export interface CardResult {
  providerPaymentId: string;
  status: string;
  statusDetail?: string;
}

export interface StatusResult {
  providerPaymentId: string;
  status: string;
  statusDetail?: string;
}

/** Implemented per-gateway (mercadopago now, others per-country later) so
 * payments.service.ts never talks to a specific SDK directly. */
export interface PaymentProviderAdapter {
  createPixPayment(input: CreatePixInput): Promise<PixResult>;
  createCardPayment(input: CreateCardInput): Promise<CardResult>;
  getPayment(providerPaymentId: string): Promise<StatusResult>;
}
