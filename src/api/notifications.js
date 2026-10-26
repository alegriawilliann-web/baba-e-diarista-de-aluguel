import { request } from "./client.js";

export function listNotifications() {
  return request("/notifications");
}

export function markAllNotificationsRead() {
  return request("/notifications/read-all", { method: "PATCH" });
}

export function markNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}
