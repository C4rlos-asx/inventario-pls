'use client';

import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import api from '@/lib/api';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', categoryId: '', price: '', cost: '', taxRate: '0', initialStock: '0'
    });
    const tableRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (products.length > 0 && tableRef.current) {
            anime({
                targets: tableRef.current.querySelectorAll('tr'),
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(50),
                duration: 400,
                easing: 'easeOutExpo',
            });
        }
    }, [products]);

    const loadData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                api.getProducts({ search }),
                api.getCategories(),
            ]);
            setProducts(productsRes.products || []);
            setCategories(categoriesRes.categories || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        // Debounce search
        setTimeout(() => loadData(), 300);
    };

    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                code: product.code,
                name: product.name,
                description: product.description || '',
                categoryId: product.category_id || '',
                price: product.price,
                cost: product.cost || '',
                taxRate: product.tax_rate || '0',
                initialStock: '0',
            });
        } else {
            setEditingProduct(null);
            setFormData({ code: '', name: '', description: '', categoryId: '', price: '', cost: '', taxRate: '0', initialStock: '0' });
        }
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.updateProduct(editingProduct.id, formData);
            } else {
                await api.createProduct(formData);
            }
            closeModal();
            loadData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            try {
                await api.deleteProduct(id);
                loadData();
            } catch (error) {
                alert(error.message);
            }
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
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Productos</h1>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    ➕ Nuevo Producto
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={handleSearch}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            {/* Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <table className="table" ref={tableRef}>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Precio</th>
                            <th>Stock</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td><code>{product.code}</code></td>
                                <td>{product.name}</td>
                                <td>
                                    {product.category_name && (
                                        <span className="badge" style={{ background: product.category_color || 'var(--accent-primary)' }}>
                                            {product.category_name}
                                        </span>
                                    )}
                                </td>
                                <td>${parseFloat(product.price).toFixed(2)}</td>
                                <td>
                                    <span className={`badge badge-${product.stock_status === 'in_stock' ? 'success' : product.stock_status === 'low_stock' ? 'warning' : 'danger'}`}>
                                        {product.stock} unidades
                                    </span>
                                </td>
                                <td>
                                    <button className="btn btn-sm btn-secondary" onClick={() => openModal(product)} style={{ marginRight: '0.5rem' }}>
                                        ✏️
                                    </button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(product.id)}>
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
                        No hay productos
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div ref={modalRef} className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>

                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Código</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        required
                                        disabled={!!editingProduct}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nombre</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    className="form-input"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Categoría</label>
                                <select
                                    className="form-input"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                >
                                    <option value="">Sin categoría</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Precio</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Costo</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">IVA %</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.taxRate}
                                        onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                    />
                                </div>
                            </div>

                            {!editingProduct && (
                                <div className="form-group">
                                    <label className="form-label">Stock Inicial</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={formData.initialStock}
                                        onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
