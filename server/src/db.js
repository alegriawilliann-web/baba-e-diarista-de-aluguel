import pg from "pg";

const { Pool } = pg;

// Render injects DATABASE_URL automatically when a Postgres database is
// attached to this service. Locally, set it in server/.env instead.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagamentos (
      id SERIAL PRIMARY KEY,
      mp_payment_id TEXT UNIQUE,
      servico TEXT NOT NULL,
      metodo TEXT NOT NULL,
      valor_centavos INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      descricao TEXT,
      pagador_email TEXT,
      pagador_nome TEXT,
      referencia_externa TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  console.log("[db] tabela pagamentos pronta");
}

export async function criarPagamento({ servico, metodo, valorCentavos, descricao, pagadorEmail, pagadorNome, referenciaExterna }) {
  const { rows } = await pool.query(
    `INSERT INTO pagamentos (servico, metodo, valor_centavos, descricao, pagador_email, pagador_nome, referencia_externa)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [servico, metodo, valorCentavos, descricao ?? null, pagadorEmail ?? null, pagadorNome ?? null, referenciaExterna ?? null]
  );
  return rows[0];
}

export async function vincularMpPaymentId(id, mpPaymentId) {
  const { rows } = await pool.query(
    `UPDATE pagamentos SET mp_payment_id = $2, atualizado_em = now() WHERE id = $1 RETURNING *`,
    [id, mpPaymentId]
  );
  return rows[0];
}

export async function atualizarStatusPorMpId(mpPaymentId, status) {
  const { rows } = await pool.query(
    `UPDATE pagamentos SET status = $2, atualizado_em = now() WHERE mp_payment_id = $1 RETURNING *`,
    [mpPaymentId, status]
  );
  return rows[0];
}

export async function buscarPagamento(id) {
  const { rows } = await pool.query(`SELECT * FROM pagamentos WHERE id = $1`, [id]);
  return rows[0];
}

export async function buscarPagamentoPorMpId(mpPaymentId) {
  const { rows } = await pool.query(`SELECT * FROM pagamentos WHERE mp_payment_id = $1`, [mpPaymentId]);
  return rows[0];
}
