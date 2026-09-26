import { request } from "./client.js";

export function getPublicKey() {
  return request("/payments/config/public-key", { auth: false }).then((r) => r.publicKey);
}

export function createMensalidadePix(serviceType) {
  return request("/payments/mensalidade/pix", { method: "POST", body: { serviceType } });
}

export function createMensalidadeCard(serviceType, { token, parcelas, issuerId, paymentMethodId }) {
  return request("/payments/mensalidade/cartao", {
    method: "POST",
    body: { serviceType, token, parcelas, issuerId, paymentMethodId },
  });
}

export function getPaymentStatus(id) {
  return request(`/payments/${id}`);
}
