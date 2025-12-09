'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadInvoices();
    }, [filter]);

    const loadInvoices = async () => {
        try {
            const result = await api.getInvoices({ status: filter });
            setInvoices(result.invoices || []);
            setStats(result.stats || {});
        } catch (error) {
            console.error('Error cargando facturas:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.updateInvoiceStatus(id, status);
            loadInvoices();
        } catch (error) {
            alert(error.message);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Facturas</h1>
                <Link href="/dashboard/invoices/new" className="btn btn-primary">
                    ➕ Nueva Factura
                </Link>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.total || 0}</p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pendientes</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{stats.pending || 0}</p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pagadas</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>{stats.paid || 0}</p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Ingresos</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>${parseFloat(stats.total_paid || 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Filter */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <select
                    className="form-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">Todas</option>
                    <option value="pending">Pendientes</option>
                    <option value="paid">Pagadas</option>
                    <option value="cancelled">Canceladas</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice) => (
                            <tr key={invoice.id}>
                                <td>
                                    <Link href={`/dashboard/invoices/${invoice.id}`} style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>
                                        {invoice.invoice_number}
                                    </Link>
                                </td>
                                <td>{invoice.client_name || 'Cliente general'}</td>
                                <td>{new Date(invoice.created_at).toLocaleDateString()}</td>
                                <td style={{ fontWeight: '600' }}>${parseFloat(invoice.total).toFixed(2)}</td>
                                <td>
                                    <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'}`}>
                                        {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/dashboard/invoices/${invoice.id}`} className="btn btn-sm btn-secondary">
                                            👁️
                                        </Link>
                                        {invoice.status === 'pending' && (
                                            <>
                                                <button className="btn btn-sm btn-success" onClick={() => updateStatus(invoice.id, 'paid')}>
                                                    ✓
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => updateStatus(invoice.id, 'cancelled')}>
                                                    ✗
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {invoices.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        No hay facturas
                    </div>
                )}
            </div>
        </div>
    );
}
