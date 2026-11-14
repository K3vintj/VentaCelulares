# Contexto actual de VentaCelulares — Alexxziño Store

Actualizado el 14 de noviembre de 2026, hora de México. Este documento describe la implementación actual; sustituye el contexto inicial de prototipo. No contiene contraseñas ni correos privados del administrador.

## 1. Alcance

Catálogo de unidades físicas de iPhone con solicitud web y cierre comercial por WhatsApp. Un único administrador gestiona el negocio. La solicitud no cobra ni reserva automáticamente. La venta se registra después de confirmar el pago fuera de la plataforma.

No se incluyen pagos en línea, cuentas de compradores ni animación 3D.

## 2. Funciones implementadas

- Catálogo y ficha individual desde la API: SKU, condición comercial, batería, revisión técnica, precio, disponibilidad y galería real de la unidad.
- Solicitud persistida con nombre, teléfono, consentimiento, modalidad y destino de envío cuando aplica. Conserva nombre/precio del producto al momento de solicitar.
- Folio único generado por el servidor e idempotencia para reintentos. La confirmación muestra el folio y un botón para continuar por WhatsApp con el resumen. No abre WhatsApp automáticamente.
- Login administrativo real, sesión restaurada al recargar, expiración y logout con revocación en servidor.
- Acceso al panel por `/admin`, `#admin` o Ctrl+Shift+A. Sin botones administrativos en la tienda pública.
- Productos en borrador, edición, publicación y archivo con historial conservado. La publicación exige verificaciones y fotografías.
- Fotos en Supabase Storage: carga JPEG/PNG/WebP, máximo 5 MB, orden de galería y eliminación controlada.
- Inventario con reservas/liberaciones; confirmación/cancelación de solicitudes; ventas directas o vinculadas a pedidos con protección contra doble venta concurrente.
- Entregas con modalidad, destino, paquetería, guía, estado e incidencias.
- Indicadores y gráficos calculados con ventas reales. Las solicitudes pendientes/canceladas no generan ingresos.
- Configuración comercial y avisos editables.
- Pantalla de bitácora administrativa: administrador, fecha, acción, entidad, referencia, detalles, filtros y paginación. Acceso exclusivamente autenticado.
- Cambio de contraseña y recuperación privada por operador. Ambas revocan las sesiones.

## 3. Organización del frontend

React 19, Vite 8, TypeScript y Tailwind CSS v4. El diseño existente se conserva.

```text
src/App.tsx                    Estado general, sesión y navegación
src/types/                     Modelos, navegación y tipos de formularios
src/services/api.ts            Cliente HTTP con cookies y manejo de errores
src/hooks/useData.ts            Carga de datos y control de respuestas obsoletas
src/utils/                     Formato, condiciones y helpers de formularios
src/components/ui.tsx          Controles y componentes base
src/components/Icon.tsx        Iconos existentes
src/components/Logo.tsx        Identidad visual
src/components/store/          Header, footer, tarjeta de producto y layout de flujo
src/components/admin/          Formularios compartidos, tablas y estados administrativos
src/pages/public/              Welcome, Notices, Catalog, Detail, Checkout, Success, ContactPage
src/pages/admin/               Login, layout, productos, inventario, pedidos, ventas,
                              dashboard, configuración y bitácora
src/config/commercial.ts       Textos base y configuración pública hidratada desde la API
src/index.css                  Estilos existentes
```

`App.tsx` ya no contiene las implementaciones de páginas, formularios o componentes visuales. La división de módulos no requiere rehacer las vistas.

## 4. Backend y datos

Express con TypeScript. Rutas y funciones separadas en `backend/src/app.ts`, `auth.ts`, `products.ts`, `orders.ts`, `commerce.ts`, `config.ts` y `domain.ts`. `index.ts` inicia el proceso y gestiona el cierre.

PostgreSQL de Supabase con Prisma 8 RC. El contrato actual está en `backend/src/prisma/contract.prisma` y empieza con `// use prisma-8`. Sus artefactos JSON y tipos, snapshots y migraciones están versionados. No se usa `@prisma/client` ni `schema.prisma`.

Modelos actuales: `AdminUser`, `AdminSession`, `Product`, `ProductPhoto`, `Order`, `Sale`, `Delivery`, `BusinessConfig` y `AuditLog`.

