'use client';

import { useEffect, useState } from 'react';
import anime from 'animejs';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', taxId: '', notes: ''
    });

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (clients.length > 0) {
            anime({
                targets: '.table tbody tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                delay: anime.stagger(50),
                duration: 400,
                easing: 'easeOutCubic',
            });
        }
    }, [clients]);

    const fetchClients = async () => {
        try {
            const res = await fetch(`/api/clients?search=${search}`);
            const data = await res.json();
            setClients(data.clients || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchClients();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const res = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (res.ok) {
            setShowModal(false);
            setFormData({ name: '', email: '', phone: '', address: '', taxId: '', notes: '' });
            fetchClients();

            anime({
                targets: '.table tbody tr:first-child',
                backgroundColor: ['rgba(99, 102, 241, 0.2)', 'transparent'],
                duration: 1500,
                easing: 'easeOutCubic',
            });
        }
    };

    return (
        <>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1>Clientes</h1>
                        <p className="text-secondary">Gestiona tu base de clientes</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        ➕ Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="page-body">
                {/* Búsqueda */}
                <form onSubmit={handleSearch} className="flex gap-md mb-xl">
                    <input
                        type="search"
                        className="form-input"
                        placeholder="Buscar por nombre, email o RIF..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: '400px' }}
                    />
                    <button type="submit" className="btn btn-secondary">Buscar</button>
                </form>

                {/* Estadísticas rápidas */}
                <div className="stats-grid mb-xl" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>👥</div>
                        <div className="stat-value">{clients.length}</div>
                        <div className="stat-label">Total Clientes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>📧</div>
                        <div className="stat-value">{clients.filter(c => c.email).length}</div>
                        <div className="stat-label">Con Email</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>📝</div>
                        <div className="stat-value">{clients.filter(c => c.tax_id).length}</div>
                        <div className="stat-label">Con RIF/NIT</div>
                    </div>
                </div>

                {/* Tabla */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>RIF/NIT</th>
                                <th>Dirección</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        <div className="spinner" style={{ margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : clients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>
                                        No hay clientes. ¡Crea el primero!
                                    </td>
                                </tr>
                            ) : (
                                clients.map((client) => (
                                    <tr key={client.id}>
                                        <td><strong>{client.name}</strong></td>
                                        <td>{client.email || '-'}</td>
                                        <td>{client.phone || '-'}</td>
                                        <td><code>{client.tax_id || '-'}</code></td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {client.address || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop open" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Nuevo Cliente</h2>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
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
                                <div className="grid grid-cols-2 gap-md">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-input"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">RIF/NIT/DNI</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                        placeholder="Ej: J-12345678-9"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Dirección</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notas</label>
                                    <textarea
                                        className="form-input form-textarea"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows="2"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Crear Cliente
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
