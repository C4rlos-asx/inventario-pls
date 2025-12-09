'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import anime from 'animejs';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: '', password: '', name: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const cardRef = useRef(null);
    const formRef = useRef(null);
    const particlesRef = useRef(null);

    useEffect(() => {
        // Animación de entrada
        anime({
            targets: cardRef.current,
            opacity: [0, 1],
            scale: [0.9, 1],
            translateY: [30, 0],
            duration: 800,
            easing: 'easeOutExpo',
        });

        anime({
            targets: '.form-group',
            opacity: [0, 1],
            translateX: [-20, 0],
            delay: anime.stagger(100, { start: 300 }),
            duration: 500,
            easing: 'easeOutCubic',
        });

        // Partículas flotantes
        createParticles();
    }, []);

    useEffect(() => {
        // Animación al cambiar de modo
        anime({
            targets: formRef.current,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 400,
            easing: 'easeOutCubic',
        });
    }, [isLogin]);

    const createParticles = () => {
        const container = particlesRef.current;
        if (!container) return;

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.width = `${Math.random() * 6 + 2}px`;
            particle.style.height = particle.style.width;
            container.appendChild(particle);

            anime({
                targets: particle,
                translateX: () => anime.random(-80, 80),
                translateY: () => anime.random(-80, 80),
                scale: [0.5, anime.random(0.8, 1.5)],
                opacity: [0.2, 0.6, 0.2],
                duration: () => anime.random(4000, 8000),
                loop: true,
                direction: 'alternate',
                easing: 'easeInOutSine',
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en la autenticación');
            }

            // Animación de éxito
            anime({
                targets: cardRef.current,
                scale: [1, 1.02, 1],
                boxShadow: [
                    '0 0 0 0 rgba(16, 185, 129, 0)',
                    '0 0 40px 10px rgba(16, 185, 129, 0.3)',
                    '0 0 0 0 rgba(16, 185, 129, 0)',
                ],
                duration: 600,
                easing: 'easeOutCubic',
            });

            setTimeout(() => {
                router.push('/dashboard');
            }, 400);
        } catch (err) {
            setError(err.message);
            // Animación de error
            anime({
                targets: cardRef.current,
                translateX: [0, -10, 10, -10, 10, 0],
                duration: 500,
                easing: 'easeInOutSine',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="auth-container">
            {/* Gradientes de fondo */}
            <div className="auth-bg-gradient primary"></div>
            <div className="auth-bg-gradient secondary"></div>

            {/* Partículas */}
            <div ref={particlesRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}></div>

            <div ref={cardRef} className="auth-card" style={{ opacity: 0 }}>
                <div className="auth-header">
                    <div className="auth-logo">📦</div>
                    <h1 className="auth-title">
                        {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                    </h1>
                    <p className="auth-subtitle">
                        {isLogin
                            ? 'Ingresa a tu sistema de inventario'
                            : 'Regístrate para comenzar'}
                    </p>
                </div>

                <form ref={formRef} onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label className="form-label">Nombre</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="Tu nombre completo"
                                value={formData.name}
                                onChange={handleChange}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="correo@ejemplo.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="form-error" style={{ marginBottom: '1rem' }}>
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary w-full btn-lg"
                        disabled={loading}
                    >
                        {loading ? (
                            <span className="loading-dots">
                                <span></span><span></span><span></span>
                            </span>
                        ) : (
                            isLogin ? 'Iniciar Sesión' : 'Registrarse'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {isLogin ? (
                        <p>
                            ¿No tienes cuenta?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false); }}>
                                Regístrate aquí
                            </a>
                        </p>
                    ) : (
                        <p>
                            ¿Ya tienes cuenta?{' '}
                            <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true); }}>
                                Inicia sesión
                            </a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
