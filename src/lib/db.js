import { Pool, neonConfig } from 'pg';

// Configuración optimizada para serverless (Vercel)
// Las funciones serverless cierran conexiones rápidamente

let pool = null;

function createPool() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
  }

  // Log del host (sin credenciales)
  try {
    const url = new URL(connectionString);
    console.log('🔌 Conectando a PostgreSQL en:', url.hostname);
  } catch (e) {
    console.log('🔌 Conectando a PostgreSQL...');
  }

  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    // Configuración optimizada para serverless
    max: 1, // Solo 1 conexión por invocación
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
}

export function getPool() {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

// Ejecutar una query simple - crea nueva conexión cada vez en serverless
export async function query(text, params) {
  const start = Date.now();

  // Crear pool fresco para cada query en serverless
  const currentPool = createPool();

  try {
    const result = await currentPool.query(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', {
      text: text.substring(0, 50),
      duration,
      rows: result.rowCount
    });
    return result;
  } catch (error) {
    console.error('Error en query:', error.message);
    throw error;
  } finally {
    // Cerrar el pool después de cada operación en serverless
    try {
      await currentPool.end();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  }
}

// Obtener un cliente para transacciones
export async function getClient() {
  const currentPool = createPool();
  const client = await currentPool.connect();

  const originalRelease = client.release.bind(client);

  // Sobrescribir release para también cerrar el pool
  client.release = async () => {
    originalRelease();
    try {
      await currentPool.end();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  };

  return client;
}

// Helper para transacciones
export async function withTransaction(callback) {
  const currentPool = createPool();
  const client = await currentPool.connect();

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
    try {
      await currentPool.end();
    } catch (e) {
      // Ignorar errores al cerrar
    }
  }
}
