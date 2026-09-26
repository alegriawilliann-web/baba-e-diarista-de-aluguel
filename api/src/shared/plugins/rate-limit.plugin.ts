import { Elysia } from "elysia";
import { TooManyRequestsError } from "../errors";

// Limitador em memória, por processo — suficiente porque a API roda numa
// única instância (Render free/starter, sem múltiplas réplicas). Se algum
// dia escalar horizontalmente, isso precisa virar um contador compartilhado
// (Redis) em vez de um Map local.
const buckets = new Map<string, { count: number; resetAt: number }>();

// Evita crescimento infinito do Map em produção de longa duração — limpa
// entradas expiradas periodicamente.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Rede de segurança geral — aplicada a toda a API, bem mais folgada que os
 * limites específicos de cada rota sensível. Serve só pra segurar scraping
 * ou abuso genérico que não é coberto por um limite mais apertado. */
export function globalRateLimit(limit: number, windowMs: number) {
  return new Elysia({ name: "global-rate-limit" }).onBeforeHandle({ as: "global" }, ({ request }) => {
    const key = `__global__:${clientIp(request)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    bucket.count += 1;
    if (bucket.count > limit) throw new TooManyRequestsError();
  });
}

/** Macro `rateLimit: { scope, limit, windowMs }` usável em qualquer rota,
 * igual o macro `role` — pensado pra login, cadastro, recuperação de senha
 * e webhooks, onde força bruta ou spam custam dinheiro (e-mail) ou risco
 * (tentativas de senha). */
export const rateLimitPlugin = new Elysia({ name: "rate-limit-plugin" }).macro({
  rateLimit(opts: { scope: string; limit: number; windowMs: number }) {
    return {
      beforeHandle({ request }: { request: Request }) {
        const key = `${opts.scope}:${clientIp(request)}`;
        const now = Date.now();
        const bucket = buckets.get(key);

        if (!bucket || bucket.resetAt < now) {
          buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
          return;
        }

        bucket.count += 1;
        if (bucket.count > opts.limit) throw new TooManyRequestsError();
      },
    };
  },
});
