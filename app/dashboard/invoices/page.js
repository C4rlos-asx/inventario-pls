'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import anime from 'animejs';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [filter]);

    useEffect(() => {
        if (invoices.length > 0) {
            anime({
                targets: '.table tbody tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(50),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [invoices]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.append('status', filter);

            const res = await fetch(`/api/invoices?${params}`);
            const data = await res.json();
            setInvoices(data.invoices || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        if (!confirm(`¿Marcar factura como ${status}?`)) return;

        await fetch(`/api/invoices/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });

        fetchInvoices();
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', label: 'Pendiente' },
            paid: { class: 'badge-success', label: 'Pagada' },
            cancelled: { class: 'badge-danger', label: 'Cancelada' },
            partial: { class: 'badge-info', label: 'Parcial' },
        };
        return badges[status] || { class: 'badge-info', label: status };
    };

    return (
        <>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>Facturas</h1>
                        <p className="text-secondary">Gestiona y consulta todas las facturas</p>
                    </div>
                    <Link href="/dashboard/invoices/new" className="btn btn-primary">
                        ➕ Nueva Factura
                    </Link>
                </div>
            </div>

            <div className="page-body">
                {/* Estadísticas */}
                <div className="stats-grid mb-xl">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>🧾</div>
                        <div className="stat-value">{stats.total || 0}</div>
                        <div className="stat-label">Total Facturas</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>💰</div>
                        <div className="stat-value">{formatCurrency(stats.paid_amount)}</div>
                        <div className="stat-label">Cobrado</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>⏳</div>
                        <div className="stat-value">{formatCurrency(stats.pending_amount)}</div>
                        <div className="stat-label">Pendiente</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>📊</div>
                        <div className="stat-value">{formatCurrency(stats.total_amount)}</div>
                        <div className="stat-label">Total Facturado</div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-md mb-lg">
                    {[
                        { value: '', label: 'Todas' },
                        { value: 'pending', label: 'Pendientes' },
                        { value: 'paid', label: 'Pagadas' },
                        { value: 'cancelled', label: 'Canceladas' },
                    ].map((f) => (
                        <button
                            key={f.value}
                            className={`btn ${filter === f.value ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter(f.value)}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Tabla */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Factura</th>
                                <th>Cliente</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No hay facturas. ¡Crea la primera!
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => {
                                    const badge = getStatusBadge(invoice.status);
                                    return (
                                        <tr key={invoice.id}>
                                            <td>
                                                <Link href={`/dashboard/invoices/${invoice.id}`} className="text-primary">
                                                    <strong>{invoice.invoice_number}</strong>
                                                </Link>
                                            </td>
                                            <td>{invoice.client_name || 'Sin cliente'}</td>
                                            <td>{invoice.items_count} items</td>
                                            <td><strong>{formatCurrency(invoice.total)}</strong></td>
                                            <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                                            <td>{formatDate(invoice.created_at)}</td>
                                            <td>
                                                <div className="table-actions">
                                                    <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-ghost btn-sm">
                                                        👁️
                                                    </Link>
                                                    {invoice.status === 'pending' && (
                                                        <>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => updateStatus(invoice.id, 'paid')}
                                                            >
                                                                ✅
                                                            </button>
                                                            <button
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => updateStatus(invoice.id, 'cancelled')}
                                                            >
                                                                ❌
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
