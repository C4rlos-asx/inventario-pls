import { neon } from '@neondatabase/serverless';

// Cliente SQL optimizado para serverless
// Funciona con cualquier PostgreSQL, no solo Neon
let sql = null;

function getSQL() {
  if (!sql) {
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

    // Crear cliente neon-serverless
    sql = neon(connectionString);
  }
  return sql;
}

// Ejecutar una query simple
export async function query(text, params = []) {
  const start = Date.now();
  const client = getSQL();

  try {
    // El driver neon usa tagged template literals o función directa
    const result = await client(text, params);
    const duration = Date.now() - start;
    console.log('Query ejecutada', {
      text: text.substring(0, 50),
      duration,
      rows: result.length
    });

    // Formatear resultado para compatibilidad con pg
    return {
      rows: result,
      rowCount: result.length,
    };
  } catch (error) {
    console.error('Error en query:', error.message);
    throw error;
  }
}

// Para compatibilidad - getPool ya no se usa pero mantener la interfaz
export function getPool() {
  return {
    query: async (text, params) => query(text, params),
  };
}

// Helper para transacciones (simplificado para serverless)
export async function withTransaction(callback) {
  const client = getSQL();

  try {
    await client('BEGIN');

    // Crear un cliente mock para el callback
    const txClient = {
      query: async (text, params = []) => {
        const result = await client(text, params);
        return { rows: result, rowCount: result.length };
      },
      release: () => { }, // No-op en serverless
    };

    const result = await callback(txClient);
    await client('COMMIT');
    return result;
  } catch (error) {
    await client('ROLLBACK');
    throw error;
  }
}

// Mantener getClient para compatibilidad
export async function getClient() {
  const client = getSQL();
  return {
    query: async (text, params = []) => {
      const result = await client(text, params);
      return { rows: result, rowCount: result.length };
    },
    release: () => { }, // No-op
  };
}
