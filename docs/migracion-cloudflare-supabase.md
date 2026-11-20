# Migración de VentaCelulares

Cloudflare sirve el frontend compilado y envía `/api/*` a la función `store-api` de Supabase. React sigue usando las rutas de siempre. El navegador conserva la sesión en una cookie segura del dominio de la tienda. La función verifica el token con Supabase Auth y comprueba que pertenezca al administrador vinculado. Las claves de servicio se quedan en Supabase y un secreto compartido autentica las peticiones procedentes de Cloudflare.

La migración SQL añade el vínculo de Auth y funciones con permisos exclusivos del servidor. Los pedidos, reservas y ventas bloquean la unidad antes de modificarla. Cancelar una reserva libera la unidad y registrar una venta conserva el estado de la entrega.

Para validar y publicar desde la raíz del repositorio:

1. Ejecutar `npm ci --prefix platform`, `npm run build:all`, `node platform/test-database.mjs` y `node scripts/prepare-edge.mjs`.
2. Comprobar los tipos con `platform/node_modules/.bin/deno check --config supabase/functions/store-api/deno.json supabase/functions/store-api/index.ts`.
3. Desde `backend`, ejecutar `node node_modules/tsx/dist/cli.mjs src/scripts/prepare-store-platform.ts --check`, luego el mismo comando con `--apply`. El ensayo revierte sus cambios. Usar `--link-admin` para importar al administrador existente mediante su hash y vincularlo al mismo registro de bitácora.
4. Autenticar las CLI con `npx --yes supabase@3.2.0 login` y `platform/node_modules/.bin/wrangler login`.
5. Ejecutar `node platform/publish.mjs`. El script usa el proyecto definido en `backend/.env`, publica la función y comprueba catálogo, preparación de base y acceso administrativo antes de desplegar Cloudflare. Reutiliza el secreto guardado en `platform/.env.gateway`, que Git ignora. Elimina los archivos temporales al cerrar.
6. Abrir la URL que devuelve Cloudflare y verificar el ingreso con el administrador existente. Probar fotos, pedidos y ventas con datos de prueba antes de anunciar la nueva URL. Si se usa un dominio propio, vincularlo tras la verificación.

El acceso migrado dura hasta una hora por sesión. Los cambios de contraseña realizados en la nueva plataforma se guardan en Supabase Auth. Para volver al panel de Render después de un cambio de contraseña, restablecer allí la contraseña con el procedimiento de recuperación. Los datos comerciales de ambas versiones apuntan a la misma base.

El sitio publicado el 20 de noviembre de 2026 está en [Cloudflare](https://ventacelulares.carloscarmona4554.workers.dev). Se verificaron la página principal, el catálogo vacío, la biblioteca, el estado de la base, TikTok y las páginas legales. El acceso anónimo a Pedidos devuelve HTTP 401 y una escritura desde otro origen devuelve HTTP 403. La cuenta administrativa existente se vinculó con su correo y credenciales habituales.
