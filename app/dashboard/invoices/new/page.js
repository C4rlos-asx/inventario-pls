'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import anime from 'animejs';

export default function NewInvoicePage() {
    const router = useRouter();
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        clientId: '',
        items: [],
        discount: 0,
        discountType: 'fixed',
        notes: '',
        paymentMethod: '',
    });
    const [searchProduct, setSearchProduct] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const itemsRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (searchProduct.length > 1) {
            const filtered = products.filter(
                p => p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
                    p.code.toLowerCase().includes(searchProduct.toLowerCase())
            );
            setFilteredProducts(filtered.slice(0, 5));
        } else {
            setFilteredProducts([]);
        }
    }, [searchProduct, products]);

    const fetchData = async () => {
        const [clientsRes, productsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/products'),
        ]);
        const clientsData = await clientsRes.json();
        const productsData = await productsRes.json();
        setClients(clientsData.clients || []);
        setProducts(productsData.products || []);
    };

    const addItem = (product) => {
        const existing = formData.items.find(i => i.productId === product.id);
        if (existing) {
            setFormData({
                ...formData,
                items: formData.items.map(i =>
                    i.productId === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                ),
            });
        } else {
            const newItem = {
                productId: product.id,
                productCode: product.code,
                productName: product.name,
                quantity: 1,
                unitPrice: parseFloat(product.price),
                taxRate: parseFloat(product.tax_rate) || 0,
                stock: product.stock,
            };
            setFormData({ ...formData, items: [...formData.items, newItem] });

            // Animación
            setTimeout(() => {
                anime({
                    targets: `.invoice-item:last-child`,
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    duration: 400,
                    easing: 'easeOutCubic',
                });
            }, 0);
        }
        setSearchProduct('');
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0;
        setFormData({ ...formData, items: newItems });
    };

    const removeItem = async (index) => {
        anime({
            targets: `.invoice-item:nth-child(${index + 1})`,
            opacity: [1, 0],
            translateX: [0, -20],
            duration: 300,
            easing: 'easeInCubic',
        });

        setTimeout(() => {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }, 300);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let taxTotal = 0;

        formData.items.forEach(item => {
            const itemSubtotal = item.quantity * item.unitPrice;
            const itemTax = (itemSubtotal * item.taxRate) / 100;
            subtotal += itemSubtotal;
            taxTotal += itemTax;
        });

        let discountAmount = 0;
        if (formData.discount) {
            discountAmount = formData.discountType === 'percentage'
                ? (subtotal * formData.discount) / 100
                : formData.discount;
        }

        const total = subtotal + taxTotal - discountAmount;
        return { subtotal, taxTotal, discountAmount, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.items.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: formData.clientId || null,
                    items: formData.items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                    })),
                    discount: formData.discount,
                    discountType: formData.discountType,
                    notes: formData.notes,
                    paymentMethod: formData.paymentMethod,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                // Animación de éxito
                anime({
                    targets: '.card',
                    scale: [1, 1.02, 1],
                    boxShadow: [
                        '0 0 0 rgba(16, 185, 129, 0)',
                        '0 0 40px rgba(16, 185, 129, 0.4)',
                        '0 0 0 rgba(16, 185, 129, 0)',
                    ],
                    duration: 600,
                    easing: 'easeOutCubic',
                });

                setTimeout(() => {
                    router.push(`/dashboard/invoices/${data.invoice.id}`);
                }, 400);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const { subtotal, taxTotal, discountAmount, total } = calculateTotals();

    return (
        <>
            <div className="page-header">
                <h1>Nueva Factura</h1>
                <p className="text-secondary">Crea una nueva factura de venta</p>
            </div>

            <div className="page-body">
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-lg" style={{ gridTemplateColumns: '1fr 400px' }}>
                        {/* Columna principal */}
                        <div>
                            {/* Cliente */}
                            <div className="card mb-lg">
                                <h3 className="card-title mb-md">👤 Cliente</h3>
                                <select
                                    className="form-input form-select"
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                >
                                    <option value="">Cliente general (sin factura)</option>
                                    {clients.map((client) => (
                                        <option key={client.id} value={client.id}>
                                            {client.name} {client.tax_id && `- ${client.tax_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Productos */}
                            <div className="card">
                                <h3 className="card-title mb-md">📦 Productos</h3>

                                {/* Buscador */}
                                <div className="form-group" style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Buscar producto por código o nombre..."
                                        value={searchProduct}
                                        onChange={(e) => setSearchProduct(e.target.value)}
                                    />
                                    {filteredProducts.length > 0 && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                background: 'var(--bg-secondary)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                zIndex: 10,
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                            }}
                                        >
                                            {filteredProducts.map((product) => (
                                                <div
                                                    key={product.id}
                                                    onClick={() => addItem(product)}
                                                    style={{
                                                        padding: 'var(--spacing-md)',
                                                        cursor: 'pointer',
                                                        borderBottom: '1px solid var(--border)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                    }}
                                                    className="hover-bg"
                                                    onMouseEnter={(e) => e.target.style.background = 'var(--bg-glass)'}
                                                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                                >
                                                    <div>
                                                        <strong>{product.name}</strong>
                                                        <br />
                                                        <small className="text-muted">{product.code} - Stock: {product.stock}</small>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <strong>${parseFloat(product.price).toFixed(2)}</strong>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items */}
                                <div ref={itemsRef}>
                                    {formData.items.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                            Busca y agrega productos a la factura
                                        </div>
                                    ) : (
                                        <table className="table" style={{ marginTop: '1rem' }}>
                                            <thead>
                                                <tr>
                                                    <th>Producto</th>
                                                    <th style={{ width: '100px' }}>Cantidad</th>
                                                    <th style={{ width: '120px' }}>Precio</th>
                                                    <th style={{ width: '100px' }}>Subtotal</th>
                                                    <th style={{ width: '50px' }}></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.items.map((item, index) => (
                                                    <tr key={item.productId} className="invoice-item">
                                                        <td>
                                                            <strong>{item.productName}</strong>
                                                            <br />
                                                            <small className="text-muted">{item.productCode}</small>
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                className="form-input"
                                                                style={{ width: '80px', padding: '0.5rem' }}
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                                min="1"
                                                                max={item.stock}
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                className="form-input"
                                                                style={{ width: '100px', padding: '0.5rem' }}
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                                                            />
                                                        </td>
                                                        <td>${(item.quantity * item.unitPrice).toFixed(2)}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-sm"
                                                                onClick={() => removeItem(index)}
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Columna de resumen */}
                        <div>
                            <div className="card" style={{ position: 'sticky', top: '100px' }}>
                                <h3 className="card-title mb-lg">📋 Resumen</h3>

                                {/* Descuento */}
                                <div className="form-group">
                                    <label className="form-label">Descuento</label>
                                    <div className="flex gap-sm">
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.discount}
                                            onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                                            style={{ flex: 1 }}
                                        />
                                        <select
                                            className="form-input form-select"
                                            value={formData.discountType}
                                            onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                                            style={{ width: '100px' }}
                                        >
                                            <option value="fixed">$</option>
                                            <option value="percentage">%</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Método de pago */}
                                <div className="form-group">
                                    <label className="form-label">Método de Pago</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                                    >
                                        <option value="">Sin especificar</option>
                                        <option value="cash">Efectivo</option>
                                        <option value="card">Tarjeta</option>
                                        <option value="transfer">Transferencia</option>
                                        <option value="credit">Crédito</option>
                                    </select>
                                </div>

                                {/* Notas */}
                                <div className="form-group">
                                    <label className="form-label">Notas</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>

                                {/* Totales */}
                                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                                    <div className="flex justify-between mb-sm">
                                        <span>Subtotal:</span>
                                        <span>${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between mb-sm">
                                        <span>Impuestos:</span>
                                        <span>${taxTotal.toFixed(2)}</span>
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between mb-sm text-success">
                                            <span>Descuento:</span>
                                            <span>-${discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between" style={{ fontSize: '1.5rem', fontWeight: '700', marginTop: '1rem' }}>
                                        <span>Total:</span>
                                        <span style={{ color: 'var(--success)' }}>${total.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Botón */}
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg w-full mt-lg"
                                    disabled={loading || formData.items.length === 0}
                                >
                                    {loading ? (
                                        <span className="loading-dots"><span></span><span></span><span></span></span>
                                    ) : (
                                        '✅ Crear Factura'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}
