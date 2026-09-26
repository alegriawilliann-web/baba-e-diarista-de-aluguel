import { request } from "./client.js";

export function createReview({ bookingId, estrelas, comentario }) {
  return request("/reviews", {
    method: "POST",
    body: { bookingId, estrelas, comentario: comentario || undefined },
  });
}

export function listReviewsForProfessional(professionalId, { page = 1, limit = 20 } = {}) {
  return request(`/professionals/${professionalId}/reviews?page=${page}&limit=${limit}`, { auth: false });
}
