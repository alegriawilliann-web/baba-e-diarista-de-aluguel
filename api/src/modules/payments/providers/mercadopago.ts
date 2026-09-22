import { MercadoPagoConfig, Payment } from "mercadopago";
import { env } from "../../../config/env";
import type { CardResult, CreateCardInput, CreatePixInput, PaymentProviderAdapter, PixResult, StatusResult } from "../payments.types";

function client() {
  if (!env.MP_ACCESS_TOKEN) throw new Error("MP_ACCESS_TOKEN não configurado");
  return new Payment(new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN }));
}

// Porta direta da lógica já validada em server/src/mercadopago.js (protótipo
// Express) — mesma API do SDK v2, agora atrás da interface PaymentProviderAdapter.
export const mercadoPagoProvider: PaymentProviderAdapter = {
  async createPixPayment(input: CreatePixInput): Promise<PixResult> {
    const [firstName, ...rest] = (input.nome || "Cliente").split(" ");
    const result = await client().create({
      body: {
        transaction_amount: Number((input.valorCentavos / 100).toFixed(2)),
        description: input.descricao,
        payment_method_id: "pix",
        external_reference: input.referenciaExterna,
        payer: { email: input.email, first_name: firstName, last_name: rest.join(" ") || firstName },
      },
    });

    const dados = result.point_of_interaction?.transaction_data;
    return {
      providerPaymentId: String(result.id),
      status: result.status ?? "pending",
      qrCodeBase64: dados?.qr_code_base64 ?? null,
      qrCodeCopiaECola: dados?.qr_code ?? null,
      expiraEm: result.date_of_expiration ?? null,
    };
  },

  async createCardPayment(input: CreateCardInput): Promise<CardResult> {
    const result = await client().create({
      body: {
        transaction_amount: Number((input.valorCentavos / 100).toFixed(2)),
        description: input.descricao,
        token: input.token,
        installments: input.parcelas || 1,
        issuer_id: input.issuerId,
        payment_method_id: input.paymentMethodId,
        external_reference: input.referenciaExterna,
        payer: { email: input.email },
      },
    });

    return { providerPaymentId: String(result.id), status: result.status ?? "pending", statusDetail: result.status_detail };
  },

  async getPayment(providerPaymentId: string): Promise<StatusResult> {
    const result = await client().get({ id: providerPaymentId });
    return { providerPaymentId: String(result.id), status: result.status ?? "pending", statusDetail: result.status_detail };
  },
};
