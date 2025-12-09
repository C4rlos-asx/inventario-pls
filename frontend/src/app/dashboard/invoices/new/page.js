'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewInvoicePage() {
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clientId, setClientId] = useState('');
    const [items, setItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, productsRes] = await Promise.all([
                api.getClients(),
                api.getProducts(),
            ]);
            setClients(clientsRes.clients || []);
            setProducts(productsRes.products || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value) => {
        setSearch(value);
        if (value.length > 1) {
            const results = products.filter(p =>
                p.name.toLowerCase().includes(value.toLowerCase()) ||
                p.code.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(results.slice(0, 5));
        } else {
            setSearchResults([]);
        }
    };

    const addItem = (product) => {
        const existing = items.find(i => i.productId === product.id);
        if (existing) {
            setItems(items.map(i =>
                i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
            ));
        } else {
            setItems([...items, {
                productId: product.id,
                name: product.name,
                code: product.code,
                price: parseFloat(product.price),
                taxRate: parseFloat(product.tax_rate || 0),
                quantity: 1,
            }]);
        }
        setSearch('');
        setSearchResults([]);
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            setItems(items.filter(i => i.productId !== productId));
        } else {
            setItems(items.map(i =>
                i.productId === productId ? { ...i, quantity } : i
            ));
        }
    };

    const removeItem = (productId) => {
        setItems(items.filter(i => i.productId !== productId));
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let tax = 0;

        items.forEach(item => {
            const itemSubtotal = item.price * item.quantity;
            const itemTax = itemSubtotal * (item.taxRate / 100);
            subtotal += itemSubtotal;
            tax += itemTax;
        });

        return { subtotal, tax, total: subtotal + tax };
    };

    const handleSubmit = async () => {
        if (items.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }

        try {
            const result = await api.createInvoice({
                clientId: clientId || null,
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                notes,
            });

            router.push(`/dashboard/invoices/${result.invoice.id}`);
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

    const totals = calculateTotals();

    return (
        <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                Nueva Factura
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-lg)' }}>
                {/* Left Column - Products */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                            Agregar Productos
                        </h2>

                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Buscar producto por nombre o código..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            {searchResults.length > 0 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    marginTop: '4px',
                                    zIndex: 10,
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                }}>
                                    {searchResults.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => addItem(product)}
                                            style={{
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--border-color)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = 'var(--bg-secondary)'}
                                            onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                        >
                                            <div>
                                                <span style={{ fontWeight: '500' }}>{product.name}</span>
                                                <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>({product.code})</span>
                                            </div>
                                            <span style={{ fontWeight: '600' }}>${parseFloat(product.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
                            Items de la Factura
                        </h2>

                        {items.length > 0 ? (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>Precio</th>
                                        <th>Cantidad</th>
                                        <th>Subtotal</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map(item => (
                                        <tr key={item.productId}>
                                            <td>
                                                <div>
                                                    <p style={{ fontWeight: '500' }}>{item.name}</p>
                                                    <code style={{ fontSize: '0.75rem' }}>{item.code}</code>
                                                </div>
                                            </td>
                                            <td>${item.price.toFixed(2)}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>
                                                        -
                                                    </button>
                                                    <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                                    <button className="btn btn-sm btn-secondary" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>
                                                        +
                                                    </button>
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '600' }}>${(item.price * item.quantity).toFixed(2)}</td>
                                            <td>
                                                <button className="btn btn-sm btn-danger" onClick={() => removeItem(item.productId)}>
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--spacing-lg)' }}>
                                No hay productos agregados
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column - Summary */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-lg)', position: 'sticky', top: 'var(--spacing-lg)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)' }}>
                            Resumen
                        </h2>

                        <div className="form-group">
                            <label className="form-label">Cliente</label>
                            <select
                                className="form-input"
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                            >
                                <option value="">Cliente general</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notas</label>
                            <textarea
                                className="form-input"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder="Notas opcionales..."
                            />
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Subtotal:</span>
                                <span>${totals.subtotal.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>IVA:</span>
                                <span>${totals.tax.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--border-color)' }}>
                                <span>Total:</span>
                                <span>${totals.total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                            onClick={handleSubmit}
                            disabled={items.length === 0}
                        >
                            Crear Factura
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
