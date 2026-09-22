import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb, criarPagamento, vincularMpPaymentId, atualizarStatusPorMpId, buscarPagamento, buscarPagamentoPorMpId } from "./db.js";
import { criarPagamentoPix, criarPagamentoCartao, consultarPagamentoMP } from "./mercadopago.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.json({ ok: true, servico: "baba-de-aluguel-pagamentos" });
});

// Chave pública do Mercado Pago (segura de expor) — o app usa para tokenizar cartão.
app.get("/api/mp/public-key", (_req, res) => {
  if (!process.env.MP_PUBLIC_KEY) return res.status(500).json({ erro: "MP_PUBLIC_KEY não configurada no servidor" });
  res.json({ publicKey: process.env.MP_PUBLIC_KEY });
});

app.post("/api/pagamentos/pix", async (req, res) => {
  try {
    const { servico, valorCentavos, descricao, email, nome, referenciaExterna } = req.body;
    if (!servico || !valorCentavos || !email) {
      return res.status(400).json({ erro: "servico, valorCentavos e email são obrigatórios" });
    }

    const registro = await criarPagamento({
      servico, metodo: "pix", valorCentavos, descricao, pagadorEmail: email, pagadorNome: nome, referenciaExterna,
    });

    const mp = await criarPagamentoPix({ valorCentavos, descricao, email, nome, referenciaExterna: String(registro.id) });
    await vincularMpPaymentId(registro.id, mp.mpPaymentId);

    res.json({
      id: registro.id,
      status: mp.status,
      qrCodeBase64: mp.qrCodeBase64,
      qrCodeCopiaECola: mp.qrCodeCopiaECola,
      expiraEm: mp.expiraEm,
    });
  } catch (err) {
    console.error("[pix] erro:", err?.message || err);
    res.status(500).json({ erro: "Não foi possível gerar o pagamento Pix" });
  }
});

app.post("/api/pagamentos/cartao", async (req, res) => {
  try {
    const { servico, valorCentavos, descricao, email, token, parcelas, issuerId, paymentMethodId, referenciaExterna } = req.body;
    if (!servico || !valorCentavos || !email || !token || !paymentMethodId) {
      return res.status(400).json({ erro: "servico, valorCentavos, email, token e paymentMethodId são obrigatórios" });
    }

    const registro = await criarPagamento({
      servico, metodo: "cartao", valorCentavos, descricao, pagadorEmail: email, referenciaExterna,
    });

    const mp = await criarPagamentoCartao({
      valorCentavos, descricao, email, token, parcelas, issuerId, paymentMethodId,
      referenciaExterna: String(registro.id),
    });
    await vincularMpPaymentId(registro.id, mp.mpPaymentId);
    await atualizarStatusPorMpId(mp.mpPaymentId, mp.status);

    res.json({ id: registro.id, status: mp.status, statusDetail: mp.statusDetail });
  } catch (err) {
    console.error("[cartao] erro:", err?.message || err);
    res.status(500).json({ erro: "Não foi possível processar o pagamento no cartão" });
  }
});

// O app faz polling nesse endpoint para saber quando o Pix foi pago.
app.get("/api/pagamentos/:id", async (req, res) => {
  try {
    const registro = await buscarPagamento(req.params.id);
    if (!registro) return res.status(404).json({ erro: "Pagamento não encontrado" });

    // Se ainda está pendente, confirma direto na fonte (Mercado Pago) em vez de
    // confiar só no banco — garante que o status nunca fica desatualizado.
    if (registro.status === "pendente" && registro.mp_payment_id) {
      const mp = await consultarPagamentoMP(registro.mp_payment_id);
      if (mp.status !== registro.status) {
        await atualizarStatusPorMpId(registro.mp_payment_id, mp.status);
        registro.status = mp.status;
      }
    }

    res.json({ id: registro.id, status: registro.status, metodo: registro.metodo, valorCentavos: registro.valor_centavos });
  } catch (err) {
    console.error("[status] erro:", err?.message || err);
    res.status(500).json({ erro: "Não foi possível consultar o pagamento" });
  }
});

// Mercado Pago chama essa URL sozinho quando o status de um pagamento muda
// (ex: Pix foi pago). Configure essa URL no painel do Mercado Pago.
app.post("/api/webhooks/mercadopago", async (req, res) => {
  try {
    const paymentId = req.query["data.id"] || req.body?.data?.id;
    const tipo = req.query.type || req.body?.type;
    if (tipo === "payment" && paymentId) {
      const mp = await consultarPagamentoMP(paymentId);
      const registro = await atualizarStatusPorMpId(String(paymentId), mp.status);
      if (registro) console.log(`[webhook] pagamento ${registro.id} -> ${mp.status}`);
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("[webhook] erro:", err?.message || err);
    res.sendStatus(200); // sempre 200 para o Mercado Pago não ficar reenviando
  }
});

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[server] rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error("[db] falha ao iniciar:", err);
    process.exit(1);
  });
