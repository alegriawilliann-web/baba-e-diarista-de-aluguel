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

export function updateClientProfile(dados) {
  return request("/users/me/client-profile", { method: "PATCH", body: dados });
}

export function listTrustedContacts() {
  return request("/users/me/trusted-contacts");
}

export function addTrustedContact(contato) {
  return request("/users/me/trusted-contacts", { method: "POST", body: contato });
}

export function updateTrustedContact(id, contato) {
  return request(`/users/me/trusted-contacts/${id}`, { method: "PATCH", body: contato });
}

export function deleteTrustedContact(id) {
  return request(`/users/me/trusted-contacts/${id}`, { method: "DELETE" });
}

export function searchUsers(q) {
  return request(`/users/search?q=${encodeURIComponent(q)}`);
}

export function shareProfile({ targetUserId, nome }) {
  return request("/users/share-profile", { method: "POST", body: { targetUserId, nome } });
}
