import { t } from "elysia";

export const createConversationBody = t.Object({
  participantId: t.String({ format: "uuid" }),
  bookingId: t.Optional(t.String({ format: "uuid" })),
});

export const sendMessageBody = t.Object({
  texto: t.String({ minLength: 1, maxLength: 2000 }),
});
