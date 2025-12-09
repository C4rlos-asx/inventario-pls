'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInvoice();
    }, [params.id]);

    const loadInvoice = async () => {
        try {
            const result = await api.getInvoice(params.id);
            setInvoice(result.invoice);
            setItems(result.items || []);
        } catch (error) {
            console.error('Error cargando factura:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        try {
            await api.updateInvoiceStatus(params.id, status);
            loadInvoice();
        } catch (error) {
            alert(error.message);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    if (!invoice) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Factura no encontrada</h2>
                <Link href="/dashboard/invoices" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Volver a Facturas
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <Link href="/dashboard/invoices" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                        ← Volver a Facturas
                    </Link>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginTop: '0.5rem' }}>
                        {invoice.invoice_number}
                    </h1>
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <button className="btn btn-secondary" onClick={handlePrint}>
                        🖨️ Imprimir
                    </button>
                    {invoice.status === 'pending' && (
                        <>
                            <button className="btn btn-success" onClick={() => updateStatus('paid')}>
                                ✓ Marcar Pagada
                            </button>
                            <button className="btn btn-danger" onClick={() => updateStatus('cancelled')}>
                                ✗ Cancelar
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>FACTURA</h2>
                        <p style={{ color: 'var(--text-muted)' }}>{invoice.invoice_number}</p>
                        <p style={{ color: 'var(--text-muted)' }}>
                            Fecha: {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'danger'}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {invoice.status === 'paid' ? 'PAGADA' : invoice.status === 'pending' ? 'PENDIENTE' : 'CANCELADA'}
                        </span>
                    </div>
                </div>

                {/* Client Info */}
                <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        CLIENTE
                    </h3>
                    <p style={{ fontWeight: '600' }}>{invoice.client_name || 'Cliente general'}</p>
                    {invoice.client_email && <p>{invoice.client_email}</p>}
                    {invoice.client_phone && <p>{invoice.client_phone}</p>}
                    {invoice.client_address && <p>{invoice.client_address}</p>}
                </div>

                {/* Items */}
                <table className="table" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th style={{ textAlign: 'right' }}>Precio</th>
                            <th style={{ textAlign: 'center' }}>Cantidad</th>
                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>
                                    <p style={{ fontWeight: '500' }}>{item.product_name}</p>
                                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.product_code}</code>
                                </td>
                                <td style={{ textAlign: 'right' }}>${parseFloat(item.unit_price).toFixed(2)}</td>
                                <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                <td style={{ textAlign: 'right', fontWeight: '600' }}>
                                    ${(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: '250px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Subtotal:</span>
                            <span>${parseFloat(invoice.subtotal).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>IVA:</span>
                            <span>${parseFloat(invoice.tax).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', paddingTop: '0.5rem', borderTop: '2px solid var(--border-color)' }}>
                            <span>Total:</span>
                            <span>${parseFloat(invoice.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                            NOTAS
                        </h3>
                        <p>{invoice.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
