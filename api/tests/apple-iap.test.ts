import { describe, it, expect } from "bun:test";
import { confirmarAssinaturaApple, processarNotificacaoApple } from "../src/modules/payments/apple.service";
import { ValidationError } from "../src/shared/errors";

// Monta um JWS com cara de transação da Apple, mas sem a assinatura dela —
// exatamente o que alguém tentaria mandar pra liberar o perfil de graça.
function jwsFalso(payload: Record<string, unknown>) {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  return `${b64({ alg: "ES256", x5c: ["AAAA", "BBBB", "CCCC"] })}.${b64(payload)}.${Buffer.from("assinatura-falsa").toString("base64url")}`;
}

const transacaoForjada = {
  transactionId: "1000000000000001",
  originalTransactionId: "1000000000000001",
  bundleId: "com.babadealuguel.app",
  productId: "com.babadealuguel.app.mensalidade.baba",
  appAccountToken: "00000000-0000-4000-8000-000000000000",
  expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
  environment: "Production",
};

describe("assinatura App Store", () => {
  it("recusa transação que não foi assinada pela Apple", async () => {
    const promessa = confirmarAssinaturaApple(transacaoForjada.appAccountToken, "baba", jwsFalso(transacaoForjada));
    await expect(promessa).rejects.toBeInstanceOf(ValidationError);
  });

  it("recusa texto que nem é um JWS", async () => {
    await expect(confirmarAssinaturaApple(transacaoForjada.appAccountToken, "baba", "isso-nao-e-um-jws")).rejects.toBeInstanceOf(ValidationError);
  });

  it("recusa notificação de servidor forjada", async () => {
    const notificacao = jwsFalso({ notificationType: "DID_RENEW", data: { signedTransactionInfo: jwsFalso(transacaoForjada) } });
    await expect(processarNotificacaoApple(notificacao)).rejects.toBeInstanceOf(ValidationError);
  });
});
