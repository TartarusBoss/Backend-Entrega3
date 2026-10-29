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

## Despliegue actual en Render

- API: https://sportzone-api-m6ag.onrender.com
- Estado: https://sportzone-api-m6ag.onrender.com/health
- Frontend autorizado por CORS: https://frontend-entrega3.vercel.app

El archivo `render.yaml` define la versión de Node, la comprobación de salud y las variables necesarias. El servicio ejecuta `prisma migrate deploy` antes de iniciar la API. La base PostgreSQL y el backend están en Oregon. El catálogo de producción tiene nueve productos.

Si se recrea la base, carga los datos iniciales desde un entorno confiable con `DATABASE_URL`, `SEED_ADMIN_PASSWORD` y `SEED_USER_PASSWORD` configuradas solo en el entorno de ejecución, y ejecuta `npm run db:seed`. El seed es repetible por nombre de producto/correo

## Verificación automatizada del despliegue

Para comprobar un despliegue, ejecuta el verificador desde el repositorio backend. Configura estas variables en la terminal, sin agregarlas a ningún archivo versionado:

- `API_BASE_URL`: origen HTTPS de la API de Render, sin `/api` al final.
- `FRONTEND_URL`: origen exacto de Vercel, sin ruta final.
- `TEST_ADMIN_EMAIL` y `TEST_ADMIN_PASSWORD`: credenciales de la cuenta admin creada por el seed de producción.

En PowerShell, establece las cuatro variables de entorno para la terminal y ejecuta:

```powershell
npm run verify:deployment
```

Verificación realizada el 29 de octubre de 2026 contra los servicios publicados: salud HTTPS, CORS del frontend, catálogo paginado con productos, validación de paginación, respuestas `401`/`403`, registro, correo duplicado, login, creación y consulta de solicitud, y CRUD de un producto temporal como admin. Todas las comprobaciones pasaron.

El verificador crea un usuario y una solicitud de prueba permanentes; informa el correo generado para poder reconocerlos. El producto temporal se elimina al terminar. Ejecuta primero en un entorno de prueba si no quieres dejar registros de verificación en producción.

La interfaz también se probó en producción: la sesión del usuario sobrevivió a una recarga, se creó una solicitud desde el sitio y apareció en “Mis solicitudes”. La petición protegida `GET /api/requests/mias` respondió `200` con un encabezado Bearer; el token no se mostró ni registró.


