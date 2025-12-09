# Sistema de Inventario con Facturación

Sistema completo de gestión de inventario con facturación, desarrollado con arquitectura separada de frontend y backend.

## Estructura

```
inventory-system/
├── backend/          # API REST con Express.js
│   ├── src/
│   │   ├── routes/   # Rutas de la API
│   │   ├── lib/      # Utilidades (db, auth)
│   │   └── index.js  # Servidor principal
│   └── package.json
│
├── frontend/         # UI con Next.js
│   ├── src/
│   │   ├── app/      # Páginas
│   │   └── lib/      # API service
│   └── package.json
│
└── schema.sql        # Esquema de base de datos
```

## Despliegue

### 1. Base de Datos (Render PostgreSQL)

1. Crear una base de datos PostgreSQL en Render
2. Ejecutar el contenido de `schema.sql` en la consola SQL

### 2. Backend (Render Web Service)

1. Crear un **Web Service** en Render
2. Configurar:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Añadir variables de entorno:
   - `DATABASE_URL`: URL de PostgreSQL
   - `JWT_SECRET`: Secreto para tokens
   - `FRONTEND_URL`: URL del frontend en Vercel

### 3. Frontend (Vercel)

1. Crear proyecto en Vercel
2. Configurar:
   - **Root Directory**: `frontend`
3. Añadir variable de entorno:
   - `NEXT_PUBLIC_API_URL`: URL del backend en Render

## Desarrollo Local

### Backend

```bash
cd backend
npm install
# Crear .env con DATABASE_URL, JWT_SECRET, FRONTEND_URL=http://localhost:3000
npm run dev
```

### Frontend

```bash
cd frontend
npm install
# Crear .env.local con NEXT_PUBLIC_API_URL=http://localhost:3001
npm run dev
```

## Credenciales de Prueba

- Email: `admin@sistema.com`
- Password: `admin123`

## Funcionalidades

- ✅ Autenticación JWT
- ✅ CRUD de productos
- ✅ Gestión de inventario
- ✅ Creación de facturas
- ✅ Gestión de clientes
- ✅ Dashboard con estadísticas
- ✅ Animaciones con anime.js
- ✅ Diseño moderno con glassmorphism
