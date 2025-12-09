import express from 'express';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/inventory
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
      SELECT i.*, p.name as product_name, p.code as product_code, p.price,
             c.name as category_name, c.color as category_color,
             CASE 
               WHEN i.quantity <= 0 THEN 'out_of_stock'
               WHEN i.quantity <= i.min_stock THEN 'low_stock'
               ELSE 'in_stock'
             END as stock_status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            sql += ` AND (p.name ILIKE $${paramCount} OR p.code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (status === 'low') {
            sql += ' AND i.quantity <= i.min_stock AND i.quantity > 0';
        } else if (status === 'out') {
            sql += ' AND i.quantity <= 0';
        }

        sql += ` ORDER BY i.quantity ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Estadísticas
        const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN quantity <= min_stock AND quantity > 0 THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = true
    `);

        res.json({
            inventory: result.rows,
            stats: statsResult.rows[0],
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Error obteniendo inventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/inventory (ajustar stock)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { productId, quantity, movementType, notes } = req.body;

        if (!productId || quantity === undefined || !movementType) {
            return res.status(400).json({ error: 'ProductId, quantity y movementType son requeridos' });
        }

        // Obtener cantidad actual
        const currentResult = await query(
            'SELECT quantity FROM inventory WHERE product_id = $1',
            [productId]
        );

        if (currentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado en inventario' });
        }

        const currentQuantity = currentResult.rows[0].quantity;
        let newQuantity = currentQuantity;

        if (movementType === 'in' || movementType === 'adjustment_in') {
            newQuantity = currentQuantity + quantity;
        } else if (movementType === 'out' || movementType === 'adjustment_out') {
            newQuantity = currentQuantity - quantity;
        } else if (movementType === 'set') {
            newQuantity = quantity;
        }

        if (newQuantity < 0) {
            return res.status(400).json({ error: 'El stock no puede ser negativo' });
        }

        // Actualizar inventario
        await query('UPDATE inventory SET quantity = $1 WHERE product_id = $2', [newQuantity, productId]);

        // Registrar movimiento
        await query(
            `INSERT INTO inventory_movements (product_id, movement_type, quantity, previous_quantity, new_quantity, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [productId, movementType, quantity, currentQuantity, newQuantity, notes || null, req.user.userId]
        );

        res.json({
            message: 'Stock actualizado',
            previousQuantity: currentQuantity,
            newQuantity
        });
    } catch (error) {
        console.error('Error actualizando inventario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
