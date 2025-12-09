'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import anime from 'animejs';

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoice();
    }, [params.id]);

    useEffect(() => {
        if (invoice) {
            anime({
                targets: '.invoice-preview',
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 600,
                easing: 'easeOutCubic',
            });
        }
    }, [invoice]);

    const fetchInvoice = async () => {
        try {
            const res = await fetch(`/api/invoices/${params.id}`);
            const data = await res.json();
            setInvoice(data.invoice);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (status) => {
        if (!confirm(`¿Marcar factura como ${status}?`)) return;

        await fetch(`/api/invoices/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });

        fetchInvoice();
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
            month: 'long',
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
            <div className="page-body" style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="page-body" style={{ textAlign: 'center', padding: '4rem' }}>
                <h2>Factura no encontrada</h2>
                <Link href="/dashboard/invoices" className="btn btn-primary mt-lg">
                    Volver a Facturas
                </Link>
            </div>
        );
    }

    const badge = getStatusBadge(invoice.status);

    return (
        <>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>{invoice.invoice_number}</h1>
                        <p className="text-secondary">
                            Creada el {formatDate(invoice.created_at)} por {invoice.created_by}
                        </p>
                    </div>
                    <div className="flex gap-md">
                        <span className={`badge ${badge.class}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                            {badge.label}
                        </span>
                        {invoice.status === 'pending' && (
                            <>
                                <button className="btn btn-success" onClick={() => updateStatus('paid')}>
                                    ✅ Marcar Pagada
                                </button>
                                <button className="btn btn-danger" onClick={() => updateStatus('cancelled')}>
                                    ❌ Cancelar
                                </button>
                            </>
                        )}
                        <button className="btn btn-secondary" onClick={() => window.print()}>
                            🖨️ Imprimir
                        </button>
                    </div>
                </div>
            </div>

            <div className="page-body">
                <div className="invoice-preview" style={{ opacity: 0 }}>
                    {/* Encabezado */}
                    <div className="invoice-header">
                        <div>
                            <div className="invoice-company">📦 InventoryPro</div>
                            <p style={{ color: '#666', marginTop: '0.5rem' }}>
                                Sistema de Inventario y Facturación
                            </p>
                        </div>
                        <div className="invoice-number">
                            <h2>{invoice.invoice_number}</h2>
                            <p style={{ color: '#666' }}>Fecha: {formatDate(invoice.created_at)}</p>
                            {invoice.due_date && (
                                <p style={{ color: '#666' }}>Vence: {formatDate(invoice.due_date)}</p>
                            )}
                        </div>
                    </div>

                    {/* Datos del cliente */}
                    <div className="invoice-details">
                        <div>
                            <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>Facturado a:</h4>
                            {invoice.client_name ? (
                                <>
                                    <p style={{ color: '#333', fontWeight: '600' }}>{invoice.client_name}</p>
                                    {invoice.client_tax_id && <p style={{ color: '#666' }}>RIF/NIT: {invoice.client_tax_id}</p>}
                                    {invoice.client_email && <p style={{ color: '#666' }}>{invoice.client_email}</p>}
                                    {invoice.client_phone && <p style={{ color: '#666' }}>{invoice.client_phone}</p>}
                                    {invoice.client_address && <p style={{ color: '#666' }}>{invoice.client_address}</p>}
                                </>
                            ) : (
                                <p style={{ color: '#666' }}>Cliente General</p>
                            )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>Detalles:</h4>
                            {invoice.payment_method && (
                                <p style={{ color: '#666' }}>Método: {invoice.payment_method}</p>
                            )}
                            <p style={{ color: '#666' }}>Estado: {badge.label}</p>
                            {invoice.paid_at && (
                                <p style={{ color: '#666' }}>Pagada: {formatDate(invoice.paid_at)}</p>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Descripción</th>
                                <th>Cant.</th>
                                <th>Precio Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items?.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.product_code}</td>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatCurrency(item.unit_price)}</td>
                                    <td>{formatCurrency(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totales */}
                    <div className="invoice-totals">
                        <table>
                            <tbody>
                                <tr>
                                    <td>Subtotal:</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td>Impuestos:</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.tax_total)}</td>
                                </tr>
                                {parseFloat(invoice.discount) > 0 && (
                                    <tr>
                                        <td>Descuento:</td>
                                        <td style={{ textAlign: 'right', color: 'green' }}>-{formatCurrency(invoice.discount)}</td>
                                    </tr>
                                )}
                                <tr>
                                    <td className="total">Total:</td>
                                    <td className="total" style={{ textAlign: 'right' }}>{formatCurrency(invoice.total)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Notas */}
                    {invoice.notes && (
                        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
                            <strong>Notas:</strong>
                            <p style={{ color: '#666', marginTop: '0.5rem' }}>{invoice.notes}</p>
                        </div>
                    )}
                </div>

                {/* Acciones adicionales */}
                <div className="flex gap-md mt-xl" style={{ justifyContent: 'center' }}>
                    <Link href="/dashboard/invoices" className="btn btn-secondary">
                        ← Volver a Facturas
                    </Link>
                    <Link href="/dashboard/invoices/new" className="btn btn-primary">
                        ➕ Nueva Factura
                    </Link>
                </div>
            </div>
        </>
    );
}
