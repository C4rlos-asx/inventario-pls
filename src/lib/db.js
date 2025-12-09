import { Pool } from 'pg';

// Singleton para la conexión a la base de datos
let pool = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    // Detectar si la URL requiere SSL (Render, Neon, etc.)
    const useSSL = connectionString && (
      connectionString.includes('render.com') ||
      connectionString.includes('neon.tech') ||
      connectionString.includes('sslmode=require') ||
      process.env.NODE_ENV === 'production'
    );

    pool = new Pool({
      connectionString,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
      max: 5, // Reducido para evitar límites de conexión
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Aumentado para conexiones lentas
    });

    // Manejo de errores en el pool
    pool.on('error', (err) => {
      console.error('Error inesperado en el pool de PostgreSQL', err);
      pool = null; // Reiniciar pool en caso de error
    });

    // Test de conexión
    pool.query('SELECT NOW()')
      .then(() => console.log('✅ Conexión a PostgreSQL establecida'))
      .catch((err) => console.error('❌ Error conectando a PostgreSQL:', err.message));
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
