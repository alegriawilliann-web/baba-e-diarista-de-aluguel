export interface CreateConversationInput {
  participantId: string;
  bookingId?: string;
}

export interface SendMessageInput {
  texto: string;
}
