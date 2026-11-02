import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../../config/env";
import { tokensForUser, deleteTokens } from "../../modules/push/push.service";

let app: App | null | undefined;

// Lazy + memoizado: só inicializa na primeira notificação real, e nunca
// de novo depois (initializeApp não pode ser chamado duas vezes pro mesmo
// app). Retorna null quando a credencial não está configurada (ex:
// ambiente de dev local) — nesse caso o push simplesmente não é enviado,
// sem quebrar o resto da notificação.
function getApp(): App | null {
  if (app !== undefined) return app;
  if (!env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    app = null;
    return app;
  }
  const credentials = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  app = getApps()[0] ?? initializeApp({ credential: cert(credentials) });
  return app;
}

const CODIGOS_TOKEN_INVALIDO = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"];

export async function sendPush(userId: string, { title, body, data = {} }: { title: string; body: string; data?: Record<string, string> }) {
  const firebaseApp = getApp();
  if (!firebaseApp) return;

  const tokens = await tokensForUser(userId);
  if (tokens.length === 0) return;

  const resposta = await getMessaging(firebaseApp).sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    // Sem channelId: usa o canal padrão que o próprio FCM cria sozinho no
    // Android. Um channelId customizado só funciona se esse canal já tiver
    // sido criado no celular (nunca foi, nesse app) — com um nome que não
    // existe, a notificação chega mas não aparece, silenciosamente.
    android: { priority: "high", notification: { sound: "default" } },
  });

  const tokensInvalidos = resposta.responses
    .map((r, i: number) => (!r.success && CODIGOS_TOKEN_INVALIDO.includes(r.error?.code ?? "") ? tokens[i] : null))
    .filter((t): t is string => !!t);
  if (tokensInvalidos.length > 0) await deleteTokens(tokensInvalidos);
}
