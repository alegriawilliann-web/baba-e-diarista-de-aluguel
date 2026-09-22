import { eq, and } from "drizzle-orm";
import { db } from "../../config/database";
import { conversations, conversationParticipants, messages } from "./messages.model";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import type { CreateConversationInput } from "./messages.types";

async function assertParticipant(userId: string, conversationId: string) {
  const row = await db.query.conversationParticipants.findFirst({
    where: and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)),
  });
  if (!row) throw new ForbiddenError();
}

export async function listMine(userId: string) {
  const memberships = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.userId, userId) });
  const results = [];
  for (const m of memberships) {
    const conversation = await db.query.conversations.findFirst({ where: eq(conversations.id, m.conversationId) });
    const participants = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.conversationId, m.conversationId) });
    results.push({ id: conversation!.id, bookingId: conversation!.bookingId, participantIds: participants.map((p) => p.userId) });
  }
  return results;
}

export async function createConversation(userId: string, input: CreateConversationInput) {
  // Simples: sempre cria uma nova conversa (achar uma já existente entre o
  // mesmo par de pessoas é uma otimização de fast-follow, não essencial pro v1).
  const [conversation] = await db.insert(conversations).values({ bookingId: input.bookingId }).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conversation!.id, userId },
    { conversationId: conversation!.id, userId: input.participantId },
  ]);
  return conversation;
}

export async function listMessages(userId: string, conversationId: string) {
  await assertParticipant(userId, conversationId);
  return db.query.messages.findMany({ where: eq(messages.conversationId, conversationId), orderBy: (m, { asc }) => [asc(m.criadoEm)] });
}

export async function sendMessage(userId: string, conversationId: string, texto: string) {
  await assertParticipant(userId, conversationId);
  const [row] = await db.insert(messages).values({ conversationId, senderId: userId, texto }).returning();
  return row;
}
