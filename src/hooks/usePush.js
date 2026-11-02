import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { registerPushToken, unregisterPushToken } from "../api/push.js";

/**
 * Liga push notification de verdade (aparece mesmo com o app fechado) só
 * no celular (nunca na build web) e só depois da sessão confirmada —
 * registra o token no servidor e, ao tocar numa notificação do sistema,
 * chama `onAbrirNotificacao` com o mesmo formato que a tela de
 * notificações dentro do app já usa, pra cair no mesmo roteamento.
 */
export function usePush(ativo, onAbrirNotificacao) {
  const tokenRef = useRef(null);
  const onAbrirRef = useRef(onAbrirNotificacao);
  onAbrirRef.current = onAbrirNotificacao;

  useEffect(() => {
    if (!ativo || !Capacitor.isNativePlatform()) return;
    let cancelado = false;
    const listeners = [];

    (async () => {
      try {
        let { receive: status } = await PushNotifications.checkPermissions();
        if (status === "prompt" || status === "prompt-with-rationale") {
          ({ receive: status } = await PushNotifications.requestPermissions());
        }
        if (status !== "granted" || cancelado) return;

        listeners.push(
          await PushNotifications.addListener("registration", (token) => {
            tokenRef.current = token.value;
            registerPushToken(token.value, "android").catch(() => {});
          })
        );
        listeners.push(await PushNotifications.addListener("registrationError", () => {}));
        listeners.push(
          await PushNotifications.addListener("pushNotificationActionPerformed", (acao) => {
            const dados = acao.notification?.data || {};
            onAbrirRef.current?.({ id: dados.id, lida: false, tipo: dados.tipo, link: dados.link });
          })
        );

        await PushNotifications.register();
      } catch {
        // celular sem Google Play Services, ou permissão recusada — o app
        // continua funcionando normalmente, só sem push
      }
    })();

    return () => {
      cancelado = true;
      listeners.forEach((l) => l.remove());
    };
  }, [ativo]);

  useEffect(() => {
    if (ativo || !tokenRef.current) return;
    unregisterPushToken(tokenRef.current).catch(() => {});
    tokenRef.current = null;
  }, [ativo]);
}
