'use client';

import { useEffect, useState, useRef } from 'react';
import anime from 'animejs';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', categoryId: '', price: '', cost: '', taxRate: '0', initialStock: '0'
    });
    const modalRef = useRef(null);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (products.length > 0) {
            anime({
                targets: '.table tbody tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(50),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [products]);

    useEffect(() => {
        if (showModal && modalRef.current) {
            anime({
                targets: '.modal-backdrop',
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutCubic',
            });
            anime({
                targets: '.modal',
                scale: [0.9, 1],
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutBack',
            });
        }
    }, [showModal]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products?search=${search}`);
            const data = await res.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data.categories || []);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchProducts();
    };

    const openModal = (product = null) => {
        if (product) {
            setEditProduct(product);
            setFormData({
                code: product.code,
                name: product.name,
                description: product.description || '',
                categoryId: product.category_id || '',
                price: product.price,
                cost: product.cost || '',
                taxRate: product.tax_rate || '0',
                initialStock: product.stock || '0',
            });
        } else {
            setEditProduct(null);
            setFormData({ code: '', name: '', description: '', categoryId: '', price: '', cost: '', taxRate: '0', initialStock: '0' });
        }
        setShowModal(true);
    };

    const closeModal = async () => {
        await anime({
            targets: '.modal',
            scale: [1, 0.9],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInCubic',
        }).finished;
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
        const method = editProduct ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                price: parseFloat(formData.price),
                cost: parseFloat(formData.cost) || 0,
                taxRate: parseFloat(formData.taxRate) || 0,
                initialStock: parseInt(formData.initialStock) || 0,
            }),
        });

        if (res.ok) {
            closeModal();
            fetchProducts();
        }
    };

    const deleteProduct = async (id) => {
        if (!confirm('¿Eliminar este producto?')) return;

        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchProducts();
    };

    const getStockBadge = (status) => {
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1>Productos</h1>
                        <p className="text-secondary">Gestiona tu catálogo de productos</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        ➕ Nuevo Producto
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex gap-md mb-xl">
                    <input
                        type="search"
                        className="form-input"
                        placeholder="Buscar por código o nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                    <button type="submit" className="btn btn-secondary">Buscar</button>
                </form>

                {/* Tabla */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
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
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No hay productos. ¡Crea el primero!
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => {
                                    const badge = getStockBadge(product.stock_status);
                                    return (
                                        <tr key={product.id}>
                                            <td><code>{product.code}</code></td>
                                            <td>{product.name}</td>
                                            <td>
                                                {product.category_name && (
                                                    <span
                                                        className="badge"
                                                        style={{
                                                            background: `${product.category_color}20`,
                                                            color: product.category_color
                                                        }}
                                                    >
                                                        {product.category_name}
                                                    </span>
                                                )}
                                            </td>
                                            <td>${parseFloat(product.price).toFixed(2)}</td>
                                            <td>{product.stock}</td>
                                            <td><span className={`badge ${badge.class}`}>{badge.label}</span></td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btn btn-ghost btn-sm" onClick={() => openModal(product)}>✏️</button>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => deleteProduct(product.id)}>🗑️</button>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop open" onClick={closeModal}>
                    <div className="modal" ref={modalRef} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button className="btn btn-ghost btn-icon" onClick={closeModal}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Código *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            required
                                            disabled={!!editProduct}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Categoría</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                        >
                                            <option value="">Sin categoría</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nombre *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Descripción</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Precio *</label>
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
                                </div>
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">% Impuesto</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-input"
                                            value={formData.taxRate}
                                            onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                                        />
                                    </div>
                                    {!editProduct && (
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
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editProduct ? 'Guardar Cambios' : 'Crear Producto'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
