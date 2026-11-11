import { app } from "./app";
import { env } from "./config/env";
import { enviarLembretesPagamentoPendente } from "./modules/payments/payments.service";

app.listen(env.PORT, () => {
  console.log(`[server] rodando em http://localhost:${env.PORT} (docs em /docs)`);
});

// Checa a cada 30min quem tem Pix de mensalidade pendente há mais de 6h e
// manda um lembrete. Como o serviço roda no plano grátis do Render (que
// dorme sem tráfego), isso não é um relógio exato — mas qualquer acesso que
// acorde o serviço dispara a checagem seguinte, o que é suficiente pra um
// lembrete (não é algo que precise de precisão ao minuto).
setInterval(() => {
  enviarLembretesPagamentoPendente().catch((err) => console.error("[lembretes-pagamento] erro:", err));
}, 30 * 60 * 1000);