Cambios respecto al contrato inicial: sesiones persistidas, `Order.requestKey` único para idempotencia, `Product.isArchived` y unicidad de venta por unidad. Consultar el contrato del repositorio para los campos y relaciones completos; no sustituirlo por el modelo antiguo del prototipo.

## 5. Seguridad y acceso

Las sesiones usan tokens aleatorios cuyo hash se guarda en `AdminSession`, con cookie HttpOnly, SameSite y Secure en producción. La API consulta la sesión vigente en cada acceso administrativo. Se implementaron límites de intentos, validación en servidor, protección de orígenes y cabecera de mutación, y errores sin exposición de credenciales.

La API usa el rol PostgreSQL limitado `vc_runtime`, con RLS activo y políticas restringidas al servidor. Los roles `anon`, `authenticated` y `PUBLIC` no tienen permisos sobre las tablas de la aplicación. `DIRECT_URL` se conserva para migraciones y operaciones. Las conexiones a Supabase verifican TLS, CA y hostname.

El correo de acceso del cliente está exclusivamente en la cuenta administrativa y en la configuración privada `ADMIN_EMAIL`; no se publica como correo de contacto. El cambio de correo conserva la contraseña y revoca las sesiones anteriores. No crear otra cuenta mediante el seed para cambiar el correo: usar el procedimiento controlado.

Para crear el primer administrador se requieren `ADMIN_EMAIL` y `ADMIN_INITIAL_PASSWORD` en el entorno privado. No hay correo o contraseña predeterminados; el seed impide crear una segunda cuenta. La contraseña de una cuenta existente nunca se reemplaza con un valor de demostración.

## 6. Operación y respaldos

Código versionado en la rama `conexion-backend`. GitHub Actions comprueba instalación, TypeScript, build, pruebas y dependencias sin credenciales de Supabase. Los `.env`, claves, respaldos y datos de prueba quedan fuera de Git.

Hay configuración para servir frontend y API desde un mismo origen en producción, con HTTPS mediante proxy, cookies seguras, cabeceras de seguridad y registros de peticiones sin datos personales. Existe Dockerfile; la imagen debe probarse en un equipo con Docker antes de usarla.

Los respaldos de aplicación contienen registros y fotografías, cifrados con AES-256-GCM y hashes de archivos. Las sesiones se excluyen. Se comprobó la restauración de tablas, relaciones y fotos en recursos aislados. La clave se conserva en un archivo privado independiente de Git.

Comandos principales desde la raíz:

```powershell
pnpm run build:all
pnpm run test:api
npm --prefix backend run db:status
npm --prefix backend run db:verify
npm --prefix backend run backup:create
npm --prefix backend run backup:verify -- RUTA_DEL_ARCHIVO.vcbackup
```

Para cambiar el correo del único administrador, con autorización del propietario:

```powershell
npm --prefix backend run admin:email -- NUEVO_CORREO
```

La recuperación de contraseña se hace con `scripts/Recover-Admin.ps1`, que solicita la nueva de forma oculta. La guía `docs/operacion-produccion.md` describe requisitos, monitoreo, recuperación y configuración del servidor.

## 7. Estado de las tareas del documento original

1. Login, sesión, acceso oculto y rate limiting: implementados.
2. Solicitud, folio, instantánea y WhatsApp: implementados con botón de continuación.
3. Panel administrativo conectado: implementado, incluida la vista de bitácora.
4. Modularización progresiva: completada; las vistas y componentes están separados de `App.tsx`.

## 8. Qué queda para el lanzamiento

Responsabilidad del cliente: cargar inventario y fotografías reales y proporcionar los datos comerciales definitivos, horarios, cobertura y costos de entrega. El desarrollo de las herramientas de carga ya está hecho.

Pendientes de publicación y operación:

- Elegir dominio/hosting, completar los valores privados de producción, publicar el servidor y activar HTTPS público.
- Incorporar a la web los textos aprobados de privacidad, términos, garantía, entregas y devoluciones. El contenido debe aprobarlo el negocio.
- Elegir una contraseña nueva por un canal privado y revisar MFA/SSL global en las cuentas del proveedor.
- Elegir destino externo, frecuencia y retención de los respaldos y conservar una copia independiente de la clave.
- Conectar un monitor externo y un destinatario real de alertas.
- Probar la versión publicada con su dominio, cookies HTTPS, WhatsApp y dispositivos físicos.

No se han contratado servicios, publicado un dominio, programado copias externas ni activado alertas externas. No confundir las comprobaciones locales/CI con la aceptación final del cliente en producción.
