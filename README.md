# SportZone API

API REST de SportZone construida con Express, TypeScript, Prisma y PostgreSQL. Mantiene el catálogo de la Entrega 1 y permite registrar usuarios, iniciar sesión y enviar solicitudes asociadas a la cuenta autenticada.

## Requisitos

- Node.js 20 o superior.
- PostgreSQL.

## Configuración local

1. Copia `.env.example` a `.env` y ajusta `DATABASE_URL`, `JWT_SECRET` (mínimo 32 caracteres), `FRONTEND_URL` y las claves de prueba del seed.
2. Instala dependencias con `npm install`.
3. Genera el cliente Prisma y aplica migraciones con `npm run db:generate` y `npx prisma migrate dev`.
4. Carga los productos y las cuentas de prueba con `npm run db:seed`.
5. Inicia el servidor con `npm run dev`. La API queda disponible en `http://localhost:3001`.

Las credenciales del seed son para desarrollo y pruebas de la entrega. No reutilices esas claves en producción. Las contraseñas se guardan usando bcrypt; la API nunca devuelve el hash.

Con los valores incluidos en `.env.example`, las cuentas locales son:

- Admin: `admin@sportzone.test` / `CambiaEstaClaveAdmin123!`
- Usuario: `usuario@sportzone.test` / `CambiaEstaClaveUser123!`

## Rutas principales

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/products?page=1&limit=6` | Público |
| GET | `/api/products/:id` | Público |
| POST, PUT, DELETE | `/api/products` | Solo admin |
| POST | `/api/requests` | Usuario autenticado |
| GET | `/api/requests/mias` | Usuario autenticado, solo sus solicitudes |
| GET | `/api/requests` | Solo admin |

Las rutas protegidas reciben `Authorization: Bearer <token>`. Sin sesión la API responde `401`; con sesión y rol insuficiente responde `403`. El CORS acepta únicamente el origen definido en `FRONTEND_URL`.

## Variables de entorno

Consulta `.env.example`. El archivo `.env` contiene valores locales y no debe subirse al repositorio.

## Preparar el despliegue del backend en Render

El archivo `render.yaml` define el servicio web gratuito, la versión de Node, la comprobación de salud y las variables necesarias. Al crear el Blueprint, Render solicitará `DATABASE_URL` y `FRONTEND_URL`; configura una URL PostgreSQL de producción y el origen exacto del frontend en Vercel. Render genera `JWT_SECRET` y ejecuta `prisma migrate deploy` antes de iniciar la API.

Después de crear la base de producción, carga los datos iniciales **una sola vez** desde un entorno confiable, con `DATABASE_URL`, `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` configuradas para esa base, y ejecuta `npm run db:seed`. No agregues las credenciales de producción a este repositorio ni uses las claves de ejemplo.

Este Blueprint solo prepara la configuración: no crea ni despliega recursos hasta que lo conectes y lo apliques desde Render. Completa ese paso cuando tengas la URL de Vercel; después, registra las URLs reales en el README de entrega.
