import { request } from "./client.js";

export function grantClientRole({ serviceType, bairro, quantidadeFilhos }) {
  return request("/users/me/roles/client", {
    method: "POST",
    body: { serviceType, bairro, quantidadeFilhos },
  });
}

export function deleteMyAccount() {
  return request("/users/me", { method: "DELETE" });
}
