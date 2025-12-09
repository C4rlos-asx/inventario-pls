import { query } from '@/lib/db';
import { hashPassword, createToken, createAuthResponse } from '@/lib/auth';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name } = body;

        // Validaciones
        if (!email || !password || !name) {
            return Response.json(
                { error: 'Email, contraseña y nombre son requeridos' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return Response.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Verificar si el email ya existe
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return Response.json(
                { error: 'El email ya está registrado' },
                { status: 409 }
            );
        }

        // Hashear contraseña y crear usuario
        const passwordHash = await hashPassword(password);

        const result = await query(
            `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, 'user') 
       RETURNING id, email, name, role, created_at`,
            [email.toLowerCase(), passwordHash, name]
        );

        const user = result.rows[0];

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
        console.error('Error en registro:', error);
        return Response.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
