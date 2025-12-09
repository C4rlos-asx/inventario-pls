# Backend - Sistema de Inventario

API REST para el sistema de inventario con facturación.

## Desplegar en Render

1. Crear un nuevo **Web Service** en Render
2. Conectar este repositorio (carpeta `backend`)
3. Configurar:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

4. Añadir variables de entorno:
   - `DATABASE_URL`: URL de PostgreSQL
   - `JWT_SECRET`: Secreto para JWT
   - `FRONTEND_URL`: URL del frontend en Vercel

## Endpoints

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `GET /api/products` - Listar productos
- `POST /api/products` - Crear producto
- `GET /api/clients` - Listar clientes
- `POST /api/clients` - Crear cliente
- `GET /api/categories` - Listar categorías
- `GET /api/inventory` - Listar inventario
- `PUT /api/inventory` - Ajustar stock
- `GET /api/invoices` - Listar facturas
- `POST /api/invoices` - Crear factura
- `GET /api/dashboard` - Estadísticas

## Desarrollo local

```bash
cd backend
npm install
# Crear .env con DATABASE_URL, JWT_SECRET, FRONTEND_URL
npm run dev
```
