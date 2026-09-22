import { MercadoPagoConfig, Payment } from "mercadopago";

if (!process.env.MP_ACCESS_TOKEN) {
  throw new Error("MP_ACCESS_TOKEN não configurado (veja server/.env.example)");
}

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
export const mpPayment = new Payment(client);

export async function criarPagamentoPix({ valorCentavos, descricao, email, nome, referenciaExterna }) {
  const [firstName, ...rest] = (nome || "Cliente").split(" ");
  const result = await mpPayment.create({
    body: {
      transaction_amount: Number((valorCentavos / 100).toFixed(2)),
      description: descricao,
      payment_method_id: "pix",
      external_reference: referenciaExterna,
      payer: {
        email,
        first_name: firstName,
        last_name: rest.join(" ") || firstName,
      },
    },
  });

  const dados = result.point_of_interaction?.transaction_data;
  return {
    mpPaymentId: String(result.id),
    status: result.status,
    qrCodeBase64: dados?.qr_code_base64 ?? null,
    qrCodeCopiaECola: dados?.qr_code ?? null,
    expiraEm: result.date_of_expiration ?? null,
  };
}

export async function criarPagamentoCartao({ valorCentavos, descricao, email, token, parcelas, issuerId, paymentMethodId, referenciaExterna }) {
  const result = await mpPayment.create({
    body: {
      transaction_amount: Number((valorCentavos / 100).toFixed(2)),
      description: descricao,
      token,
      installments: parcelas || 1,
      issuer_id: issuerId,
      payment_method_id: paymentMethodId,
      external_reference: referenciaExterna,
      payer: { email },
    },
  });

  return {
    mpPaymentId: String(result.id),
    status: result.status,
    statusDetail: result.status_detail,
  };
}

export async function consultarPagamentoMP(mpPaymentId) {
  const result = await mpPayment.get({ id: mpPaymentId });
  return { mpPaymentId: String(result.id), status: result.status, statusDetail: result.status_detail };
}
