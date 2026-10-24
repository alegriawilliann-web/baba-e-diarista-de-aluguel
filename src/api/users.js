import { request } from "./client.js";

export function grantClientRole({ serviceType, bairro, cidade, uf, quantidadeFilhos }) {
  return request("/users/me/roles/client", {
    method: "POST",
    body: { serviceType, bairro, cidade, uf, quantidadeFilhos },
  });
}

export function deleteMyAccount() {
  return request("/users/me", { method: "DELETE" });
}
