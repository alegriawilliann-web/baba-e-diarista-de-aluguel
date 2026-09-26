import { request } from "./client.js";

export function grantClientRole({ serviceType, bairro }) {
  return request("/users/me/roles/client", {
    method: "POST",
    body: { serviceType, bairro },
  });
}
