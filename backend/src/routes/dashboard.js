import express from 'express';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/dashboard
router.get('/', authMiddleware, async (req, res) => {
    try {
        // Estadísticas generales
        const [products, clients, invoices, revenue, lowStock, recentInvoices] = await Promise.all([
            query('SELECT COUNT(*) FROM products WHERE is_active = true'),
            query('SELECT COUNT(*) FROM clients WHERE is_active = true'),
            query('SELECT COUNT(*) FROM invoices'),
            query("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = 'paid'"),
            query(`
        SELECT p.id, p.name, p.code, i.quantity, i.min_stock
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE p.is_active = true AND i.quantity <= i.min_stock
        ORDER BY i.quantity ASC
        LIMIT 5
      `),
            query(`
        SELECT inv.*, c.name as client_name
        FROM invoices inv
        LEFT JOIN clients c ON inv.client_id = c.id
        ORDER BY inv.created_at DESC
        LIMIT 5
      `),
        ]);

        res.json({
            stats: {
                totalProducts: parseInt(products.rows[0].count),
                totalClients: parseInt(clients.rows[0].count),
                totalInvoices: parseInt(invoices.rows[0].count),
                totalRevenue: parseFloat(revenue.rows[0].total),
            },
            lowStockProducts: lowStock.rows,
            recentInvoices: recentInvoices.rows,
        });
    } catch (error) {
        console.error('Error obteniendo dashboard:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
