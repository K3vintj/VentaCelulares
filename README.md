# VentaCelulares / Alexxziño Store

Catálogo por unidad física, solicitudes guardadas con folio y seguimiento por WhatsApp. React/Vite consume una API Express; la API consulta PostgreSQL de Supabase y administra las fotos en Storage. No procesa pagos ni reserva automáticamente al solicitar.

## Desarrollo

Requiere Node.js 24, pnpm y las credenciales de desarrollo del proyecto.

```powershell
pnpm install --frozen-lockfile
npm --prefix backend ci
Copy-Item backend/.env.example backend/.env
# Completar backend/.env con los accesos de desarrollo. No publicar ese archivo.
pnpm run dev:api
# En otra terminal, solamente si Vite no está corriendo:
pnpm run dev
```

Tienda: `http://localhost:8443`. Administración: `http://localhost:8443/admin`, `#admin` o Ctrl+Shift+A. La tienda no muestra enlaces públicos de administración. La autorización real se comprueba en cada endpoint del servidor.

Vite reenvía `/api` a `127.0.0.1:3000`. En producción configura un proxy del mismo origen hacia Express o `VITE_API_URL` y `FRONTEND_URL` coherentes. Activa HTTPS y `COOKIE_SECURE=true`. El uso de la misma procedencia evita depender de cookies entre sitios diferentes.

## Comprobaciones

```powershell
pnpm run build:all
pnpm run test:api
pnpm run db:verify
npm --prefix backend run db:status
```

Las pruebas de integración están desactivadas por defecto porque requieren el Supabase de desarrollo. Para ejecutarlas:

```powershell
Set-Location backend
$env:VC_INTEGRATION = 'true'
npm test
Remove-Item Env:VC_INTEGRATION
```

La integración crea y elimina una cuenta, una unidad, fotos, solicitudes, entregas y ventas temporales. No envía mensajes ni realiza pagos o envíos. No se debe ejecutar contra producción. Si una ejecución se interrumpe, `npx tsx src/scripts/clean-test-data.ts` elimina exclusivamente los fixtures identificados por el nombre, correo y descripción de la suite.

## Supabase y migraciones

Prisma 8 usa `backend/src/prisma/contract.prisma`; sus artefactos JSON/tipos y las migraciones deben versionarse. No utiliza `@prisma/client`.

```powershell
Set-Location backend
npm run contract:emit
npx prisma migration plan --name descripcion_del_cambio
# Revisar las operaciones generadas antes de aplicarlas.
npm run db:migrate
npm run db:access
npm run storage:setup
npm run db:verify
```

`DATABASE_URL` es la conexión de ejecución con el rol limitado `vc_runtime`; `DIRECT_URL`, la conexión privilegiada de migraciones y diagnóstico. Nunca se exponen al navegador. `SUPABASE_SERVICE_ROLE_KEY` se utiliza exclusivamente en Express. No incluir secretos en variables `VITE_*`.

El ajuste idempotente `backend/sql/20261114_access.sql` activa RLS en las nueve tablas de la aplicación y revoca sus privilegios para `anon`, `authenticated` y `PUBLIC`. La API utiliza el rol limitado `vc_runtime` con políticas propias; las migraciones y respaldos usan `DIRECT_URL`. Las conexiones a Supabase verifican TLS con su CA pública. Después de nuevas migraciones, vuelve a ejecutar `db:access`, `db:runtime` y `db:verify`.

El bucket `products` permite lectura pública de fotos comerciales. Las cargas se realizan por la API autenticada: JPEG, PNG y WebP, hasta 5 MB, doce fotos por unidad. No contiene documentos personales. Los scripts no requieren habilitar ni deshabilitar un trigger global `ensure_rls`.

Si la cuenta ya existía con una contraseña inicial de desarrollo, cámbiala desde **Configuración → Cambiar contraseña**. El cambio requiere la contraseña actual y revoca todas las sesiones. No se ha cambiado automáticamente la contraseña de la cuenta existente.

Para crear el primer administrador usa `ADMIN_EMAIL` y `ADMIN_INITIAL_PASSWORD` (mínimo 14 caracteres), y ejecuta `npm run seed`. No existe contraseña predeterminada en el código y el seed no reemplaza las credenciales de una cuenta existente. El producto de demostración solo se crea con `SEED_DEMO=true`.

