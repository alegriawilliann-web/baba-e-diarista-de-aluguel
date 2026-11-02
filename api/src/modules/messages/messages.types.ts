export interface CreateConversationInput {
  participantId?: string;
  professionalId?: string;
  bookingId?: string;
}

export interface SendMessageInput {
  texto: string;
}
