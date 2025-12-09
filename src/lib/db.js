import { Pool } from 'pg';

// Pool global - la forma estándar que funciona con Vercel + Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Query simple
export async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error en query:', error.message);
    throw error;
  }
}

// Obtener cliente para transacciones
export async function getClient() {
  const client = await pool.connect();
  return client;
}

// Helper para transacciones
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function getPool() {
  return pool;
}
