import express from 'express';
import { query } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/categories
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await query('SELECT * FROM categories ORDER BY name ASC');
        res.json({ categories: result.rows });
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/categories
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, description, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await query(
            'INSERT INTO categories (name, description, color) VALUES ($1, $2, $3) RETURNING *',
            [name, description || null, color || '#6366f1']
        );

        res.status(201).json({ category: result.rows[0] });
    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
