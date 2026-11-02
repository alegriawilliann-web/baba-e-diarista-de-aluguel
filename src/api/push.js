import { request } from "./client.js";

export function registerPushToken(token, platform = "android") {
  return request("/push/register", { method: "POST", body: { token, platform } });
}

export function unregisterPushToken(token) {
  return request("/push/unregister", { method: "POST", body: { token } });
}
