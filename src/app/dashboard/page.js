'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import anime from 'animejs';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const statsRef = useRef(null);
    const cardsRef = useRef([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        if (stats && statsRef.current) {
            // Animación de entrada de las cards
            anime({
                targets: '.stat-card',
                opacity: [0, 1],
                translateY: [30, 0],
                scale: [0.9, 1],
                delay: anime.stagger(100),
                duration: 600,
                easing: 'easeOutBack',
            });

            // Animar contadores
            document.querySelectorAll('.stat-value[data-value]').forEach((el) => {
                const value = parseFloat(el.dataset.value);
                const prefix = el.dataset.prefix || '';
                const suffix = el.dataset.suffix || '';
                const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;

                const obj = { value: 0 };
                anime({
                    targets: obj,
                    value,
                    round: decimals === 0 ? 1 : 10,
                    duration: 1500,
                    easing: 'easeOutExpo',
                    update: () => {
                        el.textContent = prefix + obj.value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + suffix;
                    },
                });
            });

            // Animar tablas
            anime({
                targets: '.table tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(50, { start: 500 }),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [stats]);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/dashboard');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
        }).format(value || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', label: 'Pendiente' },
            paid: { class: 'badge-success', label: 'Pagada' },
            cancelled: { class: 'badge-danger', label: 'Cancelada' },
        };
        return badges[status] || { class: 'badge-info', label: status };
    };

    if (loading) {
        return (
            <div className="page-body">
                <div className="stats-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card">
                            <div className="skeleton" style={{ width: '48px', height: '48px', marginBottom: '1rem' }}></div>
                            <div className="skeleton" style={{ width: '60%', height: '2rem', marginBottom: '0.5rem' }}></div>
                            <div className="skeleton" style={{ width: '40%', height: '1rem' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p className="text-secondary">Resumen de tu sistema de inventario</p>
            </div>

            <div className="page-body">
                {/* Estadísticas principales */}
                <div className="stats-grid" ref={statsRef}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            📦
                        </div>
                        <div
                            className="stat-value"
                            data-value={stats?.products?.active || 0}
                        >
                            0
                        </div>
                        <div className="stat-label">Productos Activos</div>
                        <span className="stat-change positive">
                            +{stats?.products?.total || 0} total
                        </span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                            💰
                        </div>
                        <div
                            className="stat-value"
                            data-value={stats?.invoices?.paid_amount || 0}
                            data-prefix="$"
                            data-decimals="2"
                        >
                            $0.00
                        </div>
                        <div className="stat-label">Ventas del Mes</div>
                        <span className="stat-change positive">
                            {stats?.invoices?.paid || 0} facturas pagadas
                        </span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                            📋
                        </div>
                        <div
                            className="stat-value"
                            data-value={stats?.inventory?.total_items || 0}
                        >
                            0
                        </div>
                        <div className="stat-label">Items en Stock</div>
                        {(stats?.inventory?.low_stock > 0 || stats?.inventory?.out_of_stock > 0) && (
                            <span className="stat-change negative">
                                ⚠️ {(stats?.inventory?.low_stock || 0) + (stats?.inventory?.out_of_stock || 0)} alertas
                            </span>
                        )}
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
                            👥
                        </div>
                        <div
                            className="stat-value"
                            data-value={stats?.clients?.total || 0}
                        >
                            0
                        </div>
                        <div className="stat-label">Clientes</div>
                        <span className="stat-change positive">
                            Registrados
                        </span>
                    </div>
                </div>

                {/* Contenido secundario */}
                <div className="grid grid-cols-2 gap-lg mt-xl" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    {/* Últimas facturas */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Últimas Facturas</h3>
                            <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">
                                Ver todas →
                            </Link>
                        </div>
                        <div className="table-container" style={{ border: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Factura</th>
                                        <th>Cliente</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.recentInvoices?.length > 0 ? (
                                        stats.recentInvoices.map((invoice) => {
                                            const badge = getStatusBadge(invoice.status);
                                            return (
                                                <tr key={invoice.id}>
                                                    <td>
                                                        <Link href={`/dashboard/invoices/${invoice.id}`} className="text-primary">
                                                            {invoice.invoice_number}
                                                        </Link>
                                                    </td>
                                                    <td>{invoice.client_name || 'Sin cliente'}</td>
                                                    <td>{formatCurrency(invoice.total)}</td>
                                                    <td>
                                                        <span className={`badge ${badge.class}`}>{badge.label}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                                No hay facturas aún
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Productos con stock bajo */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">⚠️ Stock Bajo</h3>
                            <Link href="/dashboard/inventory" className="btn btn-ghost btn-sm">
                                Ver inventario →
                            </Link>
                        </div>
                        <div className="table-container" style={{ border: 'none' }}>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Producto</th>
                                        <th>Stock</th>
                                        <th>Mínimo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.lowStockProducts?.length > 0 ? (
                                        stats.lowStockProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <code style={{ fontSize: '0.8rem' }}>{product.code}</code>
                                                </td>
                                                <td>{product.name}</td>
                                                <td>
                                                    <span className={product.quantity <= 0 ? 'text-danger' : 'text-warning'}>
                                                        {product.quantity}
                                                    </span>
                                                </td>
                                                <td>{product.min_stock}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                                                ✅ Todo el inventario está en orden
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Acciones rápidas */}
                <div className="card mt-xl">
                    <div className="card-header">
                        <h3 className="card-title">Acciones Rápidas</h3>
                    </div>
                    <div className="flex gap-md" style={{ padding: '0.5rem 0' }}>
                        <Link href="/dashboard/invoices/new" className="btn btn-primary">
                            ➕ Nueva Factura
                        </Link>
                        <Link href="/dashboard/products" className="btn btn-secondary">
                            📦 Agregar Producto
                        </Link>
                        <Link href="/dashboard/clients" className="btn btn-secondary">
                            👤 Nuevo Cliente
                        </Link>
                        <Link href="/dashboard/inventory" className="btn btn-secondary">
                            📋 Ajustar Inventario
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
