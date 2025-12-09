// Script de prueba de conexión a PostgreSQL
// Ejecutar con: node test-db.js

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL no está configurada');
    console.log('\nEjecuta así:');
    console.log('DATABASE_URL="postgresql://..." node test-db.js');
    process.exit(1);
}

// Parsear la URL para mostrar info (sin password)
try {
    const url = new URL(connectionString);
    console.log('\n📊 Información de conexión:');
    console.log('  Host:', url.hostname);
    console.log('  Puerto:', url.port || '5432');
    console.log('  Base de datos:', url.pathname.slice(1));
    console.log('  Usuario:', url.username);
    console.log('  SSL:', url.searchParams.get('sslmode') || 'require (forzado)');
} catch (e) {
    console.log('URL:', connectionString.substring(0, 30) + '...');
}

console.log('\n🔌 Probando conexión...\n');

const pool = new Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 30000,
});

async function testConnection() {
    try {
        // Test 1: Conectar
        console.log('1️⃣ Conectando al pool...');
        const client = await pool.connect();
        console.log('   ✅ Conexión establecida');

        // Test 2: Query simple
        console.log('2️⃣ Ejecutando query de prueba...');
        const result = await client.query('SELECT NOW() as time, current_database() as db');
        console.log('   ✅ Hora del servidor:', result.rows[0].time);
        console.log('   ✅ Base de datos:', result.rows[0].db);

        // Test 3: Verificar tabla users
        console.log('3️⃣ Verificando tabla users...');
        const tables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

        if (tables.rows.length > 0) {
            console.log('   ✅ Tabla users existe');

            // Contar usuarios
            const count = await client.query('SELECT COUNT(*) FROM users');
            console.log('   ✅ Usuarios en la tabla:', count.rows[0].count);
        } else {
            console.log('   ❌ Tabla users NO existe - ejecuta schema.sql primero');
        }

        client.release();
        console.log('\n✅ ¡Todas las pruebas pasaron! La conexión funciona correctamente.\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('\nDetalles del error:');
        console.error('  Código:', error.code);

        if (error.message.includes('password')) {
            console.log('\n💡 Parece un problema de contraseña. Verifica que:');
            console.log('   - La contraseña esté correcta');
            console.log('   - Caracteres especiales estén codificados (@ = %40, # = %23, etc.)');
        }

        if (error.message.includes('terminated')) {
            console.log('\n💡 La conexión se cerró. Posibles causas:');
            console.log('   - La contraseña tiene caracteres especiales sin escapar');
            console.log('   - La base de datos no existe');
            console.log('   - Problema de red/firewall');
        }
    } finally {
        await pool.end();
        process.exit();
    }
}

testConnection();
