import { getSession } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return Response.json(
                { authenticated: false, user: null },
                { status: 200 }
            );
        }

        return Response.json({
            authenticated: true,
            user: {
                id: session.userId,
                email: session.email,
                name: session.name,
                role: session.role,
            },
        });
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return Response.json(
            { authenticated: false, user: null },
            { status: 200 }
        );
    }
}
