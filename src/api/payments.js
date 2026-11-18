import { request } from "./client.js";

export function getPublicKey() {
  return request("/payments/config/public-key", { auth: false }).then((r) => r.publicKey);
}

export function previewMensalidadePrice(serviceType) {
  return request(`/payments/mensalidade/preco?serviceType=${serviceType}`);
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

// iPhone: confirma no servidor uma assinatura comprada pela App Store
// (JWS da transação, assinado pela Apple — o servidor valida a assinatura).
export function confirmMensalidadeApple(serviceType, signedTransaction) {
  return request("/payments/mensalidade/apple", { method: "POST", body: { serviceType, signedTransaction } });
}
