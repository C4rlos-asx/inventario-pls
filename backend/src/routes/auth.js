import express from 'express';
import { query } from '../lib/db.js';
import { hashPassword, verifyPassword, createToken, verifyToken, authMiddleware } from '../lib/auth.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el email ya existe
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await hashPassword(password);

        // Insertar usuario
        const result = await query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), hashedPassword, 'user']
        );

        const user = result.rows[0];

        // Crear token
        const token = await createToken({ userId: user.id, email: user.email, role: user.role });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const result = await query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const validPassword = await verifyPassword(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = await createToken({ userId: user.id, email: user.email, role: user.role });

        res.json({
            message: 'Login exitoso',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token,
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ authenticated: false, error: 'Usuario no encontrado' });
        }

        res.json({ authenticated: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error en /me:', error);
        res.status(500).json({ authenticated: false, error: 'Error interno del servidor' });
    }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
    res.json({ message: 'Logout exitoso' });
});

export default router;
