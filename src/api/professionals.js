import { request } from "./client.js";

export function createProfessionalProfile(payload) {
  return request("/professionals", { method: "POST", body: payload });
}

export function getMyProfessionalProfile(serviceType) {
  return request(`/professionals/me?serviceType=${serviceType}`);
}

export function updateMyProfessionalProfile(serviceType, payload) {
  return request(`/professionals/me?serviceType=${serviceType}`, { method: "PATCH", body: payload });
}

export function getProfessionalById(id) {
  return request(`/professionals/${id}`, { auth: false });
}

export function searchProfessionals({ serviceType, q, bairro, minRating, priceMin, priceMax, page = 1, limit = 20 }) {
  const params = new URLSearchParams({ serviceType, page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (bairro && bairro !== "Todos") params.set("bairro", bairro);
  if (minRating) params.set("minRating", String(minRating));
  if (priceMin != null) params.set("priceMin", String(priceMin));
  if (priceMax != null) params.set("priceMax", String(priceMax));
  return request(`/professionals?${params.toString()}`);
}
