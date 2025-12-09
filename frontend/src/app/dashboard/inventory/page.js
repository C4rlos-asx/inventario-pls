'use client';

import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import api from '@/lib/api';

export default function InventoryPage() {
    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [adjustData, setAdjustData] = useState({ quantity: '', movementType: 'adjustment_in', notes: '' });
    const modalRef = useRef(null);

    useEffect(() => {
        loadInventory();
    }, [filter, search]);

    const loadInventory = async () => {
        try {
            const result = await api.getInventory({ status: filter, search });
            setInventory(result.inventory || []);
            setStats(result.stats || {});
        } catch (error) {
            console.error('Error cargando inventario:', error);
        } finally {
            setLoading(false);
        }
    };

    const openAdjustModal = (product) => {
        setSelectedProduct(product);
        setAdjustData({ quantity: '', movementType: 'adjustment_in', notes: '' });
        setShowModal(true);

        setTimeout(() => {
            if (modalRef.current) {
                anime({
                    targets: modalRef.current,
                    opacity: [0, 1],
                    scale: [0.9, 1],
                    duration: 300,
                    easing: 'easeOutExpo',
                });
            }
        }, 10);
    };

    const closeModal = () => {
        anime({
            targets: modalRef.current,
            opacity: 0,
            scale: 0.9,
            duration: 200,
            easing: 'easeInExpo',
            complete: () => setShowModal(false),
        });
    };

    const handleAdjust = async (e) => {
        e.preventDefault();
        try {
            await api.adjustInventory({
                productId: selectedProduct.product_id,
                quantity: parseInt(adjustData.quantity),
                movementType: adjustData.movementType,
                notes: adjustData.notes,
            });
            closeModal();
            loadInventory();
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
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-lg)' }}>
                Inventario
            </h1>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Productos</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.total || 0}</p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Stock Bajo</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>{stats.low_stock || 0}</p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin Stock</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444' }}>{stats.out_of_stock || 0}</p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '250px' }}
                />
                <select
                    className="form-input"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="">Todos</option>
                    <option value="low">Stock Bajo</option>
                    <option value="out">Sin Stock</option>
                </select>
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Cantidad</th>
                            <th>Mín. Stock</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventory.map((item) => (
                            <tr key={item.product_id}>
                                <td>
                                    <div>
                                        <p style={{ fontWeight: '500' }}>{item.product_name}</p>
                                        <code style={{ fontSize: '0.75rem' }}>{item.product_code}</code>
                                    </div>
                                </td>
                                <td>
                                    {item.category_name && (
                                        <span className="badge" style={{ background: item.category_color || 'var(--accent-primary)' }}>
                                            {item.category_name}
                                        </span>
                                    )}
                                </td>
                                <td style={{ fontWeight: '600', fontSize: '1.125rem' }}>{item.quantity}</td>
                                <td>{item.min_stock}</td>
                                <td>
                                    <span className={`badge badge-${item.stock_status === 'in_stock' ? 'success' : item.stock_status === 'low_stock' ? 'warning' : 'danger'}`}>
                                        {item.stock_status === 'in_stock' ? 'OK' : item.stock_status === 'low_stock' ? 'Bajo' : 'Agotado'}
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-primary" onClick={() => openAdjustModal(item)}>
                                        Ajustar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {inventory.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        No hay productos en inventario
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && selectedProduct && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div ref={modalRef} className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Ajustar Stock</h2>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                            {selectedProduct.product_name} - Stock actual: <strong>{selectedProduct.quantity}</strong>
                        </p>

                        <form onSubmit={handleAdjust}>
                            <div className="form-group">
                                <label className="form-label">Tipo de Movimiento</label>
                                <select
                                    className="form-input"
                                    value={adjustData.movementType}
                                    onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value })}
                                >
                                    <option value="adjustment_in">Entrada (Agregar)</option>
                                    <option value="adjustment_out">Salida (Restar)</option>
                                    <option value="set">Establecer cantidad exacta</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cantidad</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="form-input"
                                    value={adjustData.quantity}
                                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Notas</label>
                                <textarea
                                    className="form-input"
                                    value={adjustData.notes}
                                    onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                                    rows={2}
                                    placeholder="Motivo del ajuste..."
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Aplicar Ajuste
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
