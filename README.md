# VentaCelulares / Alexxziño Store

Catálogo por unidad física, solicitudes guardadas con folio y seguimiento por WhatsApp. La tienda funciona en Cloudflare Workers, que sirve el frontend de React/Vite y reenvía `/api/*` a la función `store-api` de Supabase. Supabase gestiona la base de datos, el acceso administrativo y las fotos.

La venta se coordina por fuera de la web. El administrador publica equipos, sube fotos y gestiona reservas, pedidos y ventas desde el panel. [Tienda](https://alexxzinostore.com/) · [Panel de administración](https://alexxzinostore.com/admin)

## Preparar el proyecto en local

Requiere Node.js 24, pnpm 10.34.3 y Git LFS para descargar los archivos gráficos. Ejecuta los comandos de PowerShell desde la raíz del repositorio.

```powershell
git switch conexion-backend
git lfs install
git lfs pull
pnpm install --frozen-lockfile
npm --prefix backend ci
npm --prefix platform ci
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Completa `backend/.env` con las credenciales de desarrollo. Express sirve la API local y Vite reenvía `/api` a `127.0.0.1:3000`.

```powershell
pnpm run dev:api
# En otra terminal, solamente si Vite no está corriendo:
pnpm run dev
```

Abre la [tienda local](http://localhost:8443) o el [panel local](http://localhost:8443/admin). También puedes abrir el acceso administrativo con `#admin` o `Ctrl+Shift+A`.

## Subir cambios a GitHub

Antes de editar, sincroniza `conexion-backend`.

```powershell
git switch conexion-backend
git pull --ff-only origin conexion-backend
```

Después de editar y probar, revisa el diff y prepara únicamente los archivos de tu cambio. Este ejemplo sube un ajuste de estilos.

```powershell
git status --short
git diff
git add -- src/index.css
git diff --cached
node scripts/check-staged-secrets.mjs
if ($LASTEXITCODE -ne 0) { throw 'Revisa los archivos preparados antes de continuar' }
git commit -m "fix(catalog): ajustar estilos"
git push origin conexion-backend
```

Mantén los `.env`, las claves y los respaldos fuera del repositorio. GitHub Actions ejecuta las comprobaciones del proyecto y la publicación de producción se hace desde las CLI. [Comprobaciones en GitHub](https://github.com/K3vintj/VentaCelulares/actions?query=branch%3Aconexion-backend)

## Publicar en producción

Publica desde el commit que revisaste en GitHub.

| Qué cambió | Dónde se actualiza |
|---|---|
| Diseño, frontend o Worker | Cloudflare Workers |
| API de producción | Función `store-api` en Supabase |
| Tablas, relaciones o permisos | Migración SQL en Supabase |
| Productos, fotos, inventario, pedidos o ventas | Panel de administración |

### Frontend o Worker

Con Wrangler autenticado en la cuenta de la tienda, ejecuta lo siguiente desde la raíz. Si es tu primera vez en esa computadora, inicia sesión con `node platform/node_modules/wrangler/bin/wrangler.js login`.

```powershell
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falló la compilación' }
node platform/node_modules/wrangler/bin/wrangler.js deploy --config platform/wrangler.jsonc --keep-vars
```

Wrangler publica `dist/` y el Worker `ventacelulares`. La opción `--keep-vars` conserva las variables configuradas para conectar la API.

### API de Supabase

Para publicar solo la función, usa la referencia del proyecto de producción en el panel de Supabase. Si esta computadora todavía no está autenticada, ejecuta `npx --yes supabase@3.2.0 login`.

```powershell
node scripts/prepare-edge.mjs
if ($LASTEXITCODE -ne 0) { throw 'Falló la preparación de la función' }
& ./platform/node_modules/.bin/deno.cmd check --frozen --config supabase/functions/store-api/deno.json supabase/functions/store-api/index.ts
if ($LASTEXITCODE -ne 0) { throw 'Falló la verificación de tipos' }
$projectRef = Read-Host 'Referencia del proyecto de producción en Supabase'
if ($projectRef -notmatch '^[a-z0-9]+$') { throw 'Referencia de proyecto inválida' }
npx --yes supabase@3.2.0 functions deploy store-api --remote=$projectRef --use-api --no-verify-jwt --yes
```

La función autentica las llamadas del Worker y valida las sesiones administrativas con Supabase Auth.

### Base de datos

Versiona los cambios SQL en `supabase/migrations/` y pruébalos con la base de desarrollo. Aplica la migración revisada al proyecto de producción antes de publicar la API que depende de ella. La guía describe cómo se aplicó y verificó la migración inicial, además del despliegue conjunto. [Guía de Cloudflare y Supabase](docs/migracion-cloudflare-supabase.md)

### Comprobar el despliegue

Comprueba que `/api/health/ready` responda con `ok: true` y `database: true`. Abre el catálogo y verifica el cambio. Si tocaste un flujo administrativo, entra con tu cuenta y comprueba ese flujo. [Estado de la API](https://alexxzinostore.com/api/health/ready) · [Catálogo](https://alexxzinostore.com/#catalogo)

## Comprobaciones

```powershell
pnpm run build:all
pnpm run test:api
pnpm run test:product-photos
node platform/test-database.mjs
pnpm run db:verify
npm --prefix backend run db:status
```

`db:verify` y `db:status` usan la conexión configurada en `backend/.env`. Las pruebas de integración están desactivadas por defecto porque requieren el Supabase de desarrollo. Para ejecutarlas:

```powershell
Set-Location backend
$env:VC_INTEGRATION = 'true'
npm test
Remove-Item Env:VC_INTEGRATION
```

La integración crea y elimina una cuenta, una unidad, fotos, solicitudes, entregas y ventas temporales. No envía mensajes ni realiza pagos o envíos. No se debe ejecutar contra producción. Si una ejecución se interrumpe, `npx tsx src/scripts/clean-test-data.ts` elimina exclusivamente los fixtures identificados por el nombre, correo y descripción de la suite.

## Base de datos para Express

Para mantener el contrato que usa Express en desarrollo, Prisma 8 toma `backend/src/prisma/contract.prisma`. Sus artefactos JSON, tipos y migraciones deben versionarse. Ejecuta esta secuencia con la base de desarrollo configurada.

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

## API de Express en desarrollo

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

En Express, los límites de intentos se guardan en memoria para una instancia de API. Para varias réplicas se necesita un almacén compartido.

## Respaldos y referencias de operación

La guía de Render documenta el entorno anterior con Express. El archivo `render.yaml` conserva la configuración de ese servicio. [Guía de Render](docs/prueba-render.md)

La integración de `develop`, las páginas de privacidad/cookies, la revisión de vulnerabilidades y los pasos para actualizar la instancia existente se describen en [la revisión del 15 de noviembre](docs/integracion-seguridad-2026-11-15.md). Los textos legales informativos se editan en `src/config/legal.ts`; no contienen datos privados del administrador.

La guía de operación de Express documenta Docker, el proxy HTTPS, la cuenta PostgreSQL limitada, los respaldos cifrados y la comprobación de restauración. [Guía de operación](docs/operacion-produccion.md)

```powershell
npm --prefix backend run backup:create
npm --prefix backend run backup:verify -- C:/ruta/copia.vcbackup
# Recuperación aislada que conserva la copia, sin reemplazar datos de la tienda:
npm --prefix backend run backup:recover -- C:/ruta/copia.vcbackup
```

En el panel de producción, el cambio de contraseña se realiza desde **Configuración** y se guarda en Supabase Auth. `scripts/Recover-Admin.ps1` corresponde a la cuenta del entorno Express.

La bitácora está disponible desde el menú administrativo. Permite filtrar por acción, área, referencia y fechas, consultar detalles y navegar por páginas. El endpoint `/api/admin/audit` aplica los filtros en PostgreSQL y nunca devuelve hashes de contraseña.

Las vistas están separadas en `src/pages/public/` y `src/pages/admin/`, con componentes compartidos en `src/components/`, hooks y utilidades. `src/App.tsx` solo coordina estado y navegación. El [contexto actualizado](docs/contexto-actualizado.md) sustituye las instrucciones antiguas del prototipo.
