import pg from 'pg';
const { Pool } = pg;

// Configuración para aceptar certificados auto-firmados de Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com')
        ? { rejectUnauthorized: false }
        : false,
});

pool.on('error', (err) => {
    console.error('Error inesperado en el pool:', err);
});

pool.on('connect', () => {
    console.log('✅ Conectado a PostgreSQL');
});

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

export async function getClient() {
    return await pool.connect();
}

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

export { pool };
