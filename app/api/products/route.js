import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener todos los productos con inventario
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const categoryId = searchParams.get('category');
        const status = searchParams.get('status'); // in_stock, low_stock, out_of_stock
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE p.is_active = true';
        const params = [];
        let paramIndex = 1;

        if (search) {
            whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (categoryId) {
            whereClause += ` AND p.category_id = $${paramIndex}`;
            params.push(categoryId);
            paramIndex++;
        }

        // Query principal
        const productsQuery = `
      SELECT 
        p.id, p.code, p.name, p.description, p.price, p.cost, p.tax_rate,
        p.is_active, p.created_at, p.updated_at,
        c.id as category_id, c.name as category_name, c.color as category_color,
        COALESCE(i.quantity, 0) as stock,
        COALESCE(i.min_stock, 5) as min_stock,
        CASE 
          WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out_of_stock'
          WHEN COALESCE(i.quantity, 0) <= COALESCE(i.min_stock, 5) THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

        params.push(limit, offset);

        // Count total
        const countQuery = `
      SELECT COUNT(*) 
      FROM products p 
      LEFT JOIN inventory i ON p.id = i.product_id
      ${whereClause}
    `;

        const [productsResult, countResult] = await Promise.all([
            query(productsQuery, params),
            query(countQuery, params.slice(0, -2)),
        ]);

        let products = productsResult.rows;

        // Filtrar por status si es necesario
        if (status) {
            products = products.filter(p => p.stock_status === status);
        }

        return Response.json({
            products,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
            },
        });
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// POST - Crear nuevo producto
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { code, name, description, categoryId, price, cost, taxRate, initialStock } = body;

        // Validaciones
        if (!code || !name || price === undefined) {
            return Response.json(
                { error: 'Código, nombre y precio son requeridos' },
                { status: 400 }
            );
        }

        // Verificar código único
        const existing = await query('SELECT id FROM products WHERE code = $1', [code]);
        if (existing.rows.length > 0) {
            return Response.json(
                { error: 'El código de producto ya existe' },
                { status: 409 }
            );
        }

        // Insertar producto
        const result = await query(
            `INSERT INTO products (code, name, description, category_id, price, cost, tax_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, code, name, description, category_id, price, cost, tax_rate, created_at`,
            [code, name, description || null, categoryId || null, price, cost || 0, taxRate || 0]
        );

        const product = result.rows[0];

        // Actualizar inventario inicial si se proporciona
        if (initialStock && initialStock > 0) {
            await query(
                `UPDATE inventory SET quantity = $1 WHERE product_id = $2`,
                [initialStock, product.id]
            );
        }

        return Response.json({ success: true, product }, { status: 201 });
    } catch (error) {
        console.error('Error creando producto:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
