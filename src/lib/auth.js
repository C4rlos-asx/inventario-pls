import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'default-secret-change-in-production'
);

const COOKIE_NAME = 'auth-token';

// Hashear contraseña
export async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

// Verificar contraseña
export async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Crear JWT token
export async function createToken(payload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

// Verificar JWT token
export async function verifyToken(token) {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}

// Obtener usuario de la sesión (para Server Components)
export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    return payload;
}

// Verificar si el usuario está autenticado
export async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}

// Crear respuesta con cookie de autenticación
export function createAuthResponse(data, token) {
    const response = Response.json(data);
    response.headers.set(
        'Set-Cookie',
        `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
    );
    return response;
}

// Eliminar cookie de autenticación
export function createLogoutResponse(data = { success: true }) {
    const response = Response.json(data);
    response.headers.set(
        'Set-Cookie',
        `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
    );
    return response;
}

// Middleware helper para proteger rutas API
export async function withAuth(handler) {
    return async (request) => {
        const cookieStore = await cookies();
        const token = cookieStore.get(COOKIE_NAME)?.value;

        if (!token) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
        }

        const session = await verifyToken(token);
        if (!session) {
            return Response.json({ error: 'Token inválido o expirado' }, { status: 401 });
        }

        // Pasar la sesión al handler
        request.session = session;
        return handler(request);
    };
}

// Verificar rol de usuario
export function hasRole(session, roles) {
    if (!session) return false;
    if (typeof roles === 'string') roles = [roles];
    return roles.includes(session.role);
}
