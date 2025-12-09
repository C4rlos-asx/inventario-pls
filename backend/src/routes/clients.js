import express from 'express';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/clients
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM clients WHERE is_active = true';
        const params = [];
        let paramCount = 0;

        if (search) {
            paramCount++;
            sql += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount} OR document_number ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY name ASC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);
        const countResult = await query('SELECT COUNT(*) FROM clients WHERE is_active = true');

        res.json({
            clients: result.rows,
            total: parseInt(countResult.rows[0].count),
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/clients
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, address, documentType, documentNumber } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await query(
            `INSERT INTO clients (name, email, phone, address, document_type, document_number)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, email || null, phone || null, address || null, documentType || null, documentNumber || null]
        );

        res.status(201).json({ client: result.rows[0] });
    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
