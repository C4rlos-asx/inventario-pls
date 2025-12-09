'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import anime from 'animejs';
import api from '@/lib/api';

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const statsRef = useRef([]);
    const cardsRef = useRef(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (data) {
            animateStats();
            animateCards();
        }
    }, [data]);

    const loadDashboard = async () => {
        try {
            const result = await api.getDashboard();
            setData(result);
        } catch (error) {
            console.error('Error cargando dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const animateStats = () => {
        statsRef.current.forEach((el, i) => {
            if (el) {
                anime({
                    targets: el,
                    innerHTML: [0, el.dataset.value],
                    round: 1,
                    duration: 1500,
                    delay: i * 100,
                    easing: 'easeOutExpo',
                });
            }
        });
    };

    const animateCards = () => {
        if (cardsRef.current) {
            anime({
                targets: cardsRef.current.children,
                opacity: [0, 1],
                translateY: [20, 0],
                delay: anime.stagger(100),
                duration: 600,
                easing: 'easeOutExpo',
            });
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const stats = [
        { label: 'Productos', value: data?.stats?.totalProducts || 0, icon: '📦', color: '#6366f1' },
        { label: 'Clientes', value: data?.stats?.totalClients || 0, icon: '👥', color: '#8b5cf6' },
        { label: 'Facturas', value: data?.stats?.totalInvoices || 0, icon: '📄', color: '#ec4899' },
        { label: 'Ingresos', value: data?.stats?.totalRevenue || 0, icon: '💰', color: '#10b981', prefix: '$' },
    ];

    return (
        <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                Dashboard
            </h1>

            {/* Stats Grid */}
            <div ref={cardsRef} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-xl)',
            }}>
                {stats.map((stat, i) => (
                    <div key={stat.label} className="card" style={{
                        padding: 'var(--spacing-lg)',
                        borderLeft: `4px solid ${stat.color}`,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    {stat.label}
                                </p>
                                <p style={{ fontSize: '1.75rem', fontWeight: '700' }}>
                                    {stat.prefix || ''}
                                    <span
                                        ref={el => statsRef.current[i] = el}
                                        data-value={stat.value}
                                    >
                                        0
                                    </span>
                                </p>
                            </div>
                            <span style={{ fontSize: '2rem' }}>{stat.icon}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Data */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 'var(--spacing-lg)',
            }}>
                {/* Low Stock Products */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-md)',
                    }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>⚠️ Stock Bajo</h2>
                        <Link href="/dashboard/inventory" className="btn btn-sm btn-secondary">
                            Ver todo
                        </Link>
                    </div>

                    {data?.lowStockProducts?.length > 0 ? (
                        <div>
                            {data.lowStockProducts.map((product) => (
                                <div key={product.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-sm) 0',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>{product.name}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{product.code}</p>
                                    </div>
                                    <span className="badge badge-warning">{product.quantity} unidades</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                            No hay productos con stock bajo
                        </p>
                    )}
                </div>

                {/* Recent Invoices */}
                <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-md)',
                    }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>📄 Facturas Recientes</h2>
                        <Link href="/dashboard/invoices" className="btn btn-sm btn-secondary">
                            Ver todo
                        </Link>
                    </div>

                    {data?.recentInvoices?.length > 0 ? (
                        <div>
                            {data.recentInvoices.map((invoice) => (
                                <div key={invoice.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    padding: 'var(--spacing-sm) 0',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>{invoice.invoice_number}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {invoice.client_name || 'Cliente general'}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontWeight: '600' }}>${parseFloat(invoice.total).toFixed(2)}</p>
                                        <span className={`badge badge-${invoice.status === 'paid' ? 'success' : 'warning'}`}>
                                            {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                            No hay facturas recientes
                        </p>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 'var(--spacing-xl)' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                    Acciones Rápidas
                </h2>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <Link href="/dashboard/invoices/new" className="btn btn-primary">
                        ➕ Nueva Factura
                    </Link>
                    <Link href="/dashboard/products" className="btn btn-secondary">
                        📦 Gestionar Productos
                    </Link>
                    <Link href="/dashboard/clients" className="btn btn-secondary">
                        👥 Gestionar Clientes
                    </Link>
                </div>
            </div>
        </div>
    );
}
