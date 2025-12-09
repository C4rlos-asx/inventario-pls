'use client';

import { useEffect, useState } from 'react';
import anime from 'animejs';

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustData, setAdjustData] = useState({ quantity: '', type: 'set', notes: '' });

    useEffect(() => {
        fetchInventory();
    }, []);

    useEffect(() => {
        if (inventory.length > 0) {
            anime({
                targets: '.table tbody tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(40),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [inventory, filter]);

    const fetchInventory = async () => {
        try {
            const res = await fetch('/api/inventory');
            const data = await res.json();
            setInventory(data.inventory || []);
            setStats(data.stats || {});
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAdjustModal = (item) => {
        setSelectedProduct(item);
        setAdjustData({ quantity: item.quantity.toString(), type: 'set', notes: '' });
        setShowAdjustModal(true);
    };

    const handleAdjust = async (e) => {
        e.preventDefault();

        const res = await fetch('/api/inventory', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: selectedProduct.product_id,
                quantity: parseInt(adjustData.quantity),
                type: adjustData.type,
                notes: adjustData.notes,
            }),
        });

        if (res.ok) {
            setShowAdjustModal(false);
            fetchInventory();

            // Animación de éxito
            anime({
                targets: '.stat-card',
                scale: [1, 1.02, 1],
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    };

    const filteredInventory = filter === 'all'
        ? inventory
        : inventory.filter(item => item.status === filter);

    const getStatusBadge = (status) => {
        const badges = {
            in_stock: { class: 'badge-success', label: 'En stock' },
            low_stock: { class: 'badge-warning', label: 'Stock bajo' },
            out_of_stock: { class: 'badge-danger', label: 'Sin stock' },
        };
        return badges[status] || badges.in_stock;
    };

    return (
        <>
            <div className="page-header">
                <h1>Inventario</h1>
                <p className="text-secondary">Control de stock y movimientos</p>
            </div>

            <div className="page-body">
                {/* Estadísticas */}
                <div className="stats-grid mb-xl">
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>📦</div>
                        <div className="stat-value">{stats.total || 0}</div>
                        <div className="stat-label">Total Productos</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>✅</div>
                        <div className="stat-value">{stats.inStock || 0}</div>
                        <div className="stat-label">En Stock</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>⚠️</div>
                        <div className="stat-value">{stats.lowStock || 0}</div>
                        <div className="stat-label">Stock Bajo</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #f87171)' }}>❌</div>
                        <div className="stat-value">{stats.outOfStock || 0}</div>
                        <div className="stat-label">Sin Stock</div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="flex gap-md mb-lg">
                    {[
                        { value: 'all', label: 'Todos' },
                        { value: 'in_stock', label: 'En Stock' },
                        { value: 'low_stock', label: 'Stock Bajo' },
                        { value: 'out_of_stock', label: 'Sin Stock' },
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
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Cantidad</th>
                                <th>Mínimo</th>
                                <th>Ubicación</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No hay productos en esta categoría
                                    </td>
                                </tr>
                            ) : (
                                filteredInventory.map((item) => {
                                    const badge = getStatusBadge(item.status);
                                    return (
                                        <tr key={item.id}>
                                            <td><code>{item.product_code}</code></td>
                                            <td>{item.product_name}</td>
                                            <td>{item.category_name || '-'}</td>
                                            <td>
                                                <strong className={item.quantity <= item.min_stock ? 'text-warning' : ''}>
                                                    {item.quantity}
                                                </strong>
                                            </td>
                                            <td>{item.min_stock}</td>
                                            <td>{item.location || '-'}</td>
                                            <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                                            <td>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    onClick={() => openAdjustModal(item)}
                                                >
                                                    📝 Ajustar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Valor total del inventario */}
                <div className="card mt-xl">
                    <div className="flex justify-between items-center">
                        <span className="text-secondary">Valor total del inventario:</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                            ${parseFloat(stats.totalValue || 0).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal de ajuste */}
            {showAdjustModal && (
                <div className="modal-backdrop open" onClick={() => setShowAdjustModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Ajustar Stock</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowAdjustModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAdjust}>
                            <div className="modal-body">
                                <p className="mb-lg">
                                    <strong>{selectedProduct?.product_name}</strong><br />
                                    <span className="text-secondary">Stock actual: {selectedProduct?.quantity}</span>
                                </p>

                                <div className="form-group">
                                    <label className="form-label">Tipo de ajuste</label>
                                    <select
                                        className="form-input form-select"
                                        value={adjustData.type}
                                        onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                                    >
                                        <option value="set">Establecer cantidad</option>
                                        <option value="add">Agregar al stock</option>
                                        <option value="subtract">Restar del stock</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Cantidad</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={adjustData.quantity}
                                        onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                                        required
                                        min="0"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Notas (opcional)</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={adjustData.notes}
                                        onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                                        rows="2"
                                        placeholder="Motivo del ajuste..."
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAdjustModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar Ajuste
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
