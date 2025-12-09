'use client';

import { useState, useEffect, useRef } from 'react';
import anime from 'animejs';
import api from '@/lib/api';

export default function ClientsPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', documentType: '', documentNumber: ''
    });
    const modalRef = useRef(null);

    useEffect(() => {
        loadClients();
    }, [search]);

    const loadClients = async () => {
        try {
            const result = await api.getClients({ search });
            setClients(result.clients || []);
        } catch (error) {
            console.error('Error cargando clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setFormData({ name: '', email: '', phone: '', address: '', documentType: '', documentNumber: '' });
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
            await api.createClient(formData);
            closeModal();
            loadClients();
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
                <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Clientes</h1>
                <button className="btn btn-primary" onClick={openModal}>
                    ➕ Nuevo Cliente
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar clientes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                {clients.map((client) => (
                    <div key={client.id} className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'var(--gradient-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                            }}>
                                👤
                            </div>
                            <div>
                                <h3 style={{ fontWeight: '600' }}>{client.name}</h3>
                                {client.document_number && (
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        {client.document_type}: {client.document_number}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {client.email && (
                                <p style={{ marginBottom: '0.25rem' }}>📧 {client.email}</p>
                            )}
                            {client.phone && (
                                <p style={{ marginBottom: '0.25rem' }}>📱 {client.phone}</p>
                            )}
                            {client.address && (
                                <p style={{ marginBottom: '0.25rem' }}>📍 {client.address}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {clients.length === 0 && (
                <div className="card" style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No hay clientes registrados
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div ref={modalRef} className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Nuevo Cliente</h2>

                        <form onSubmit={handleSubmit}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
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
                                <label className="form-label">Dirección</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">Tipo Documento</label>
                                    <select
                                        className="form-input"
                                        value={formData.documentType}
                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                    >
                                        <option value="">Seleccionar</option>
                                        <option value="DNI">DNI</option>
                                        <option value="RUC">RUC</option>
                                        <option value="Pasaporte">Pasaporte</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Número Documento</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.documentNumber}
                                        onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
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
        </div>
    );
}
