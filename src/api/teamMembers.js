import { request } from "./client.js";

export function submitTeamMember({ serviceType, nome, cpf, certidaoNegativaFoto }) {
  return request("/professionals/me/equipe", {
    method: "POST",
    body: { serviceType, nome, cpf, certidaoNegativaFoto: certidaoNegativaFoto || undefined },
  });
}

export function listMyTeamMembers(serviceType) {
  return request(`/professionals/me/equipe?serviceType=${serviceType}`);
}

export function deleteTeamMember(id, serviceType) {
  return request(`/professionals/me/equipe/${id}?serviceType=${serviceType}`, { method: "DELETE" });
}

export function listTeamMemberQueue(status) {
  return request(`/professionals/equipe/queue${status ? `?status=${status}` : ""}`);
}

export function reviewTeamMember(id, status) {
  return request(`/professionals/equipe/${id}`, { method: "PATCH", body: { status } });
}
