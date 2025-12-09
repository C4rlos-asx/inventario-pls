import 'dotenv/config';
import express from 'express';

// Importar rutas
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import clientsRoutes from './routes/clients.js';
import categoriesRoutes from './routes/categories.js';
import inventoryRoutes from './routes/inventory.js';
import invoicesRoutes from './routes/invoices.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS permisivo para Vercel
app.use((req, res, next) => {
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Manejar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`📦 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});
