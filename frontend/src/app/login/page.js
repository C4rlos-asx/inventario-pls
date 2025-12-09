'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import anime from 'animejs';
import api from '@/lib/api';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const formRef = useRef(null);
    const particlesRef = useRef(null);

    useEffect(() => {
        // Verificar si ya está autenticado
        const token = api.getToken();
        if (token) {
            api.getMe()
                .then(() => router.push('/dashboard'))
                .catch(() => api.removeToken());
        }

        // Animación de entrada
        anime({
            targets: formRef.current,
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 800,
            easing: 'easeOutExpo',
        });

        // Crear partículas flotantes
        createParticles();
    }, []);

    const createParticles = () => {
        if (!particlesRef.current) return;

        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
        position: absolute;
        width: ${Math.random() * 4 + 2}px;
        height: ${Math.random() * 4 + 2}px;
        background: rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
      `;
            particlesRef.current.appendChild(particle);

            anime({
                targets: particle,
                translateX: () => anime.random(-100, 100),
                translateY: () => anime.random(-100, 100),
                scale: [1, anime.random(0.5, 1.5)],
                opacity: [0.5, 0],
                duration: anime.random(3000, 6000),
                loop: true,
                easing: 'easeInOutSine',
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await api.login(formData.email, formData.password);
            } else {
                await api.register(formData.name, formData.email, formData.password);
            }

            // Animación de éxito y redirección
            anime({
                targets: formRef.current,
                scale: [1, 0.95],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInExpo',
                complete: () => router.push('/dashboard'),
            });
        } catch (err) {
            setError(err.message || 'Error al procesar la solicitud');

            // Animación de error
            anime({
                targets: formRef.current,
                translateX: [-10, 10, -10, 10, 0],
                duration: 400,
                easing: 'easeInOutSine',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        anime({
            targets: formRef.current,
            rotateY: [0, 90],
            duration: 200,
            easing: 'easeInExpo',
            complete: () => {
                setIsLogin(!isLogin);
                setError('');
                anime({
                    targets: formRef.current,
                    rotateY: [90, 0],
                    duration: 200,
                    easing: 'easeOutExpo',
                });
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <div ref={particlesRef} style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
            }} />

            <div ref={formRef} className="card" style={{
                width: '100%',
                maxWidth: '400px',
                padding: 'var(--spacing-xl)',
                position: 'relative',
                zIndex: 10,
            }}>
                <div className="text-center mb-6">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--spacing-md)',
                        fontSize: '24px',
                    }}>
                        💼
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {isLogin ? 'Bienvenido de vuelta' : 'Regístrate para comenzar'}
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Tu nombre completo"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="tu@email.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: 'var(--spacing-sm)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                            marginBottom: 'var(--spacing-md)',
                        }}>
                            ⚠ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: 'var(--spacing-md)' }}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
                    </button>
                </form>

                <p style={{
                    textAlign: 'center',
                    marginTop: 'var(--spacing-lg)',
                    color: 'var(--text-muted)',
                    fontSize: '0.875rem',
                }}>
                    {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                    <button
                        type="button"
                        onClick={toggleMode}
                        style={{
                            color: 'var(--accent-primary)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                        }}
                    >
                        {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                    </button>
                </p>
            </div>
        </div>
    );
}
