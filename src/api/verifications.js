import { request } from "./client.js";

export function submitVerification({ serviceType, documentType, documentRef }) {
  return request("/verifications", {
    method: "POST",
    body: { serviceType, documentType, documentRef },
  });
}

export function listMyVerifications(serviceType) {
  return request(`/verifications/mine?serviceType=${serviceType}`);
}

export function listVerificationQueue(status) {
  return request(`/verifications${status ? `?status=${status}` : ""}`);
}

export function reviewVerification(id, { status, notes }) {
  return request(`/verifications/${id}`, {
    method: "PATCH",
    body: { status, notes },
  });
}
