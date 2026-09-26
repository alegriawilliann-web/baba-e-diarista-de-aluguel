export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/** Combines a "YYYY-MM-DD" date and "HH:MM" time into a single UTC Date. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00.000Z`);
}

export function isExpired(date: Date | string | null | undefined): boolean {
  if (!date) return true;
  return new Date(date).getTime() < Date.now();
}
