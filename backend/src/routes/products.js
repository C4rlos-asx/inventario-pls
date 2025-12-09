import express from 'express';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/products
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, category, status, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
      SELECT p.*, c.name as category_name, c.color as category_color,
             COALESCE(i.quantity, 0) as stock,
             CASE 
               WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out_of_stock'
               WHEN COALESCE(i.quantity, 0) <= COALESCE(i.min_stock, 5) THEN 'low_stock'
               ELSE 'in_stock'
             END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = true
    `;
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            sql += ` AND (p.name ILIKE $${paramCount} OR p.code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        if (category) {
            paramCount++;
            sql += ` AND p.category_id = $${paramCount}`;
            params.push(category);
        }

        sql += ` ORDER BY p.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        const countResult = await query('SELECT COUNT(*) FROM products WHERE is_active = true');

        res.json({
            products: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/products
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { code, name, description, categoryId, price, cost, taxRate, initialStock } = req.body;

        if (!code || !name || !price) {
            return res.status(400).json({ error: 'Código, nombre y precio son requeridos' });
        }

        const existing = await query('SELECT id FROM products WHERE code = $1', [code]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'El código del producto ya existe' });
        }

        const result = await query(
            `INSERT INTO products (code, name, description, category_id, price, cost, tax_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [code, name, description || null, categoryId || null, price, cost || 0, taxRate || 0]
        );

        // Actualizar inventario inicial si se proporcionó
        if (initialStock && initialStock > 0) {
            await query(
                'UPDATE inventory SET quantity = $1 WHERE product_id = $2',
                [initialStock, result.rows[0].id]
            );
        }

        res.status(201).json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/products/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            `SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON p.id = i.product_id
       WHERE p.id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/products/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, categoryId, price, cost, taxRate } = req.body;

        const result = await query(
            `UPDATE products SET 
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         category_id = $3,
         price = COALESCE($4, price),
         cost = COALESCE($5, cost),
         tax_rate = COALESCE($6, tax_rate),
         updated_at = NOW()
       WHERE id = $7 RETURNING *`,
            [name, description, categoryId || null, price, cost, taxRate, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/products/:id
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
