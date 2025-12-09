import anime from 'animejs';

// =====================================================
// ANIMACIONES DE PÁGINA
// =====================================================

// Animación de entrada de página con fade + slide desde abajo
export function pageEnter(elements, options = {}) {
    const { duration = 800, delay = 0, stagger = 100 } = options;

    return anime({
        targets: elements,
        opacity: [0, 1],
        translateY: [50, 0],
        scale: [0.95, 1],
        duration,
        delay: anime.stagger(stagger, { start: delay }),
        easing: 'easeOutExpo',
    });
}

// Animación de salida de página
export function pageExit(elements, options = {}) {
    const { duration = 400, delay = 0 } = options;

    return anime({
        targets: elements,
        opacity: [1, 0],
        translateY: [0, -30],
        scale: [1, 0.95],
        duration,
        delay,
        easing: 'easeInExpo',
    });
}

// =====================================================
// ANIMACIONES DE CARDS Y LISTAS
// =====================================================

// Animación stagger para cards/items de lista
export function staggerCards(elements, options = {}) {
    const { duration = 600, stagger = 80, from = 'first' } = options;

    return anime({
        targets: elements,
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.9, 1],
        rotateX: [15, 0],
        duration,
        delay: anime.stagger(stagger, { from }),
        easing: 'easeOutBack',
    });
}

// Animación para hover en cards
export function cardHover(element, isHovering) {
    return anime({
        targets: element,
        scale: isHovering ? 1.02 : 1,
        translateY: isHovering ? -5 : 0,
        boxShadow: isHovering
            ? '0 20px 40px rgba(0, 0, 0, 0.3)'
            : '0 4px 6px rgba(0, 0, 0, 0.1)',
        duration: 300,
        easing: 'easeOutCubic',
    });
}

// =====================================================
// ANIMACIONES DE BOTONES
// =====================================================

// Efecto ripple en botón
export function buttonRipple(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);

    anime({
        targets: ripple,
        scale: [0, 4],
        opacity: [0.6, 0],
        duration: 600,
        easing: 'easeOutExpo',
        complete: () => ripple.remove(),
    });
}

// Transformación morph de botón
export function morphButton(element, options = {}) {
    const { width = 'auto', height = 'auto', borderRadius = '8px' } = options;

    return anime({
        targets: element,
        width,
        height,
        borderRadius,
        duration: 400,
        easing: 'easeInOutQuart',
    });
}

// =====================================================
// ANIMACIONES DE MODALES
// =====================================================

// Entrada de modal cinematográfica
export function modalEnter(backdrop, modal) {
    const tl = anime.timeline({ easing: 'easeOutExpo' });

    tl.add({
        targets: backdrop,
        opacity: [0, 1],
        duration: 300,
    })
        .add({
            targets: modal,
            opacity: [0, 1],
            scale: [0.8, 1],
            rotateX: [10, 0],
            duration: 500,
        }, '-=200');

    return tl;
}

// Salida de modal
export function modalExit(backdrop, modal) {
    const tl = anime.timeline({ easing: 'easeInExpo' });

    tl.add({
        targets: modal,
        opacity: [1, 0],
        scale: [1, 0.9],
        duration: 300,
    })
        .add({
            targets: backdrop,
            opacity: [1, 0],
            duration: 200,
        }, '-=100');

    return tl;
}

// =====================================================
// ANIMACIONES DE FORMULARIOS
// =====================================================

// Animación de inputs al aparecer
export function formFieldsEnter(elements) {
    return anime({
        targets: elements,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 500,
        delay: anime.stagger(100),
        easing: 'easeOutCubic',
    });
}

// Shake para errores
export function shakeError(element) {
    return anime({
        targets: element,
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 500,
        easing: 'easeInOutSine',
    });
}

// Animación de éxito
export function successPulse(element) {
    return anime({
        targets: element,
        scale: [1, 1.05, 1],
        borderColor: ['var(--success)', 'var(--success-glow)', 'var(--success)'],
        boxShadow: [
            '0 0 0 0 rgba(16, 185, 129, 0)',
            '0 0 0 15px rgba(16, 185, 129, 0.3)',
            '0 0 0 0 rgba(16, 185, 129, 0)',
        ],
        duration: 600,
        easing: 'easeOutCubic',
    });
}

