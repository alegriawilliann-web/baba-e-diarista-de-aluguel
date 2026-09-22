import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`[server] rodando em http://localhost:${env.PORT} (docs em /docs)`);
});
