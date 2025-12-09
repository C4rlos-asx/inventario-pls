import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - Obtener todos los clientes
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE is_active = true';
        const params = [];

        if (search) {
            whereClause += ` AND (name ILIKE $1 OR email ILIKE $1 OR tax_id ILIKE $1)`;
            params.push(`%${search}%`);
        }

        const clientsQuery = `
      SELECT * FROM clients 
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

        params.push(limit, offset);

        const countQuery = `SELECT COUNT(*) FROM clients ${whereClause}`;

        const [clientsResult, countResult] = await Promise.all([
            query(clientsQuery, params),
            query(countQuery, params.slice(0, -2)),
        ]);

        return Response.json({
            clients: clientsResult.rows,
            pagination: {
                page,
                limit,
                total: parseInt(countResult.rows[0].count),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
            },
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}

// POST - Crear nuevo cliente
export async function POST(request) {
    try {
        const session = await getSession();
        if (!session) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const { name, email, phone, address, taxId, notes } = body;

        if (!name) {
            return Response.json({ error: 'El nombre es requerido' }, { status: 400 });
        }

        const result = await query(
            `INSERT INTO clients (name, email, phone, address, tax_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [name, email || null, phone || null, address || null, taxId || null, notes || null]
        );

        return Response.json({ success: true, client: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creando cliente:', error);
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
