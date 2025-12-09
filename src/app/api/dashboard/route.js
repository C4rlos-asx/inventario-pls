import { query } from '@/lib/db';

// GET - Obtener estadísticas del dashboard
export async function GET() {
    try {
        // Estadísticas de productos
        const productsStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_active = true) as active
      FROM products
    `);

        // Estadísticas de inventario
        const inventoryStats = await query(`
      SELECT 
        SUM(i.quantity) as total_items,
        SUM(i.quantity * p.price) as total_value,
        COUNT(*) FILTER (WHERE i.quantity <= 0) as out_of_stock,
        COUNT(*) FILTER (WHERE i.quantity > 0 AND i.quantity <= i.min_stock) as low_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = true
    `);

        // Estadísticas de facturas del mes actual
        const invoicesStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'paid') as paid,
        COALESCE(SUM(total) FILTER (WHERE status != 'cancelled'), 0) as total_amount,
        COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) as paid_amount
      FROM invoices
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
    `);

        // Estadísticas de clientes
        const clientsStats = await query(`
      SELECT COUNT(*) as total FROM clients WHERE is_active = true
    `);

        // Últimas 5 facturas
        const recentInvoices = await query(`
      SELECT 
        i.id, i.invoice_number, i.total, i.status, i.created_at,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);

        // Productos con stock bajo
        const lowStockProducts = await query(`
      SELECT 
        p.id, p.code, p.name, i.quantity, i.min_stock
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = true AND i.quantity <= i.min_stock
      ORDER BY i.quantity ASC
      LIMIT 5
    `);

        // Ventas por día (últimos 7 días)
        const salesByDay = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as amount
      FROM invoices
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

        return Response.json({
            products: productsStats.rows[0],
            inventory: inventoryStats.rows[0],
            invoices: invoicesStats.rows[0],
            clients: clientsStats.rows[0],
            recentInvoices: recentInvoices.rows,
            lowStockProducts: lowStockProducts.rows,
            salesByDay: salesByDay.rows,
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
