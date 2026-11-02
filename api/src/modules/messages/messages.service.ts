import { eq, and, inArray } from "drizzle-orm";
import { db } from "../../config/database";
import { conversations, conversationParticipants, messages } from "./messages.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { users } from "../users/users.model";
import { ForbiddenError, NotFoundError, ValidationError } from "../../shared/errors";
import { notify } from "../notifications/notifications.service";
import type { CreateConversationInput } from "./messages.types";

async function assertParticipant(userId: string, conversationId: string) {
  const row = await db.query.conversationParticipants.findFirst({
    where: and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)),
  });
  if (!row) throw new ForbiddenError();
}

async function findExistingConversation(userId: string, otherUserId: string) {
  const minhas = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.userId, userId) });
  if (minhas.length === 0) return null;
  const dele = await db.query.conversationParticipants.findMany({
    where: and(eq(conversationParticipants.userId, otherUserId), inArray(conversationParticipants.conversationId, minhas.map((m) => m.conversationId))),
  });
  if (!dele[0]) return null;
  return db.query.conversations.findFirst({ where: eq(conversations.id, dele[0].conversationId) });
}

export async function listMine(userId: string) {
  const memberships = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.userId, userId) });
  const results = [];
  for (const m of memberships) {
    const conversation = await db.query.conversations.findFirst({ where: eq(conversations.id, m.conversationId) });
    const participants = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.conversationId, m.conversationId) });
    const outroId = participants.map((p) => p.userId).find((id) => id !== userId);
    const outro = outroId ? await db.query.users.findFirst({ where: eq(users.id, outroId) }) : null;
    const [ultimaMensagem] = await db.query.messages.findMany({
      where: eq(messages.conversationId, m.conversationId), orderBy: (mm, { desc }) => [desc(mm.criadoEm)], limit: 1,
    });
    results.push({
      id: conversation!.id,
      bookingId: conversation!.bookingId,
      outro: outro ? { id: outro.id, nome: outro.name, fotoUrl: outro.photoUrl } : null,
      ultimaMensagem: ultimaMensagem ? { texto: ultimaMensagem.texto, criadoEm: ultimaMensagem.criadoEm, deMim: ultimaMensagem.senderId === userId } : null,
    });
  }
  results.sort((a, b) => {
    const da = a.ultimaMensagem?.criadoEm ?? 0;
    const db_ = b.ultimaMensagem?.criadoEm ?? 0;
    return new Date(db_).getTime() - new Date(da).getTime();
  });
  return results;
}

export async function createConversation(userId: string, input: CreateConversationInput) {
  let participantId = input.participantId;
  if (!participantId && input.professionalId) {
    const profile = await db.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, input.professionalId) });
    if (!profile) throw new NotFoundError("Profissional não encontrado");
    participantId = profile.userId;
  }
  if (!participantId) throw new ValidationError("Informe participantId ou professionalId");
  if (participantId === userId) throw new ValidationError("Não é possível iniciar uma conversa com você mesmo");

  const existente = await findExistingConversation(userId, participantId);
  if (existente) return existente;

  const [conversation] = await db.insert(conversations).values({ bookingId: input.bookingId }).returning();
  await db.insert(conversationParticipants).values([
    { conversationId: conversation!.id, userId },
    { conversationId: conversation!.id, userId: participantId },
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

  const participantes = await db.query.conversationParticipants.findMany({ where: eq(conversationParticipants.conversationId, conversationId) });
  const destinatarioId = participantes.map((p) => p.userId).find((id) => id !== userId);
  if (destinatarioId) {
    await notify({ userId: destinatarioId, tipo: "nova_mensagem", texto: "Você recebeu uma nova mensagem", link: `/conversations/${conversationId}` });
  }

  return row;
}
