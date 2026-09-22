import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

const BASE = "http://localhost";
const uniqueEmail = () => `teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`;

function req(path: string, init?: RequestInit) {
  return app.handle(new Request(`${BASE}${path}`, init));
}

function json(body: unknown, init: RequestInit = {}) {
  return {
    method: "POST",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(body),
  };
}

describe("auth", () => {
  it("registra um usuário novo e retorna tokens", async () => {
    const email = uniqueEmail();
    const res = await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana Teste" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.accessToken).toBeString();
    expect(body.refreshToken).toBeString();
    expect(body.user.email).toBe(email);
    expect(body.user.roles).toEqual([]);
  });

  it("recusa registrar o mesmo e-mail duas vezes", async () => {
    const email = uniqueEmail();
    await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana" }));
    const res = await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana" }));
    expect(res.status).toBe(409);
  });

  it("loga com credenciais corretas e recusa com senha errada", async () => {
    const email = uniqueEmail();
    await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana" }));

    const ok = await req("/api/auth/login", json({ email, password: "senha12345" }));
    expect(ok.status).toBe(200);

    const wrong = await req("/api/auth/login", json({ email, password: "errada123" }));
    expect(wrong.status).toBe(401);
  });

  it("GET /me exige token e retorna o usuário quando autenticado", async () => {
    const semToken = await req("/api/auth/me");
    expect(semToken.status).toBe(401);

    const email = uniqueEmail();
    const registered = await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana" }));
    const { accessToken } = await registered.json();

    const comToken = await req("/api/auth/me", { headers: { Authorization: `Bearer ${accessToken}` } });
    expect(comToken.status).toBe(200);
    const me = await comToken.json();
    expect(me.email).toBe(email);
  });

  it("gira o refresh token (não pode ser reutilizado após rotacionar)", async () => {
    const email = uniqueEmail();
    const registered = await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana" }));
    const { refreshToken } = await registered.json();

    const first = await req("/api/auth/refresh", json({ refreshToken }));
    expect(first.status).toBe(200);

    const reused = await req("/api/auth/refresh", json({ refreshToken }));
    expect(reused.status).toBe(401);
  });
});
