import { Elysia } from "elysia";
import { authPlugin } from "../../shared/middleware/auth.middleware";
import * as messagesController from "./messages.controller";
import { createConversationBody, sendMessageBody } from "./messages.schema";

// Sem WebSocket por enquanto — polling simples. Elysia suporta WS nativo
// quando fizer sentido evoluir isso (fast-follow, não bloqueia o resto da API).
export const messagesRoutes = new Elysia({ prefix: "/conversations", tags: ["messages"] })
  .use(authPlugin)
  .get("/", messagesController.listMine, { role: [] })
  .post("/", messagesController.create, { body: createConversationBody, role: [] })
  .get("/:id/messages", messagesController.listMessages, { role: [] })
  .post("/:id/messages", messagesController.sendMessage, { body: sendMessageBody, role: [] });
