import { describe, it, expect } from "bun:test";
import { app } from "../src/app";

const BASE = "http://localhost";
const uniqueEmail = () => `teste-users-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`;

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

async function registerAndLogin() {
  const email = uniqueEmail();
  const res = await req("/api/auth/register", json({ email, password: "senha12345", name: "Fulana Teste" }));
  const { accessToken } = await res.json();
  return { email, accessToken, headers: { Authorization: `Bearer ${accessToken}` } };
}

describe("users", () => {
  it("PATCH /me atualiza o nome", async () => {
    const { headers } = await registerAndLogin();
    const res = await req("/api/users/me", {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Novo Nome" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe("Novo Nome");
  });

  it("concede a role de cliente e ela aparece em /me", async () => {
    const { headers } = await registerAndLogin();
    const grant = await req("/api/users/me/roles/client", json({ serviceType: "diarista", bairro: "Centro" }, { headers }));
    expect(grant.status).toBe(200);
    const body = await grant.json();
    expect(body.roles).toContain("cliente_diarista");
  });

  it("rejeita rota de admin para usuário sem role admin", async () => {
    const { headers } = await registerAndLogin();
    const res = await req("/api/users", { headers });
    expect(res.status).toBe(403);
  });

  it("cria, lista e apaga um contato de confiança", async () => {
    const { headers } = await registerAndLogin();
    const jsonHeaders = { ...headers, "Content-Type": "application/json" };

    const created = await req("/api/users/me/trusted-contacts", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ nome: "Maria", telefone: "+5511999998888", relacao: "Irmã" }),
    });
    expect(created.status).toBe(201);
    const contact = await created.json();

    const listed = await req("/api/users/me/trusted-contacts", { headers });
    const list = await listed.json();
    expect(list.some((c: { id: string }) => c.id === contact.id)).toBe(true);

    const deleted = await req(`/api/users/me/trusted-contacts/${contact.id}`, { method: "DELETE", headers });
    expect(deleted.status).toBe(200);
  });

  it("uma pessoa não pode apagar o contato de confiança de outra", async () => {
    const userA = await registerAndLogin();
    const userB = await registerAndLogin();

    const created = await req("/api/users/me/trusted-contacts", {
      method: "POST",
      headers: { ...userA.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ nome: "Maria", telefone: "+5511999998888", relacao: "Irmã" }),
    });
    const contact = await created.json();

    const deleted = await req(`/api/users/me/trusted-contacts/${contact.id}`, {
      method: "DELETE",
      headers: userB.headers,
    });
    expect(deleted.status).toBe(403);
  });
});
