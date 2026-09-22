import { eq, and, or, inArray } from "drizzle-orm";
import { db } from "../../config/database";
import { bookings } from "./bookings.model";
import { professionalProfiles } from "../professionals/professionals.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../../shared/errors";
import type { CreateBookingInput } from "./bookings.types";
import type { BookingStatus } from "../../config/constants";

function shape(row: typeof bookings.$inferSelect) {
  return {
    id: row.id,
    clientId: row.clientId,
    professionalId: row.professionalId,
    serviceType: row.serviceType,
    data: row.scheduledDate,
    horario: row.scheduledTime,
    servico: row.servico,
    valorCents: row.amountCents,
    formaPagamento: row.formaPagamento,
    status: row.status,
    checkin: row.checkinAt,
    checkout: row.checkoutAt,
  };
}

export async function createBooking(clientId: string, input: CreateBookingInput) {
  const professional = await db.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, input.professionalId) });
  if (!professional) throw new NotFoundError("Profissional não encontrado");
  if (professional.statusPagamento !== "liberado") throw new ConflictError("Esse profissional não está disponível para contratação no momento");

  const [row] = await db
    .insert(bookings)
    .values({
      clientId,
      professionalId: input.professionalId,
      serviceType: professional.serviceType,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      servico: input.servico,
      amountCents: input.amountCents,
      formaPagamento: input.formaPagamento,
    })
    .returning();

  return shape(row!);
}

async function myProfessionalProfileIds(userId: string) {
  const rows = await db.query.professionalProfiles.findMany({ where: eq(professionalProfiles.userId, userId) });
  return rows.map((r) => r.id);
}

export async function listMine(userId: string, as: "client" | "professional" = "client") {
  if (as === "professional") {
    const ids = await myProfessionalProfileIds(userId);
    if (ids.length === 0) return [];
    const rows = await db.query.bookings.findMany({ where: inArray(bookings.professionalId, ids), orderBy: (b, { desc }) => [desc(b.createdAt)] });
    return rows.map(shape);
  }
  const rows = await db.query.bookings.findMany({ where: eq(bookings.clientId, userId), orderBy: (b, { desc }) => [desc(b.createdAt)] });
  return rows.map(shape);
}

async function loadForParticipant(userId: string, bookingId: string) {
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) throw new NotFoundError("Contratação não encontrada");

  const isClient = booking.clientId === userId;
  const professional = await db.query.professionalProfiles.findFirst({ where: eq(professionalProfiles.id, booking.professionalId) });
  const isProfessional = professional?.userId === userId;

  if (!isClient && !isProfessional) throw new ForbiddenError();
  return { booking, isClient, isProfessional };
}

export async function getById(userId: string, bookingId: string) {
  const { booking } = await loadForParticipant(userId, bookingId);
  return shape(booking);
}

function assertStatus(current: BookingStatus, expected: BookingStatus[]) {
  if (!expected.includes(current)) {
    throw new ConflictError(`Não é possível fazer essa ação com a contratação no status "${current}"`);
  }
}

async function transition(bookingId: string, patch: Partial<typeof bookings.$inferInsert>) {
  const [row] = await db.update(bookings).set({ ...patch, updatedAt: new Date() }).where(eq(bookings.id, bookingId)).returning();
  return shape(row!);
}

export async function accept(userId: string, bookingId: string) {
  const { booking, isProfessional } = await loadForParticipant(userId, bookingId);
  if (!isProfessional) throw new ForbiddenError();
  assertStatus(booking.status, ["pendente"]);
  return transition(bookingId, { status: "agendado" });
}

export async function reject(userId: string, bookingId: string) {
  const { booking, isProfessional } = await loadForParticipant(userId, bookingId);
  if (!isProfessional) throw new ForbiddenError();
  assertStatus(booking.status, ["pendente"]);
  return transition(bookingId, { status: "recusado" });
}

export async function cancel(userId: string, bookingId: string) {
  const { booking } = await loadForParticipant(userId, bookingId);
  assertStatus(booking.status, ["pendente", "agendado"]);
  return transition(bookingId, { status: "cancelado" });
}

export async function checkin(userId: string, bookingId: string) {
  const { booking, isProfessional } = await loadForParticipant(userId, bookingId);
  if (!isProfessional) throw new ForbiddenError();
  assertStatus(booking.status, ["agendado"]);
  return transition(bookingId, { checkinAt: new Date() });
}

export async function checkout(userId: string, bookingId: string) {
  const { booking, isProfessional } = await loadForParticipant(userId, bookingId);
  if (!isProfessional) throw new ForbiddenError();
  assertStatus(booking.status, ["agendado"]);
  if (!booking.checkinAt) throw new ConflictError("Faça o check-in antes do check-out");
  return transition(bookingId, { checkoutAt: new Date() });
}

export async function complete(userId: string, bookingId: string) {
  const { booking, isClient } = await loadForParticipant(userId, bookingId);
  if (!isClient) throw new ForbiddenError();
  assertStatus(booking.status, ["agendado"]);
  if (!booking.checkoutAt) throw new ConflictError("O profissional ainda não fez o check-out");
  return transition(bookingId, { status: "concluido" });
}
