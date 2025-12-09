-- =====================================================
-- SISTEMA DE INVENTARIO CON FACTURACIÓN
-- Ejecutar en DBeaver conectado a PostgreSQL de Render
-- =====================================================

-- Limpiar tablas existentes (opcional, descomentar si necesitas reiniciar)
-- DROP TABLE IF EXISTS invoice_items CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS inventory_movements CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLA: USUARIOS (Autenticación)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'admin', 'user'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda por email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- TABLA: CLIENTES (Para facturación)
-- =====================================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    tax_id VARCHAR(50), -- RIF/NIT/RFC/DNI según país
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda por nombre
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- =====================================================
-- TABLA: CATEGORÍAS DE PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Color para UI
    icon VARCHAR(50) DEFAULT 'package',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: PRODUCTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    cost DECIMAL(12, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 0, -- Porcentaje de impuesto
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- =====================================================
-- TABLA: INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 5, -- Alerta de stock bajo
    max_stock INTEGER DEFAULT 1000,
    location VARCHAR(100), -- Ubicación en almacén
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: FACTURAS
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'fixed', -- 'fixed' o 'percentage'
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled', 'partial'
    payment_method VARCHAR(50), -- 'cash', 'card', 'transfer', 'credit'
    notes TEXT,
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsqueda
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(created_at);

-- =====================================================
-- TABLA: ITEMS DE FACTURA (Detalle)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL, -- Guardamos nombre por si se elimina producto
    product_code VARCHAR(50),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    tax_rate DECIMAL(5, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    discount DECIMAL(12, 2) DEFAULT 0,
    subtotal DECIMAL(12, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- =====================================================
-- TABLA: MOVIMIENTOS DE INVENTARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- Positivo = entrada, Negativo = salida
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- 'in', 'out', 'adjustment', 'sale', 'return'
    reference_type VARCHAR(20), -- 'invoice', 'manual', 'purchase'
    reference_id INTEGER, -- ID de factura u otra referencia
    notes TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(created_at);

-- =====================================================
-- DATOS INICIALES
-- =====================================================

-- Usuario administrador por defecto
-- Contraseña: admin123 (hasheada con bcrypt)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@sistema.com', '$2a$10$rQZk.HJAGwQKqGJ.Yx8QCOhJzr0F0G4LMQk0Kh2YWjKE7mGvB6Sfi', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Categorías de ejemplo
INSERT INTO categories (name, description, color, icon) VALUES
('Electrónicos', 'Dispositivos y accesorios electrónicos', '#3b82f6', 'cpu'),
('Ropa', 'Prendas de vestir y accesorios', '#ec4899', 'shirt'),
('Alimentos', 'Productos alimenticios', '#22c55e', 'utensils'),
('Hogar', 'Artículos para el hogar', '#f59e0b', 'home'),
('Oficina', 'Suministros de oficina', '#8b5cf6', 'briefcase')
ON CONFLICT DO NOTHING;

-- Cliente genérico para ventas rápidas
INSERT INTO clients (name, email, notes) 
VALUES ('Cliente General', 'cliente@general.com', 'Cliente para ventas sin factura nominativa')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Función para crear registro de inventario al crear producto
CREATE OR REPLACE FUNCTION create_inventory_for_product()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO inventory (product_id, quantity, min_stock)
    VALUES (NEW.id, 0, 5)
    ON CONFLICT (product_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_inventory_on_product ON products;
CREATE TRIGGER create_inventory_on_product
    AFTER INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION create_inventory_for_product();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de productos con inventario y categoría
CREATE OR REPLACE VIEW products_with_inventory AS
SELECT 
    p.id,
    p.code,
    p.name,
    p.description,
    p.price,
    p.cost,
    p.tax_rate,
    p.is_active,
    c.name as category_name,
    c.color as category_color,
    COALESCE(i.quantity, 0) as stock,
    COALESCE(i.min_stock, 5) as min_stock,
    CASE 
        WHEN COALESCE(i.quantity, 0) <= 0 THEN 'out_of_stock'
        WHEN COALESCE(i.quantity, 0) <= COALESCE(i.min_stock, 5) THEN 'low_stock'
        ELSE 'in_stock'
    END as stock_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN inventory i ON p.id = i.product_id;

-- Vista de resumen de facturas
CREATE OR REPLACE VIEW invoices_summary AS
SELECT 
    i.id,
    i.invoice_number,
    i.status,
    i.total,
    i.created_at,
    c.name as client_name,
    u.name as created_by,
    (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.id) as items_count
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
LEFT JOIN users u ON i.user_id = u.id;

-- =====================================================
-- ¡LISTO! Base de datos configurada correctamente
-- =====================================================

-- Verificar que todo se creó correctamente:
SELECT 'Tablas creadas:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
