import { eq } from "drizzle-orm";
import { db } from "../../config/database";
import { payments, paymentEvents } from "./payments.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { mercadoPagoProvider } from "./providers/mercadopago";
import { COUNTRY_DEFAULTS, DEFAULT_COUNTRY_CODE, MENSALIDADE_CENTS } from "../../config/constants";
import { addDays } from "../../shared/utils/dates";
import { env } from "../../config/env";
import { NotFoundError, ForbiddenError, ValidationError } from "../../shared/errors";
import type { PaymentProviderAdapter, StatusResult } from "./payments.types";
import type { PaymentMethod, PaymentStatus } from "../../config/constants";

function getProviderForCountry(countryCode: string = DEFAULT_COUNTRY_CODE): PaymentProviderAdapter {
  const config = COUNTRY_DEFAULTS[countryCode] ?? COUNTRY_DEFAULTS[DEFAULT_COUNTRY_CODE]!;
  // Only Mercado Pago exists today; a new country with a different gateway
  // just adds a branch here returning its own adapter — nothing else changes.
  if (config.paymentProviders[0] === "mercadopago") return mercadoPagoProvider;
  throw new Error(`Nenhum gateway de pagamento configurado para o país ${countryCode}`);
}

function mapProviderStatus(status: string): PaymentStatus {
  switch (status) {
    case "approved":
      return "aprovado";
    case "rejected":
      return "rejeitado";
    case "cancelled":
      return "cancelado";
    case "refunded":
    case "charged_back":
      return "reembolsado";
    case "pending":
    case "in_process":
    case "in_mediation":
    case "authorized":
    default:
      return "processando";
  }
}

async function applyApprovedSideEffects(payment: typeof payments.$inferSelect) {
  if (payment.purpose === "mensalidade" && payment.referenceId) {
    await db
      .update(professionalProfiles)
      .set({ statusPagamento: "liberado", subscriptionExpiresAt: addDays(new Date(), 30) })
      .where(eq(professionalProfiles.id, payment.referenceId));
  }

  if (payment.purpose === "boost" && payment.referenceId) {
    // Import tardio pra evitar qualquer risco de ciclo de import entre os
    // dois módulos — boosts.model já depende de payments.model.
    const { boostPurchases } = await import("../boosts/boosts.model");
    const purchase = await db.query.boostPurchases.findFirst({ where: eq(boostPurchases.id, payment.referenceId) });
    if (purchase) {
      const startedAt = new Date();
      await db
        .update(boostPurchases)
        .set({ status: "ativo", startedAt, expiresAt: addDays(startedAt, purchase.duracaoDias) })
        .where(eq(boostPurchases.id, purchase.id));
    }
  }
}

