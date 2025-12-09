import { query, withTransaction } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener inventario
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // low_stock, out_of_stock, in_stock
        const productId = searchParams.get('productId');

        let queryStr = `
      SELECT 
        i.*,
        p.code as product_code,
        p.name as product_name,
        p.price,
        c.name as category_name,
        CASE 
          WHEN i.quantity <= 0 THEN 'out_of_stock'
          WHEN i.quantity <= i.min_stock THEN 'low_stock'
          ELSE 'in_stock'
        END as status
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;

        const params = [];

        if (productId) {
            queryStr += ` AND i.product_id = $${params.length + 1}`;
            params.push(productId);
        }

        queryStr += ' ORDER BY i.quantity ASC';

        const result = await query(queryStr, params);

        let inventory = result.rows;

        if (status) {
            inventory = inventory.filter((i) => i.status === status);
        }

        // Estadísticas
        const stats = {
            total: inventory.length,
            inStock: inventory.filter((i) => i.status === 'in_stock').length,
            lowStock: inventory.filter((i) => i.status === 'low_stock').length,
            outOfStock: inventory.filter((i) => i.status === 'out_of_stock').length,
            totalValue: inventory.reduce((sum, i) => sum + (i.quantity * parseFloat(i.price)), 0),
        };

        return Response.json({ inventory, stats });
    } catch (error) {
        console.error('Error obteniendo inventario:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// PUT - Ajustar inventario
export async function PUT(request) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, quantity, type, notes } = body;

        // type: 'set' (establecer), 'add' (sumar), 'subtract' (restar)

        if (!productId || quantity === undefined) {
            return Response.json(
                { error: 'productId y quantity son requeridos' },
                { status: 400 }
            );
        }

        const result = await withTransaction(async (client) => {
            // Obtener cantidad actual
            const current = await client.query(
                'SELECT quantity FROM inventory WHERE product_id = $1',
                [productId]
            );

            const currentQty = current.rows[0]?.quantity || 0;
            let newQty;
            let movementQty;

            switch (type) {
                case 'add':
                    newQty = currentQty + quantity;
                    movementQty = quantity;
                    break;
                case 'subtract':
                    newQty = Math.max(0, currentQty - quantity);
                    movementQty = -quantity;
                    break;
                case 'set':
                default:
                    newQty = quantity;
                    movementQty = quantity - currentQty;
            }

            // Actualizar inventario
            await client.query(
                `UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2`,
                [newQty, productId]
            );

            // Registrar movimiento
            await client.query(
                `INSERT INTO inventory_movements 
         (product_id, quantity, previous_quantity, new_quantity, movement_type, notes, user_id)
         VALUES ($1, $2, $3, $4, 'adjustment', $5, $6)`,
                [productId, movementQty, currentQty, newQty, notes || null, session.userId]
            );

            return { previousQuantity: currentQty, newQuantity: newQty };
        });

        return Response.json({ success: true, ...result });
    } catch (error) {
        console.error('Error ajustando inventario:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
