import { readFileSync } from "node:fs";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import {
  SignedDataVerifier,
  Environment,
  type JWSTransactionDecodedPayload,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";
import { db } from "../../config/database";
import { env } from "../../config/env";
import { APPLE_MENSALIDADE_PRODUCTS } from "../../config/constants";
import { payments } from "./payments.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { ValidationError, NotFoundError } from "../../shared/errors";

type ServiceType = "baba" | "diarista";

// Certificado raiz público da Apple (Apple Root CA - G3), baixado de
// apple.com/certificateauthority. Toda compra e notificação da App Store vem
// assinada por uma cadeia que termina nele — é o que impede alguém de forjar
// uma "compra aprovada" mandando um JSON qualquer pro servidor.
const ROOT_CERTS = [readFileSync(join(import.meta.dir, "../../shared/apple/AppleRootCA-G3.cer"))];

// O app publicado gera compras de Produção, mas o revisor da Apple e o
// TestFlight compram em Sandbox — então a mesma API precisa aceitar os dois.
// Produção só é verificável com o Apple ID numérico do app configurado.
function verificadores(): SignedDataVerifier[] {
  const lista: SignedDataVerifier[] = [];
  if (env.APPLE_APP_APPLE_ID) {
    lista.push(new SignedDataVerifier(ROOT_CERTS, true, Environment.PRODUCTION, env.APPLE_BUNDLE_ID, env.APPLE_APP_APPLE_ID));
  }
  lista.push(new SignedDataVerifier(ROOT_CERTS, true, Environment.SANDBOX, env.APPLE_BUNDLE_ID));
  return lista;
}

async function verificarComQualquerAmbiente<T>(fn: (v: SignedDataVerifier) => Promise<T>): Promise<T> {
  let ultimoErro: unknown;
  for (const v of verificadores()) {
    try {
      return await fn(v);
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw ultimoErro;
}

function serviceTypeDoProduto(productId: string | undefined): ServiceType | null {
  for (const [tipo, id] of Object.entries(APPLE_MENSALIDADE_PRODUCTS)) {
    if (id === productId) return tipo as ServiceType;
  }
  return null;
}

/**
 * Aplica uma transação já verificada: registra o pagamento (idempotente por
 * transactionId — a mesma compra pode chegar pelo app E pela notificação) e
 * libera o perfil até o vencimento informado pela própria Apple. Nunca
 * encurta um vencimento mais longo que já exista (ex: renovação processada
 * antes de uma notificação atrasada da compra anterior).
 */
async function aplicarTransacao(tx: JWSTransactionDecodedPayload, userIdEsperado?: string) {
  const serviceType = serviceTypeDoProduto(tx.productId);
  if (!serviceType) throw new ValidationError("Produto da App Store desconhecido");

  // appAccountToken = id do usuário, enviado pelo app no momento da compra —
  // é o que liga a assinatura da Apple a uma conta nossa.
  const userId = tx.appAccountToken;
  if (!userId) throw new ValidationError("Compra sem identificação da conta");
  if (userIdEsperado && userId !== userIdEsperado) throw new ValidationError("Essa compra pertence a outra conta");

  const profile = await db.query.professionalProfiles.findFirst({
    where: and(eq(professionalProfiles.userId, userId), eq(professionalProfiles.serviceType, serviceType)),
  });
  if (!profile) throw new NotFoundError("Perfil profissional não encontrado para essa assinatura");

  const revogada = !!tx.revocationDate;
  const expiraEm = tx.expiresDate ? new Date(tx.expiresDate) : null;

  if (tx.transactionId) {
    await db
      .insert(payments)
      .values({
        userId,
        provider: "apple",
        providerPaymentId: `apple:${tx.transactionId}`,
        purpose: "mensalidade",
        referenceId: profile.id,
        method: "apple_iap",
        currency: tx.currency ?? "BRL",
        // price vem em milésimos da moeda (ex: 29900 = R$ 29,90)
        amountCents: tx.price != null ? Math.round(tx.price / 10) : 0,
        status: revogada ? "reembolsado" : "aprovado",
        description: "Mensalidade da plataforma (App Store)",
        externalReference: tx.originalTransactionId ?? null,
      })
      .onConflictDoUpdate({
        target: payments.providerPaymentId,
        set: { status: revogada ? "reembolsado" : "aprovado", updatedAt: new Date() },
      });
  }

  if (revogada) {
    await db
      .update(professionalProfiles)
      .set({ statusPagamento: "vencida", subscriptionExpiresAt: new Date(tx.revocationDate!), updatedAt: new Date() })
      .where(eq(professionalProfiles.id, profile.id));
    return { serviceType, statusPagamento: "vencida" as const, subscriptionExpiresAt: new Date(tx.revocationDate!) };
  }

  if (!expiraEm) throw new ValidationError("Assinatura sem data de vencimento");
  const atual = profile.subscriptionExpiresAt ? new Date(profile.subscriptionExpiresAt) : null;
  const novoVencimento = atual && atual > expiraEm ? atual : expiraEm;
  const ativa = novoVencimento.getTime() > Date.now();

  await db
    .update(professionalProfiles)
    .set({
      statusPagamento: ativa ? "liberado" : profile.statusPagamento,
      subscriptionExpiresAt: novoVencimento,
      formaPagamento: "apple_iap",
      updatedAt: new Date(),
    })
    .where(eq(professionalProfiles.id, profile.id));

  return { serviceType, statusPagamento: ativa ? ("liberado" as const) : profile.statusPagamento, subscriptionExpiresAt: novoVencimento };
}

/** Chamado pelo app logo depois da compra (ou do "Restaurar compras"). */
export async function confirmarAssinaturaApple(userId: string, serviceType: ServiceType, signedTransaction: string) {
  let tx: JWSTransactionDecodedPayload;
  try {
    tx = await verificarComQualquerAmbiente((v) => v.verifyAndDecodeTransaction(signedTransaction));
  } catch {
    throw new ValidationError("Não foi possível confirmar a compra com a Apple");
  }
  if (serviceTypeDoProduto(tx.productId) !== serviceType) throw new ValidationError("Essa assinatura é de outro tipo de perfil");
  return aplicarTransacao(tx, userId);
}

// Tipos que trazem uma transação válida a aplicar (compra, renovação,
// recuperação de cobrança, reembolso/revogação). Os demais (ex: aviso de que
// a renovação automática foi desligada) não mudam o acesso de imediato — o
// vencimento já registrado é o que vale.
const NOTIFICACOES_COM_TRANSACAO = new Set([
  "SUBSCRIBED",
  "DID_RENEW",
  "DID_RECOVER",
  "OFFER_REDEEMED",
  "REFUND",
  "REVOKE",
  "EXPIRED",
  "GRACE_PERIOD_EXPIRED",
]);

/** App Store Server Notifications V2 — a Apple chama a cada renovação etc. */
export async function processarNotificacaoApple(signedPayload: string) {
  let notificacao: ResponseBodyV2DecodedPayload;
  try {
    notificacao = await verificarComQualquerAmbiente((v) => v.verifyAndDecodeNotification(signedPayload));
  } catch {
    throw new ValidationError("Notificação da Apple inválida");
  }

  const tipo = notificacao.notificationType as string | undefined;
  const signedTx = notificacao.data?.signedTransactionInfo;
  if (!tipo || !signedTx || !NOTIFICACOES_COM_TRANSACAO.has(tipo)) return { ignorada: true };

  const tx = await verificarComQualquerAmbiente((v) => v.verifyAndDecodeTransaction(signedTx));
  try {
    await aplicarTransacao(tx);
  } catch (e) {
    // Conta/perfil apagado depois da compra: não há o que liberar, e
    // responder erro faria a Apple reenviar a mesma notificação por dias.
    if (e instanceof NotFoundError) return { ignorada: true };
    throw e;
  }
  return { ok: true };
}
