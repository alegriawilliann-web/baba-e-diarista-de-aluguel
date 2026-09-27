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

/** Mesmo dia do mês seguinte (não "+30 dias" — evita o vencimento derivar pra
 * frente em meses de 31 dias). Usa métodos UTC de propósito: `setMonth`
 * sozinho não trava no último dia do mês de destino (ex: 31/jan vira 3/mar,
 * não 28/fev) — aqui, zera o dia antes de trocar o mês e só então aplica o
 * dia original, limitado ao tanto que o mês de destino realmente tem. */
export function addMonths(date: Date, months: number): Date {
  const day = date.getUTCDate();
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const daysInTargetMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, daysInTargetMonth));
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
