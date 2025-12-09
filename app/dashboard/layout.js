'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import anime from 'animejs';

const navItems = [
    { href: '/dashboard', icon: '📊', label: 'Dashboard' },
    { href: '/dashboard/products', icon: '📦', label: 'Productos' },
    { href: '/dashboard/inventory', icon: '📋', label: 'Inventario' },
    { href: '/dashboard/invoices', icon: '🧾', label: 'Facturas' },
    { href: '/dashboard/invoices/new', icon: '➕', label: 'Nueva Factura' },
    { href: '/dashboard/clients', icon: '👥', label: 'Clientes' },
];

export default function DashboardLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const mainRef = useRef(null);

    useEffect(() => {
        // Verificar autenticación
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (!data.authenticated) {
                    router.push('/login');
                } else {
                    setUser(data.user);
                }
            });
    }, [router]);

    useEffect(() => {
        // Animación de entrada del contenido
        if (mainRef.current) {
            anime({
                targets: mainRef.current,
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                easing: 'easeOutCubic',
            });
        }
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (!user) {
        return (
            <div className="auth-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">📦</div>
                    <span className="sidebar-logo-text">InventoryPro</span>
                </div>

                <nav className="nav-section">
                    <span className="nav-section-title">Menú Principal</span>
                    {navItems.map((item, index) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${pathname === item.href ? 'active' : ''}`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <nav className="nav-section" style={{ marginTop: 'auto' }}>
                    <span className="nav-section-title">Cuenta</span>
                    <div className="nav-item" style={{ cursor: 'default' }}>
                        <span className="nav-icon">👤</span>
                        <span>{user.name}</span>
                    </div>
                    <button
                        className="nav-item"
                        onClick={handleLogout}
                        style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        <span className="nav-icon">🚪</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="header">
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{ display: 'none' }} // Oculto en desktop
                    >
                        ☰
                    </button>

                    <div className="header-search">
                        <input
                            type="search"
                            className="form-input"
                            placeholder="Buscar..."
                            style={{ maxWidth: '300px' }}
                        />
                    </div>

                    <div className="header-actions">
                        <button className="btn btn-ghost btn-icon">🔔</button>
                        <div className="header-user">
                            <div className="header-avatar">
                                {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                {user.name}
                            </span>
                        </div>
                    </div>
                </header>

                <div ref={mainRef} key={pathname}>
                    {children}
                </div>
            </main>
        </div>
    );
}
