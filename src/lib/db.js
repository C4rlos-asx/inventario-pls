import pg from 'pg';

const { Pool } = pg;

// Crear un nuevo pool para cada invocación serverless
export async function query(text, params = []) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
  }

  console.log('🔌 Ejecutando query en PostgreSQL...');

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 15000,
  });

  const start = Date.now();

  try {
    const client = await pool.connect();

    try {
      const result = await client.query(text, params);
      const duration = Date.now() - start;
      console.log('✅ Query ejecutada', {
        text: text.substring(0, 50),
        duration,
        rows: result.rowCount
      });
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Helper para transacciones
export async function withTransaction(callback) {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada');
  }

  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 15000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const txClient = {
      query: async (text, params = []) => client.query(text, params),
      release: () => { },
    };

    const result = await callback(txClient);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Para compatibilidad
export function getPool() {
  return { query };
}

export async function getClient() {
  const connectionString = process.env.DATABASE_URL;

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  const client = await pool.connect();

  return {
    query: (text, params) => client.query(text, params),
    release: async () => {
      client.release();
      await pool.end();
    },
  };
}
