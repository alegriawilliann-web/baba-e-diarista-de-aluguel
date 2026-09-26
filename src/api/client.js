// Cliente HTTP compartilhado por todo `src/api/*.js`. Guarda os tokens em
// memória (módulo, não React state — precisa ser lido de dentro de chamadas
// fetch que não são componentes) e cuida sozinho de renovar a sessão quando
// o access token expira, repetindo a chamada original uma única vez.

const BASE_URL = (import.meta.env.VITE_API_URL || "https://baba-de-aluguel-api.onrender.com") + "/api";

let accessToken = null;
let refreshToken = null;
let onSessionExpired = () => {};

export function setTokens({ accessToken: a, refreshToken: r }) {
  accessToken = a ?? accessToken;
  refreshToken = r ?? refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

/** Chamado uma vez pelo useAuth() para saber quando forçar logout (refresh
 * também falhou — sessão realmente expirou). */
export function setOnSessionExpired(fn) {
  onSessionExpired = fn;
}

async function doRefresh() {
  if (!refreshToken) return false;
  const resp = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!resp.ok) return false;
  const dados = await resp.json();
  setTokens({ accessToken: dados.accessToken, refreshToken: dados.refreshToken });
  return true;
}

/**
 * @param {string} path - ex: "/auth/login"
 * @param {{method?, body?, auth?}} options - `auth:false` pula o header
 *   Authorization (rotas públicas); default é `true`.
 */
export async function request(path, { method = "GET", body, auth = true } = {}) {
  const doFetch = () => {
    const headers = { "Content-Type": "application/json" };
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let resp = await doFetch();

  if (resp.status === 401 && auth) {
    const renovou = await doRefresh();
    if (renovou) {
      resp = await doFetch();
    } else {
      clearTokens();
      onSessionExpired();
    }
  }

  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const mensagem = dados?.error?.message || dados?.error || "Erro de comunicação com o servidor";
    throw new Error(mensagem);
  }
  return dados;
}
