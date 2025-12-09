import { Pool } from 'pg';

// Singleton para la conexión a la base de datos
let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Manejo de errores en el pool
    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL', err);
    });
  }
  return pool;
}

// Ejecutar una query simple
export async function query(text, params) {
  const pool = getPool();
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
}

// Obtener un cliente para transacciones
export async function getClient() {
  const pool = getPool();
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  // Timeout para liberar cliente automáticamente
  const timeout = setTimeout(() => {
    console.error('Cliente de BD no liberado a tiempo!');
    console.error(`Última query: ${client.lastQuery}`);
  }, 5000);

  // Sobrescribir query para tracking
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
}

// Helper para transacciones
export async function withTransaction(callback) {
  const client = await getClient();
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
