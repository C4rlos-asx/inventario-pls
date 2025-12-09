import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener categorías
export async function GET() {
    try {
        const result = await query('SELECT * FROM categories ORDER BY name ASC');
        return Response.json({ categories: result.rows });
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// POST - Crear categoría
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, color, icon } = body;

        if (!name) {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO categories (name, description, color, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [name, description || null, color || '#6366f1', icon || 'package']
        );

        return Response.json({ success: true, category: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creando categoría:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
