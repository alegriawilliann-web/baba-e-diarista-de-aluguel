import { request } from "./client.js";

export function getBoostPlans() {
  return request("/boosts/plans");
}

export function purchaseBoost({ planKey, durationDays, serviceType }) {
  return request("/boosts/purchase", { method: "POST", body: { planKey, durationDays, serviceType } });
}

export function getMyBoosts() {
  return request("/boosts/mine");
}
