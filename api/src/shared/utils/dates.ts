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
 * frente em meses de 31 dias, ou saltar dias em meses curtos: Date lida com
 * o "dia 31 não existe em fevereiro" caindo pro último dia do mês, que é o
 * comportamento esperado pra cobrança mensal). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
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
