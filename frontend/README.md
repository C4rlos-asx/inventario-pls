# Frontend - Sistema de Inventario

Interfaz de usuario Next.js para el sistema de inventario.

## Desplegar en Vercel

1. Crear un nuevo proyecto en Vercel
2. Conectar el repositorio (carpeta `frontend`)
3. Configurar:
   - **Root Directory**: `frontend`

4. Añadir variables de entorno:
   - `NEXT_PUBLIC_API_URL`: URL del backend en Render (ej: https://tu-backend.onrender.com)

## Desarrollo local

```bash
cd frontend
npm install

# Crear .env.local con:
# NEXT_PUBLIC_API_URL=http://localhost:3001

npm run dev
```

El frontend estará en `http://localhost:3000`

## Requisitos

- El backend debe estar corriendo en `http://localhost:3001` (o la URL configurada)