// =====================================================
// ANIMACIONES DE NÚMEROS Y CONTADORES
// =====================================================

// Contador animado
export function animateCounter(element, endValue, options = {}) {
    const { duration = 1500, prefix = '', suffix = '', decimals = 0 } = options;

    const obj = { value: 0 };

    return anime({
        targets: obj,
        value: endValue,
        round: decimals === 0 ? 1 : Math.pow(10, decimals) / Math.pow(10, decimals),
        duration,
        easing: 'easeOutExpo',
        update: () => {
            element.textContent = prefix + obj.value.toFixed(decimals) + suffix;
        },
    });
}

// =====================================================
// ANIMACIONES DE NOTIFICACIONES
// =====================================================

// Toast notification
export function toastEnter(element, position = 'top-right') {
    const translateX = position.includes('right') ? 100 : -100;

    return anime({
        targets: element,
        translateX: [translateX, 0],
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 500,
        easing: 'easeOutBack',
    });
}

export function toastExit(element, position = 'top-right') {
    const translateX = position.includes('right') ? 100 : -100;

    return anime({
        targets: element,
        translateX: [0, translateX],
        opacity: [1, 0],
        duration: 400,
        easing: 'easeInCubic',
    });
}

// =====================================================
// ANIMACIONES DECORATIVAS
// =====================================================

// Partículas flotantes
export function floatingParticles(container, count = 20) {
    const particles = [];

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        container.appendChild(particle);
        particles.push(particle);
    }

    particles.forEach((particle, i) => {
        anime({
            targets: particle,
            translateX: () => anime.random(-100, 100),
            translateY: () => anime.random(-100, 100),
            scale: () => anime.random(0.5, 1.5),
            opacity: [0.2, 0.8, 0.2],
            duration: () => anime.random(3000, 6000),
            delay: i * 100,
            loop: true,
            direction: 'alternate',
            easing: 'easeInOutSine',
        });
    });

    return particles;
}

// Glow pulse
export function glowPulse(element, color = 'var(--primary)') {
    return anime({
        targets: element,
        boxShadow: [
            `0 0 0 0 ${color}00`,
            `0 0 30px 10px ${color}40`,
            `0 0 0 0 ${color}00`,
        ],
        duration: 2000,
        loop: true,
        easing: 'easeInOutSine',
    });
}

// Fondo con gradiente animado
export function animateGradient(element) {
    return anime({
        targets: element,
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        duration: 8000,
        loop: true,
        easing: 'linear',
    });
}

// =====================================================
// ANIMACIONES DE TABLAS
// =====================================================

// Filas de tabla con stagger
export function tableRowsEnter(rows) {
    return anime({
        targets: rows,
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        delay: anime.stagger(50),
        easing: 'easeOutCubic',
    });
}

// Highlight de fila
export function highlightRow(row) {
    return anime({
        targets: row,
        backgroundColor: ['rgba(99, 102, 241, 0.1)', 'rgba(99, 102, 241, 0)'],
        duration: 1000,
        easing: 'easeOutCubic',
    });
}

// =====================================================
// ANIMACIONES DE LOADING
// =====================================================

// Spinner dots
export function loadingDots(dots) {
    return anime({
        targets: dots,
        translateY: [-8, 0],
        opacity: [0.5, 1],
        delay: anime.stagger(100),
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine',
        duration: 400,
    });
}

// Skeleton shimmer
export function skeletonShimmer(element) {
    return anime({
        targets: element,
        backgroundPosition: ['-200% 0', '200% 0'],
        duration: 1500,
        loop: true,
        easing: 'linear',
    });
}

// =====================================================
// UTILIDADES
// =====================================================

// Función para limpiar todas las animaciones
export function removeAllAnimations() {
    anime.remove('*');
}

// Timeline helper
export function createTimeline(options = {}) {
    return anime.timeline({
        easing: 'easeOutExpo',
        ...options,
    });
}

export default anime;
