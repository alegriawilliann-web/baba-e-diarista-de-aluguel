import * as bookingsService from "./bookings.service";
import type { CreateBookingInput } from "./bookings.types";

export async function create(ctx: any) {
  ctx.set.status = 201;
  return bookingsService.createBooking(ctx.user.sub, ctx.body as CreateBookingInput);
}

export async function listMine(ctx: any) {
  return bookingsService.listMine(ctx.user.sub, ctx.query.as ?? "client");
}

export async function getById(ctx: any) {
  return bookingsService.getById(ctx.user.sub, ctx.params.id);
}

export const accept = (ctx: any) => bookingsService.accept(ctx.user.sub, ctx.params.id);
export const reject = (ctx: any) => bookingsService.reject(ctx.user.sub, ctx.params.id);
export const cancel = (ctx: any) => bookingsService.cancel(ctx.user.sub, ctx.params.id);
export const checkin = (ctx: any) => bookingsService.checkin(ctx.user.sub, ctx.params.id);
export const checkout = (ctx: any) => bookingsService.checkout(ctx.user.sub, ctx.params.id);
export const complete = (ctx: any) => bookingsService.complete(ctx.user.sub, ctx.params.id);
