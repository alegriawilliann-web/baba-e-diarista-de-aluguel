import { useCallback, useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import * as authApi from "../api/auth.js";
import { setTokens, setOnSessionExpired } from "../api/client.js";

const KEYS = { accessToken: "auth.accessToken", refreshToken: "auth.refreshToken", user: "auth.user" };

async function persist(tokens, userObj) {
  await Preferences.set({ key: KEYS.accessToken, value: tokens.accessToken });
  await Preferences.set({ key: KEYS.refreshToken, value: tokens.refreshToken });
  await Preferences.set({ key: KEYS.user, value: JSON.stringify(userObj) });
}

async function clearPersisted() {
  await Preferences.remove({ key: KEYS.accessToken });
  await Preferences.remove({ key: KEYS.refreshToken });
  await Preferences.remove({ key: KEYS.user });
}

/**
 * Sessão de autenticação única pro app inteiro (as duas verticais, babá e
 * diarista, compartilham a mesma conta/roles — não são sessões separadas).
 * status: "hydrating" (checando se já tinha sessão salva) | "authenticated" | "anonymous"
 */
export function useAuth() {
  const [status, setStatus] = useState("hydrating");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelado = false;

    setOnSessionExpired(async () => {
      await clearPersisted();
      if (!cancelado) {
        setUser(null);
        setStatus("anonymous");
      }
    });

    (async () => {
      const stored = await Preferences.get({ key: KEYS.refreshToken });
      if (!stored.value) {
        if (!cancelado) setStatus("anonymous");
        return;
      }
      setTokens({ refreshToken: stored.value });
      try {
        const renovado = await authApi.refresh();
        const perfil = await authApi.me();
        await persist(renovado, perfil);
        if (!cancelado) {
          setUser(perfil);
          setStatus("authenticated");
        }
      } catch {
        await clearPersisted();
        if (!cancelado) setStatus("anonymous");
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const dados = await authApi.login({ email, password });
    await persist(dados, dados.user);
    setUser(dados.user);
    setStatus("authenticated");
    return dados.user;
  }, []);

  const register = useCallback(async ({ email, password, name, phone }) => {
    const dados = await authApi.register({ email, password, name, phone });
    await persist(dados, dados.user);
    setUser(dados.user);
    setStatus("authenticated");
    return dados.user;
  }, []);

  /** Chamar depois de qualquer ação que conceda uma role nova (ela só passa
   * a valer nas próximas chamadas depois de renovar o token). */
  const refreshRoles = useCallback(async () => {
    const dados = await authApi.refresh();
    const perfilAtualizado = await authApi.me();
    await persist(dados, perfilAtualizado);
    setUser(perfilAtualizado);
    return perfilAtualizado;
  }, []);

  /** Busca o perfil de novo sem mexer no token — usado pra checar campos que
   * mudam sem precisar de uma role nova, como emailVerified. */
  const refreshMe = useCallback(async () => {
    const perfilAtualizado = await authApi.me();
    setUser(perfilAtualizado);
    return perfilAtualizado;
  }, []);

  const resendVerification = useCallback(() => authApi.resendVerification(), []);

  const logout = useCallback(async () => {
    await authApi.logout();
    await clearPersisted();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return { status, user, roles: user?.roles ?? [], login, register, logout, refreshRoles, refreshMe, resendVerification };
}
