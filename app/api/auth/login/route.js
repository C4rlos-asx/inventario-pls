import { query } from '@/lib/db';
import { verifyPassword, createToken, createAuthResponse } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validaciones
        if (!email || !password) {
            return Response.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            );
        }

        // Buscar usuario
        const result = await query(
            'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return Response.json(
                { error: 'Credenciales incorrectas' },
                { status: 401 }
            );
        }

        const user = result.rows[0];

        // Verificar contraseña
        const isValid = await verifyPassword(password, user.password_hash);

        if (!isValid) {
            return Response.json(
                { error: 'Credenciales incorrectas' },
                { status: 401 }
            );
        }

        // Crear token JWT
        const token = await createToken({
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        });

        return createAuthResponse(
            {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                },
            },
            token
        );
    } catch (error) {
        console.error('Error en login:', error);
        return Response.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
