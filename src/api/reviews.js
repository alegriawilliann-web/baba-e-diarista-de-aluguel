import { request } from "./client.js";

export function createReview({ professionalId, bookingId, estrelas, comentario }) {
  return request("/reviews", {
    method: "POST",
    body: { professionalId, bookingId: bookingId || undefined, estrelas, comentario: comentario || undefined },
  });
}

export function listReviewsForProfessional(professionalId, { page = 1, limit = 20 } = {}) {
  return request(`/professionals/${professionalId}/reviews?page=${page}&limit=${limit}`, { auth: false });
}
