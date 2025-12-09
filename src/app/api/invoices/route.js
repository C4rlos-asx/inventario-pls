import { query, withTransaction } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener todas las facturas
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');
        const clientId = searchParams.get('clientId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (i.invoice_number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (status) {
            whereClause += ` AND i.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (clientId) {
            whereClause += ` AND i.client_id = $${paramIndex}`;
            params.push(clientId);
            paramIndex++;
        }

        if (startDate) {
            whereClause += ` AND i.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            whereClause += ` AND i.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        const invoicesQuery = `
      SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.tax_id as client_tax_id,
        u.name as created_by,
        (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items_count
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.user_id = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(limit, offset);

        const countQuery = `
      SELECT COUNT(*) FROM invoices i 
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
    `;

        const [invoicesResult, countResult] = await Promise.all([
            query(invoicesQuery, params),
            query(countQuery, params.slice(0, -2)),
        ]);

        // Estadísticas
        const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0) as total_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'pending'), 0) as pending_amount
      FROM invoices
    `);

        return Response.json({
            invoices: invoicesResult.rows,
            stats: statsResult.rows[0],
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
            },
        });
    } catch (error) {
        console.error('Error obteniendo facturas:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// POST - Crear nueva factura
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { clientId, items, discount, discountType, notes, paymentMethod, dueDate } = body;

        // Validaciones
        if (!items || items.length === 0) {
            return Response.json(
                { error: 'La factura debe tener al menos un item' },
                { status: 400 }
            );
        }

        const invoice = await withTransaction(async (client) => {
            // Generar número de factura
            const lastInvoice = await client.query(
                `SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1`
            );

            let nextNumber = 1;
            if (lastInvoice.rows.length > 0) {
                const lastNum = parseInt(lastInvoice.rows[0].invoice_number.replace('FAC-', ''));
                nextNumber = lastNum + 1;
            }
            const invoiceNumber = `FAC-${String(nextNumber).padStart(6, '0')}`;

            // Calcular totales
            let subtotal = 0;
            let taxTotal = 0;

            const processedItems = await Promise.all(items.map(async (item) => {
                const productResult = await client.query(
                    'SELECT id, code, name, price, tax_rate FROM products WHERE id = $1',
                    [item.productId]
                );

                if (productResult.rows.length === 0) {
                    throw new Error(`Producto ${item.productId} no encontrado`);
                }

                const product = productResult.rows[0];
                const unitPrice = item.unitPrice || parseFloat(product.price);
                const taxRate = parseFloat(product.tax_rate) || 0;
                const itemSubtotal = unitPrice * item.quantity;
                const itemTax = (itemSubtotal * taxRate) / 100;

                subtotal += itemSubtotal;
                taxTotal += itemTax;

                return {
                    productId: product.id,
                    productCode: product.code,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice,
                    taxRate,
                    taxAmount: itemTax,
                    subtotal: itemSubtotal,
                };
            }));

            // Aplicar descuento
            let discountAmount = 0;
            if (discount) {
                discountAmount = discountType === 'percentage'
                    ? (subtotal * discount) / 100
                    : discount;
            }

            const total = subtotal + taxTotal - discountAmount;

            // Crear factura
            const invoiceResult = await client.query(
                `INSERT INTO invoices 
         (invoice_number, client_id, user_id, subtotal, tax_total, discount, discount_type, total, status, payment_method, notes, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11)
         RETURNING *`,
                [invoiceNumber, clientId || null, session.userId, subtotal, taxTotal, discountAmount, discountType || 'fixed', total, paymentMethod || null, notes || null, dueDate || null]
            );

            const newInvoice = invoiceResult.rows[0];

            // Insertar items y actualizar inventario
            for (const item of processedItems) {
                await client.query(
                    `INSERT INTO invoice_items 
           (invoice_id, product_id, product_name, product_code, quantity, unit_price, tax_rate, tax_amount, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [newInvoice.id, item.productId, item.productName, item.productCode, item.quantity, item.unitPrice, item.taxRate, item.taxAmount, item.subtotal]
                );

                // Actualizar inventario
                const currentInv = await client.query(
                    'SELECT quantity FROM inventory WHERE product_id = $1',
                    [item.productId]
                );

                const currentQty = currentInv.rows[0]?.quantity || 0;
                const newQty = Math.max(0, currentQty - item.quantity);

                await client.query(
                    'UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE product_id = $2',
                    [newQty, item.productId]
                );

                // Registrar movimiento
                await client.query(
                    `INSERT INTO inventory_movements 
           (product_id, quantity, previous_quantity, new_quantity, movement_type, reference_type, reference_id, user_id)
           VALUES ($1, $2, $3, $4, 'sale', 'invoice', $5, $6)`,
                    [item.productId, -item.quantity, currentQty, newQty, newInvoice.id, session.userId]
                );
            }

            return { ...newInvoice, items: processedItems };
        });

        return Response.json({ success: true, invoice }, { status: 201 });
    } catch (error) {
        console.error('Error creando factura:', error);
        return Response.json(
            { error: error.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
