import { request } from "./client.js";

export function createBooking(payload) {
  return request("/bookings", { method: "POST", body: payload });
}

export function listMyBookings(as = "client") {
  return request(`/bookings/mine?as=${as}`);
}

export function getBooking(id) {
  return request(`/bookings/${id}`);
}

export function acceptBooking(id) {
  return request(`/bookings/${id}/accept`, { method: "PATCH" });
}

export function rejectBooking(id) {
  return request(`/bookings/${id}/reject`, { method: "PATCH" });
}

export function cancelBooking(id) {
  return request(`/bookings/${id}/cancel`, { method: "PATCH" });
}

export function checkinBooking(id) {
  return request(`/bookings/${id}/checkin`, { method: "PATCH" });
}

export function checkoutBooking(id) {
  return request(`/bookings/${id}/checkout`, { method: "PATCH" });
}

export function completeBooking(id) {
  return request(`/bookings/${id}/complete`, { method: "PATCH" });
}
