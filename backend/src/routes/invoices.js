import express from 'express';
import { query, withTransaction } from '../lib/db.js';
import { authMiddleware } from '../lib/auth.js';

const router = express.Router();

// GET /api/invoices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, clientId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = `
      SELECT i.*, c.name as client_name, c.email as client_email,
             u.name as created_by_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 0;

        if (status) {
            paramCount++;
            sql += ` AND i.status = $${paramCount}`;
            params.push(status);
        }

        if (clientId) {
            paramCount++;
            sql += ` AND i.client_id = $${paramCount}`;
            params.push(clientId);
        }

        if (startDate) {
            paramCount++;
            sql += ` AND i.created_at >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            sql += ` AND i.created_at <= $${paramCount}`;
            params.push(endDate);
        }

        sql += ` ORDER BY i.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Estadísticas
        const statsResult = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid
      FROM invoices
    `);

        res.json({
            invoices: result.rows,
            stats: statsResult.rows[0],
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error('Error obteniendo facturas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/invoices
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, items, notes, paymentMethod } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'La factura debe tener al menos un item' });
        }

        const result = await withTransaction(async (client) => {
            // Calcular totales
            let subtotal = 0;
            let taxTotal = 0;

            for (const item of items) {
                const productResult = await client.query(
                    'SELECT price, tax_rate FROM products WHERE id = $1',
                    [item.productId]
                );

                if (productResult.rows.length === 0) {
                    throw new Error(`Producto ${item.productId} no encontrado`);
                }

                const product = productResult.rows[0];
                const itemSubtotal = product.price * item.quantity;
                const itemTax = itemSubtotal * (product.tax_rate / 100);

                subtotal += itemSubtotal;
                taxTotal += itemTax;
            }

            const total = subtotal + taxTotal;

            // Generar número de factura
            const lastInvoice = await client.query(
                "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1"
            );

            let invoiceNumber = 'INV-0001';
            if (lastInvoice.rows.length > 0) {
                const lastNum = parseInt(lastInvoice.rows[0].invoice_number.split('-')[1]);
                invoiceNumber = `INV-${String(lastNum + 1).padStart(4, '0')}`;
            }

            // Crear factura
            const invoiceResult = await client.query(
                `INSERT INTO invoices (invoice_number, client_id, subtotal, tax, total, status, notes, payment_method, created_by)
         VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8) RETURNING *`,
                [invoiceNumber, clientId || null, subtotal, taxTotal, total, notes || null, paymentMethod || 'cash', req.user.userId]
            );

            const invoice = invoiceResult.rows[0];

            // Crear items y actualizar inventario
            for (const item of items) {
                const productResult = await client.query(
                    'SELECT price, tax_rate FROM products WHERE id = $1',
                    [item.productId]
                );

                const product = productResult.rows[0];

                await client.query(
                    `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, tax_rate)
           VALUES ($1, $2, $3, $4, $5)`,
                    [invoice.id, item.productId, item.quantity, product.price, product.tax_rate]
                );

                // Actualizar inventario
                await client.query(
                    'UPDATE inventory SET quantity = quantity - $1 WHERE product_id = $2',
                    [item.quantity, item.productId]
                );

                // Registrar movimiento
                await client.query(
                    `INSERT INTO inventory_movements (product_id, movement_type, quantity, notes, created_by)
           VALUES ($1, 'sale', $2, $3, $4)`,
                    [item.productId, item.quantity, `Venta - Factura ${invoiceNumber}`, req.user.userId]
                );
            }

            return invoice;
        });

        res.status(201).json({ invoice: result });
    } catch (error) {
        console.error('Error creando factura:', error);
        res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
});

// GET /api/invoices/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const invoiceResult = await query(
            `SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone,
              c.address as client_address, c.document_type, c.document_number,
              u.name as created_by_name
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = $1`,
            [req.params.id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const itemsResult = await query(
            `SELECT ii.*, p.name as product_name, p.code as product_code
       FROM invoice_items ii
       JOIN products p ON ii.product_id = p.id
       WHERE ii.invoice_id = $1`,
            [req.params.id]
        );

        res.json({
            invoice: invoiceResult.rows[0],
            items: itemsResult.rows,
        });
    } catch (error) {
        console.error('Error obteniendo factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/invoices/:id (actualizar estado)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }

        const result = await query(
            'UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({ invoice: result.rows[0] });
    } catch (error) {
        console.error('Error actualizando factura:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

export default router;
