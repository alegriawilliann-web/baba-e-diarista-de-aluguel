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

export function listMyPortfolio() {
  return request("/professionals/me/portfolio");
}

export function addPortfolioPost(payload) {
  return request("/professionals/me/portfolio", { method: "POST", body: payload });
}

export function deletePortfolioPost(id) {
  return request(`/professionals/me/portfolio/${id}`, { method: "DELETE" });
}

export function reorderPortfolio(ids) {
  return request("/professionals/me/portfolio/reorder", { method: "PATCH", body: { ids } });
}

export function searchProfessionals({ serviceType, q, bairro, cidade, minRating, priceMin, priceMax, page = 1, limit = 20 }) {
  const params = new URLSearchParams({ serviceType, page: String(page), limit: String(limit) });
  if (q) params.set("q", q);
  if (bairro && bairro !== "Todos") params.set("bairro", bairro);
  if (cidade) params.set("cidade", cidade);
  if (minRating) params.set("minRating", String(minRating));
  if (priceMin != null) params.set("priceMin", String(priceMin));
  if (priceMax != null) params.set("priceMax", String(priceMax));
  return request(`/professionals?${params.toString()}`);
}