// Resolve o professional_profiles do PRÓPRIO usuário logado a partir do
// serviceType informado — nunca aceita um professionalId vindo do cliente,
// pra ninguém conseguir pagar a mensalidade de outra pessoa.
async function resolveOwnProfessional(userId: string, serviceType: "baba" | "diarista") {
  const profile = await db.query.professionalProfiles.findFirst({
    where: (p, { eq: eqOp, and: andOp }) => andOp(eqOp(p.userId, userId), eqOp(p.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Você ainda não tem um perfil profissional desse tipo");
  return profile;
}

export async function createMensalidadePix(userId: string, serviceType: "baba" | "diarista") {
  const profile = await resolveOwnProfessional(userId, serviceType);
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const email = user!.email;
  const nome = user!.name;

  const [payment] = await db
    .insert(payments)
    .values({
      userId,
      purpose: "mensalidade",
      referenceId: profile.id,
      method: "pix",
      amountCents: MENSALIDADE_CENTS,
      description: "Mensalidade da plataforma",
      payerEmail: email,
      payerName: nome,
    })
    .returning();

  const provider = getProviderForCountry();
  const result = await provider.createPixPayment({
    valorCentavos: MENSALIDADE_CENTS,
    descricao: "Mensalidade da plataforma",
    email,
    nome,
    referenciaExterna: payment!.id,
  });

  await db
    .update(payments)
    .set({ providerPaymentId: result.providerPaymentId, status: mapProviderStatus(result.status), updatedAt: new Date() })
    .where(eq(payments.id, payment!.id));

  return { id: payment!.id, status: mapProviderStatus(result.status), qrCodeBase64: result.qrCodeBase64, qrCodeCopiaECola: result.qrCodeCopiaECola, expiraEm: result.expiraEm };
}

export async function createMensalidadeCard(
  userId: string,
  serviceType: "baba" | "diarista",
  input: { token: string; parcelas?: number; issuerId?: string; paymentMethodId: string }
) {
  const profile = await resolveOwnProfessional(userId, serviceType);
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  const email = user!.email;

  const [payment] = await db
    .insert(payments)
    .values({
      userId,
      purpose: "mensalidade",
      referenceId: profile.id,
      method: "credito",
      amountCents: MENSALIDADE_CENTS,
      description: "Mensalidade da plataforma",
      payerEmail: email,
    })
    .returning();

  const provider = getProviderForCountry();
  const result = await provider.createCardPayment({
    valorCentavos: MENSALIDADE_CENTS,
    descricao: "Mensalidade da plataforma",
    email,
    token: input.token,
    parcelas: input.parcelas,
    issuerId: input.issuerId,
    paymentMethodId: input.paymentMethodId,
    referenciaExterna: payment!.id,
  });

  const status = mapProviderStatus(result.status);
  const [updated] = await db
    .update(payments)
    .set({ providerPaymentId: result.providerPaymentId, status, updatedAt: new Date() })
    .where(eq(payments.id, payment!.id))
    .returning();

  if (status === "aprovado") await applyApprovedSideEffects(updated!);

  return { id: payment!.id, status, statusDetail: result.statusDetail };
}

export async function getPaymentStatus(userId: string, paymentId: string) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) throw new NotFoundError("Pagamento não encontrado");
  if (payment.userId !== userId) throw new ForbiddenError();

  if (payment.status === "pendente" || payment.status === "processando") {
    if (payment.providerPaymentId) {
      const provider = getProviderForCountry();
      const fresh = await provider.getPayment(payment.providerPaymentId);
      const status = mapProviderStatus(fresh.status);
      if (status !== payment.status) {
        const [updated] = await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, payment.id)).returning();
        if (status === "aprovado") await applyApprovedSideEffects(updated!);
        return { id: payment.id, status, method: payment.method, amountCents: payment.amountCents };
      }
    }
  }

  return { id: payment.id, status: payment.status, method: payment.method, amountCents: payment.amountCents };
}

export async function handleMercadoPagoWebhook(query: Record<string, string>, body: Record<string, unknown>) {
  const type = query.type ?? (body?.type as string | undefined);
  const providerPaymentId = query["data.id"] ?? ((body?.data as Record<string, unknown>)?.id as string | undefined);
  if (type !== "payment" || !providerPaymentId) return;

  const provider = getProviderForCountry();
  const fresh: StatusResult = await provider.getPayment(providerPaymentId);
  const status = mapProviderStatus(fresh.status);

  const payment = await db.query.payments.findFirst({ where: eq(payments.providerPaymentId, String(providerPaymentId)) });
  if (!payment) return;

  await db.insert(paymentEvents).values({ paymentId: payment.id, eventType: type, payload: { ...body, resolvedStatus: fresh.status } });

  const [updated] = await db.update(payments).set({ status, updatedAt: new Date() }).where(eq(payments.id, payment.id)).returning();
  if (status === "aprovado") await applyApprovedSideEffects(updated!);
}

export async function getPublicKey() {
  if (!env.MP_PUBLIC_KEY) throw new ValidationError("MP_PUBLIC_KEY não configurada no servidor");
  return env.MP_PUBLIC_KEY;
}

// Usado pelo módulo boosts (checkpoint seguinte) para não duplicar a lógica
// de criação de pagamento — mesma tabela `payments`, purpose diferente.
export async function createGenericPixPayment(userId: string, opts: { purpose: "boost" | "booking"; referenceId: string; amountCents: number; description: string; email: string; nome?: string; method: PaymentMethod }) {
  const [payment] = await db
    .insert(payments)
    .values({
      userId,
      purpose: opts.purpose,
      referenceId: opts.referenceId,
      method: opts.method,
      amountCents: opts.amountCents,
      description: opts.description,
      payerEmail: opts.email,
      payerName: opts.nome,
    })
    .returning();

  const provider = getProviderForCountry();
  const result = await provider.createPixPayment({
    valorCentavos: opts.amountCents,
    descricao: opts.description,
    email: opts.email,
    nome: opts.nome,
    referenciaExterna: payment!.id,
  });

  await db
    .update(payments)
    .set({ providerPaymentId: result.providerPaymentId, status: mapProviderStatus(result.status), updatedAt: new Date() })
    .where(eq(payments.id, payment!.id));

  return { id: payment!.id, status: mapProviderStatus(result.status), qrCodeBase64: result.qrCodeBase64, qrCodeCopiaECola: result.qrCodeCopiaECola };
}
