import * as paymentsService from "./payments.service";

export async function publicKey() {
  return { publicKey: await paymentsService.getPublicKey() };
}

export async function createMensalidadePix(ctx: any) {
  const { serviceType } = ctx.body as { serviceType: "baba" | "diarista" };
  return paymentsService.createMensalidadePix(ctx.user.sub, serviceType);
}

export async function createMensalidadeCard(ctx: any) {
  const { serviceType, ...input } = ctx.body as { serviceType: "baba" | "diarista"; token: string; parcelas?: number; issuerId?: string; paymentMethodId: string };
  return paymentsService.createMensalidadeCard(ctx.user.sub, serviceType, input);
}

export async function getStatus(ctx: any) {
  return paymentsService.getPaymentStatus(ctx.user.sub, ctx.params.id);
}

export async function webhook(ctx: any) {
  await paymentsService.handleMercadoPagoWebhook(ctx.query, ctx.body ?? {});
  return { ok: true };
}

export async function bookingPaymentStub(ctx: any) {
  ctx.set.status = 501;
  return { error: { code: "NOT_IMPLEMENTED", message: "Pagamento de reserva ainda não implementado — reaproveita o fluxo de mensalidade quando for construído." } };
}
