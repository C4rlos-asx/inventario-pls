import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener factura por ID con items
export async function GET(request, { params }) {
    try {
        const { id } = await params;

        const invoiceResult = await query(
            `SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        c.address as client_address,
        c.tax_id as client_tax_id,
        u.name as created_by
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1`,
            [id]
        );

        if (invoiceResult.rows.length === 0) {
            return Response.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        const itemsResult = await query(
            `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
            [id]
        );

        return Response.json({
            invoice: {
                ...invoiceResult.rows[0],
                items: itemsResult.rows,
            },
        });
    } catch (error) {
        console.error('Error obteniendo factura:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// PUT - Actualizar estado de factura
export async function PUT(request, { params }) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status, notes, paymentMethod } = body;

        const validStatuses = ['pending', 'paid', 'cancelled', 'partial'];
        if (status && !validStatuses.includes(status)) {
            return Response.json({ error: 'Estado no válido' }, { status: 400 });
        }

        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (status) {
            updates.push(`status = $${paramIndex}`);
            values.push(status);
            paramIndex++;

            if (status === 'paid') {
                updates.push(`paid_at = NOW()`);
            }
        }

        if (notes !== undefined) {
            updates.push(`notes = $${paramIndex}`);
            values.push(notes);
            paramIndex++;
        }

        if (paymentMethod) {
            updates.push(`payment_method = $${paramIndex}`);
            values.push(paymentMethod);
            paramIndex++;
        }

        if (updates.length === 0) {
            return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
        }

        values.push(id);
        const result = await query(
            `UPDATE invoices SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return Response.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        return Response.json({ success: true, invoice: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando factura:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
