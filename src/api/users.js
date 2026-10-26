import { request } from "./client.js";

export function updateMe(dados) {
  return request("/users/me", { method: "PATCH", body: dados });
}

export function grantClientRole({ serviceType, bairro, cidade, uf, quantidadeFilhos }) {
  return request("/users/me/roles/client", {
    method: "POST",
    body: { serviceType, bairro, cidade, uf, quantidadeFilhos },
  });
}

export function deleteMyAccount() {
  return request("/users/me", { method: "DELETE" });
}

export function searchUsers(q) {
  return request(`/users/search?q=${encodeURIComponent(q)}`);
}

export function shareProfile({ targetUserId, nome }) {
  return request("/users/share-profile", { method: "POST", body: { targetUserId, nome } });
}
