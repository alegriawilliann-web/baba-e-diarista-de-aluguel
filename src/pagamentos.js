const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function post(caminho, corpo) {
  const resp = await fetch(`${API_URL}${caminho}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.erro || "Falha na comunicação com o servidor de pagamentos");
  return dados;
}

async function get(caminho) {
  const resp = await fetch(`${API_URL}${caminho}`);
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.erro || "Falha na comunicação com o servidor de pagamentos");
  return dados;
}

export function criarPagamentoPix({ servico, valorCentavos, descricao, email, nome }) {
  return post("/api/pagamentos/pix", { servico, valorCentavos, descricao, email, nome });
}

export function criarPagamentoCartao({ servico, valorCentavos, descricao, email, token, parcelas, issuerId, paymentMethodId }) {
  return post("/api/pagamentos/cartao", { servico, valorCentavos, descricao, email, token, parcelas, issuerId, paymentMethodId });
}

export function consultarPagamento(id) {
  return get(`/api/pagamentos/${id}`);
}

export function buscarChavePublica() {
  return get("/api/mp/public-key").then((r) => r.publicKey);
}
