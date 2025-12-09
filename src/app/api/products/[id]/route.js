import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener producto por ID
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const result = await query(
            `SELECT 
        p.*, 
        c.name as category_name, c.color as category_color,
        COALESCE(i.quantity, 0) as stock,
        COALESCE(i.min_stock, 5) as min_stock,
        COALESCE(i.max_stock, 1000) as max_stock,
        i.location
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        return Response.json({ product: result.rows[0] });
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// PUT - Actualizar producto
export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { code, name, description, categoryId, price, cost, taxRate, isActive } = body;

        // Verificar que el producto existe
        const existing = await query('SELECT id FROM products WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
        }

        // Verificar código único si se está cambiando
        if (code) {
            const codeCheck = await query(
                'SELECT id FROM products WHERE code = $1 AND id != $2',
                [code, id]
            );
            if (codeCheck.rows.length > 0) {
                return Response.json({ error: 'El código ya está en uso' }, { status: 409 });
            }
        }

        const result = await query(
            `UPDATE products SET
        code = COALESCE($1, code),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category_id = $4,
        price = COALESCE($5, price),
        cost = COALESCE($6, cost),
        tax_rate = COALESCE($7, tax_rate),
        is_active = COALESCE($8, is_active),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
            [code, name, description, categoryId, price, cost, taxRate, isActive, id]
        );

        return Response.json({ success: true, product: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// DELETE - Eliminar producto (soft delete)
export async function DELETE(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;

        await query('UPDATE products SET is_active = false WHERE id = $1', [id]);

        return Response.json({ success: true, message: 'Producto eliminado' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
