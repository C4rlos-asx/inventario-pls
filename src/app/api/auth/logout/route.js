import { createLogoutResponse } from '@/lib/auth';

export async function POST() {
    return createLogoutResponse({ success: true, message: 'Sesión cerrada' });
}

export async function GET() {
    return createLogoutResponse({ success: true, message: 'Sesión cerrada' });
}
