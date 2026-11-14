# Estado de implementación

Actualizado el 14 de noviembre de 2026 (hora de México). Complementa el backlog PDF; no sustituye la aceptación del cliente ni declara terminadas sus 168 actividades.

| Bloque solicitado | Implementación y evidencia |
|---|---|
| TypeScript, API, conexión y migraciones | Typecheck y compilación frontend/backend. Migración inicial y migración de sesiones/idempotencia/archivo/unicidad de ventas aplicadas; estado Prisma al día. Health y conexión probados. |
| Catálogo, login, sesión y logout | Catálogo desde API; sesión HttpOnly persistida como hash, restauración y revocación en servidor. Sin login demostrativo ni acceso admin público. |
| Solicitudes, folio y WhatsApp | Persistencia con consentimiento y modalidad/destino, instantánea, folio único e idempotencia. Confirmación utiliza el folio y enlace devueltos por el servidor. Sin reserva/cobro automático. |
| Productos, fotos e inventario | Alta/edición y publicación con verificaciones y fotos; borradores y archivo; Storage, galería ordenada y eliminación; reservar/liberar con comprobación del estado. Bitácora. |
| Pedidos, ventas, entregas e indicadores | Confirmación/cancelación; venta directa o vinculada; exclusión de doble venta; paquetería, guía, estado y notas. Panel e ingresos calculados con ventas reales. Configuración y avisos persistidos. |

## Supabase comprobado

- Se encontraron las ocho tablas iniciales, un administrador y una configuración por defecto, con relaciones aplicadas y sin ventas duplicadas.
- Se aplicó la migración que agrega `AdminSession`, `Order.requestKey`, `Product.isArchived`, unicidad de venta por unidad y el WhatsApp predeterminado correcto.
- Se activó RLS en las nueve tablas y se revocaron sus permisos para `anon`, `authenticated` y `PUBLIC`. El rol de la API conserva acceso; la comprobación anónima rechaza la lectura de pedidos y administradores.
- Se creó/configuró `products`: lectura pública comercial, JPEG/PNG/WebP, máximo 5 MB.
- La consulta de `pg_event_trigger` no encontró un trigger `ensure_rls`; no se alteró ninguno.

## Pruebas

Las pruebas automáticas verifican validaciones, autorización, login incorrecto/correcto, restauración de sesión, revocación al salir, borrador/publicación con fotos, rechazo de archivos inválidos, idempotencia concurrente, folios distintos para solicitudes distintas, reservas exclusivas, cancelación/liberación, ventas concurrentes (una aceptada y otra rechazada), entregas, archivo e ingresos. Los fixtures se eliminan al terminar.

La revisión de interfaz con Edge comprobó el catálogo, formulario con destino de envío, confirmación con folio/enlace, login, sesión después de recargar, edición persistente de precio y carga real de foto, reserva y venta desde Pedidos, y logout. Se revisaron escritorio de 1440 px y móvil de 390 px sin desbordamiento de página ni excepciones del navegador. No sustituye la validación del cliente en dispositivos físicos.

El panel permite cambiar la contraseña con verificación de la actual. Las pruebas confirman que la contraseña anterior deja de funcionar y las sesiones previas quedan revocadas. La contraseña del administrador existente se conserva hasta que su titular la cambie.

## Pendientes del backlog fuera de estos bloques

Antes del lanzamiento aún deben cerrarse políticas y cobertura comercial, fotografías e inventario definitivos del negocio, elección privada de contraseña, destino externo/periodicidad de respaldos, despliegue/dominio/HTTPS público, monitor externo/alertas y aceptación en dispositivos reales. La animación 3D y el cobro en línea no se incluyeron.

La carga de inventario, fotos y datos comerciales definitivos corresponde al cliente. Las herramientas de carga ya están disponibles.

## Preparación de operación

- Se añadieron servidor de producción con frontend y API del mismo origen, ejemplo de configuración, proxy HTTPS y Dockerfile. Docker no está instalado en esta máquina; la imagen queda pendiente de construir en un host con Docker.
- Se activó `vc_runtime` para la API con RLS, sin superusuario ni BYPASSRLS, sin DDL y sin lectura de Supabase Auth. `DIRECT_URL` se conserva para migraciones/operación. La conexión usa TLS y comprueba CA/hostname.
- Se creó un respaldo cifrado con AES-256-GCM: un administrador, una unidad, una foto y configuración del negocio. La restauración aislada comprobó las siete claves foráneas y el hash de la foto después de subirla/descargarla de Storage. Los recursos temporales se eliminaron.
- Pasaron las pruebas de producción compilada, recuperación administrativa y revocación de sesiones. La auditoría de dependencias de ejecución reportó cero vulnerabilidades.
- Se añadió CI para GitHub con instalación reproducible, build, pruebas y auditoría, sin credenciales de Supabase. El código de integración no ejecuta fixtures con `NODE_ENV=production`.
- La guía [operacion-produccion.md](operacion-produccion.md) detalla recuperación, monitoreo y los pasos privados pendientes del propietario. No hay copias externas programadas ni alertas externas activas todavía.

## Cierre de modularización y bitácora

- `App.tsx` conserva únicamente el estado general y la navegación. Se separaron páginas públicas/administrativas, layout, componentes de tienda, controles base, formularios compartidos, hooks, tipos y utilidades.
- La pantalla Bitácora consulta los movimientos reales con filtros de acción, área, referencia y fechas, paginación, detalle y estados de carga/error/vacío. La API valida los filtros, pagina en PostgreSQL y entrega únicamente identidad básica del administrador.
- El correo del cliente se asignó exclusivamente a la cuenta administrativa existente, conservando su contraseña y revocando sus sesiones. No se incorporó al contacto público ni al código versionado.
- El contexto actualizado está en [contexto-actualizado.md](contexto-actualizado.md), sin contraseñas ni datos privados de acceso.
- Se verificó el respaldo con el correo actualizado. La limpieza de restauración reintenta Storage y cierra/elimina siempre el archivo temporal; una prueba negativa comprueba que una copia rechazada no deja esquema ni datos descifrados.