## API

Todas las mutaciones requieren `X-Requested-With: VentaCelulares`; los orígenes del navegador se validan contra `FRONTEND_URL`. Las rutas administrativas requieren la cookie HttpOnly `vc_session`. Las sesiones se guardan como hashes y el logout elimina la sesión del servidor.

| Rutas | Uso |
|---|---|
| `GET /api/health`, `/api/health/ready` | Proceso y conexión a PostgreSQL |
| `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Sesión administrativa |
| `POST /api/auth/password` | Cambio autenticado de contraseña y revocación de sesiones |
| `GET /api/products`, `/api/products/:sku` | Unidades publicadas con fotos ordenadas |
| `POST /api/orders` | Solicitud con consentimiento, instantánea de precio/producto y folio del servidor |
| `GET /api/config` | Configuración pública |
| `GET/POST /api/admin/products`, `PUT/DELETE /api/admin/products/:sku` | Catálogo; DELETE archiva y conserva el historial |
| `PATCH /api/admin/products/:sku/status` | Reservar/liberar con estado anterior esperado |
| `POST/PUT /api/admin/products/:sku/photos`, `DELETE /api/admin/products/:sku/photos/:id` | Carga binaria, orden y eliminación de fotos |
| `GET /api/admin/orders`, `PATCH /api/admin/orders/:id` | Solicitudes y confirmación/cancelación |
| `PUT /api/admin/orders/:id/delivery` | Entrega, destino, paquetería, guía e incidencias |
| `GET/POST /api/admin/sales` | Ventas confirmadas y pagos externos |
| `GET /api/admin/dashboard`, `/api/admin/audit` | Indicadores reales y bitácora |
| `PUT /api/admin/config` | WhatsApp, garantía y avisos |

`POST /api/orders` requiere además `Idempotency-Key` UUID. Repetir la misma solicitud con la misma clave devuelve el mismo folio. Un formulario modificado usa otra clave. El folio tiene el año de México y un sufijo criptográfico, protegido por una restricción única. La solicitud conserva su precio aunque después cambie el catálogo.

Las confirmaciones, cancelaciones y ventas bloquean la unidad dentro de una transacción. Confirmar reserva; cancelar una confirmada libera; registrar la venta completa la solicitud. La restricción única de `Sale.productId` impide dos ventas por unidad. Un equipo vendido no se libera desde Inventario. Los ingresos se calculan exclusivamente con registros `Sale`.

Los límites de intentos están en memoria para una instancia de API. Para varias réplicas se necesita un almacén compartido. El despliegue público y las políticas comerciales aprobadas siguen pendientes.

## Producción, respaldos y operación

Para una URL pública de prueba sin contratar hosting, seguir [la guía de Render Free](docs/prueba-render.md). El archivo `render.yaml` prepara un solo servicio gratuito; las credenciales se cargan de forma privada en Render.

La configuración para servir frontend/API juntos, Docker, proxy HTTPS, cuenta PostgreSQL limitada, respaldos cifrados y recuperación administrativa se describe en [la guía de operación](docs/operacion-produccion.md). Incluye los comandos, la comprobación de restauración y los puntos que requieren elegir dominio, destino externo y alertas.

```powershell
npm --prefix backend run backup:create
npm --prefix backend run backup:verify -- C:/ruta/copia.vcbackup
# Recuperación aislada que conserva la copia, sin reemplazar datos de la tienda:
npm --prefix backend run backup:recover -- C:/ruta/copia.vcbackup
```

No se suben a Git los archivos `.env`, respaldos ni claves. La contraseña del administrador existente se conserva hasta que su titular la cambie desde Configuración o use `scripts/Recover-Admin.ps1` con entrada oculta.

La bitácora está disponible desde el menú administrativo. Permite filtrar por acción, área, referencia y fechas, consultar detalles y navegar por páginas. El endpoint `/api/admin/audit` aplica los filtros en PostgreSQL y nunca devuelve hashes de contraseña.

Las vistas están separadas en `src/pages/public/` y `src/pages/admin/`, con componentes compartidos en `src/components/`, hooks y utilidades. `src/App.tsx` solo coordina estado y navegación. El [contexto actualizado](docs/contexto-actualizado.md) sustituye las instrucciones antiguas del prototipo.
