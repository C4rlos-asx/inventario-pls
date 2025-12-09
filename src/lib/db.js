import { Pool } from 'pg';

// Singleton para la conexión a la base de datos
let pool = null;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      console.error('❌ DATABASE_URL no está configurada');
      throw new Error('DATABASE_URL no está configurada');
    }

    // Mostrar a qué host nos conectamos (sin credenciales)
    try {
      const url = new URL(connectionString);
      console.log('🔌 Conectando a PostgreSQL en:', url.hostname);
    } catch (e) {
      console.log('🔌 Conectando a PostgreSQL...');
    }

    pool = new Pool({
      connectionString,
      // SIEMPRE usar SSL - requerido por Render, Neon, Railway, etc.
      ssl: {
        rejectUnauthorized: false,
      },
      max: 3, // Reducido para plan gratuito
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 30000, // 30 segundos
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    });

    // Manejo de errores en el pool
    pool.on('error', (err) => {
      console.error('❌ Error en el pool de PostgreSQL:', err.message);
      pool = null;
    });

    pool.on('connect', () => {
      console.log('✅ Conexión a PostgreSQL establecida');
    });
  }
  return pool;
}

// Ejecutar una query simple
export async function query(text, params) {
  const currentPool = getPool();
  const start = Date.now();
  try {
    const result = await currentPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', { text: text.substring(0, 50), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Error en query:', error.message);
    // Reiniciar pool en caso de error de conexión
    if (error.message.includes('terminated') || error.message.includes('ECONNREFUSED')) {
      pool = null;
    }
    throw error;
  }
}

// Obtener un cliente para transacciones
export async function getClient() {
  const currentPool = getPool();
  const client = await currentPool.connect();
  const originalQuery = client.query;
  const originalRelease = client.release;

  // Timeout para liberar cliente automáticamente
  const timeout = setTimeout(() => {
    console.error('Cliente de BD no liberado a tiempo!');
  }, 30000);

  // Sobrescribir query para tracking
  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease.apply(client);
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
