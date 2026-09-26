import { request, setTokens, clearTokens, getRefreshToken } from "./client.js";

export async function register({ email, password, name, phone, countryCode }) {
  const dados = await request("/auth/register", {
    method: "POST",
    auth: false,
    body: { email, password, name, phone, countryCode },
  });
  setTokens(dados);
  return dados;
}

export async function login({ email, password }) {
  const dados = await request("/auth/login", {
    method: "POST",
    auth: false,
    body: { email, password },
  });
  setTokens(dados);
  return dados;
}

/** Renova a sessão explicitamente (usado depois de conceder uma role nova,
 * pra o token passar a incluir essa role sem esperar expirar sozinho). */
export async function refresh() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Sem sessão para renovar");
  const dados = await request("/auth/refresh", {
    method: "POST",
    auth: false,
    body: { refreshToken },
  });
  setTokens(dados);
  return dados;
}

export async function logout() {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await request("/auth/logout", { method: "POST", auth: false, body: { refreshToken } });
    }
  } finally {
    clearTokens();
  }
}

export function me() {
  return request("/auth/me");
}

export function resendVerification() {
  return request("/auth/resend-verification", { method: "POST" });
}

export function forgotPassword(email) {
  return request("/auth/forgot-password", { method: "POST", auth: false, body: { email } });
}

export function resetPassword({ email, code, newPassword }) {
  return request("/auth/reset-password", { method: "POST", auth: false, body: { email, code, newPassword } });
}
