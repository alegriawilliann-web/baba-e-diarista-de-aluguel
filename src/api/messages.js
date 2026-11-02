import { request } from "./client.js";

export function listConversations() {
  return request("/conversations");
}

export function startConversation({ professionalId, participantId, bookingId } = {}) {
  return request("/conversations", { method: "POST", body: { professionalId, participantId, bookingId } });
}

export function listMessages(conversationId) {
  return request(`/conversations/${conversationId}/messages`);
}

export function sendMessage(conversationId, texto) {
  return request(`/conversations/${conversationId}/messages`, { method: "POST", body: { texto } });
}
