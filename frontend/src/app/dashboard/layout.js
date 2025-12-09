'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import anime from 'animejs';
import api from '@/lib/api';

export default function DashboardLayout({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const sidebarRef = useRef(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (sidebarRef.current) {
            anime({
                targets: sidebarRef.current,
                translateX: sidebarOpen ? 0 : -280,
                duration: 300,
                easing: 'easeOutExpo',
            });
        }
    }, [sidebarOpen]);

    const checkAuth = async () => {
        try {
            const token = api.getToken();
            if (!token) {
                router.push('/login');
                return;
            }

            const data = await api.getMe();
            setUser(data.user);
        } catch (error) {
            api.removeToken();
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await api.logout();
        router.push('/login');
    };

    const menuItems = [
        { href: '/dashboard', label: 'Dashboard', icon: '📊' },
        { href: '/dashboard/products', label: 'Productos', icon: '📦' },
        { href: '/dashboard/inventory', label: 'Inventario', icon: '🏷️' },
        { href: '/dashboard/invoices', label: 'Facturas', icon: '📄' },
        { href: '/dashboard/clients', label: 'Clientes', icon: '👥' },
    ];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                background: 'var(--bg-primary)',
            }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className="sidebar"
                style={{
                    width: '280px',
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'fixed',
                    height: '100vh',
                    zIndex: 100,
                }}
            >
                <div style={{
                    padding: 'var(--spacing-lg)',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--gradient-primary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                        }}>
                            💼
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '1.25rem' }}>Inventario</span>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: 'var(--spacing-md)', overflowY: 'auto' }}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-xs)',
                                color: pathname === item.href ? 'var(--accent-primary)' : 'var(--text-secondary)',
                                background: pathname === item.href ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div style={{
                    padding: 'var(--spacing-md)',
                    borderTop: '1px solid var(--border-color)',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        marginBottom: 'var(--spacing-md)',
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: 'var(--gradient-secondary)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                        }}>
                            👤
                        </div>
                        <div>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{user?.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.email}</div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main style={{
                flex: 1,
                marginLeft: sidebarOpen ? '280px' : '0',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
            }}>
                {/* Header */}
                <header style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                        }}
                    >
                        ☰
                    </button>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                </header>

                {/* Page content */}
                <div style={{ padding: 'var(--spacing-lg)' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
