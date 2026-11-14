# Operación y configuración de producción

## Estado y límites

El código está preparado para servir la tienda y la API en un único proceso Node.js 24. Se comprobó el servidor compilado con HTTPS terminado por un proxy, cabeceras de seguridad, frontend estático, API y rechazo de accesos anónimos. No se ha contratado hosting, configurado un dominio ni publicado una instancia de producción.

Hay un respaldo local cifrado y una restauración real comprobada en recursos aislados. El destino externo y la periodicidad siguen pendientes de elección del propietario. No hay un monitor externo ni una tarea programada de respaldos activos. Los comandos de esta guía permiten ejecutarlos sin inventar que existe una automatización.

## Configuración del servidor

1. Instalar las versiones indicadas en `.mise.toml`, usar `pnpm install --frozen-lockfile` y `npm --prefix backend ci`.
2. Compilar con `npm run build:all`. Conservar el commit desplegado para poder volver a esa versión.
3. Completar de forma privada `backend/.env.production.example`: dominio real HTTPS, conexión de ejecución, conexión de migraciones, bucket y clave privilegiada de Storage. Guardar las credenciales en el gestor de secretos del hosting.
4. Inyectar las variables y ejecutar `node backend/dist/index.js` desde la raíz. `SERVE_FRONTEND=true` permite servir `/`, `/admin`, los archivos compilados y `/api` desde el mismo origen. No usar Vite como servidor público.
5. Exponer Node solo al proxy. `deploy/nginx.conf.example` ilustra el proxy en la misma máquina. Ajustar `TRUST_PROXY` a las IP/redes que realmente llegan a Node. No usar `true` ni confiar en cualquier cabecera del cliente.
6. Instalar un certificado válido para el dominio y automatizar su renovación en la infraestructura elegida. El proceso rechaza mutaciones HTTP y exige cookies Secure en producción.

El `Dockerfile` permite empaquetar lo mismo como contenedor, con usuario sin privilegios y comprobación de disponibilidad. Esta máquina no tiene Docker disponible: la ejecución de la aplicación compilada se probó; la construcción de la imagen debe comprobarse en el host que tenga Docker.

```sh
docker build -t ventacelulares:COMMIT .
docker run --env-file /private/ventacelulares.production.env \
  --restart unless-stopped -p 127.0.0.1:3000:3000 ventacelulares:COMMIT
```

Los secretos, respaldos y claves privadas quedan fuera tanto de Git como del contexto de construcción de Docker. No crear variables `VITE_*` con secretos. La tienda utiliza `/api`; no requiere la clave de Supabase en el navegador.

## Supabase y permisos

La API utiliza `vc_runtime`: no es superusuario, no elude RLS, no crea esquemas/roles/bases y no lee `auth.users`. Tiene CRUD en las nueve tablas de la aplicación y lectura de los metadatos de contrato de Prisma. Las políticas RLS se restringen a ese rol. Los roles de navegador `anon`, `authenticated` y `PUBLIC` no tienen permisos de tabla.

`DIRECT_URL` sigue siendo la conexión privilegiada para migraciones, permisos, diagnóstico y respaldos. No usarla en el frontend. La clave `SUPABASE_SERVICE_ROLE_KEY` permanece únicamente en el servidor para las fotografías.

El script `npm --prefix backend run db:runtime` prepara o verifica el rol y actualiza `backend/.env` **solo después de probar la conexión**. La credencial generada se guarda en `.backups/runtime-credentials.json`, excluida de Git y protegida por los permisos del usuario. No se imprime. En otro servidor se debe transferir por un canal privado al gestor de secretos. Ese archivo y la clave de respaldo tampoco se incluyen en el respaldo de datos.

Después de aplicar cambios de modelo:

```powershell
Set-Location backend
npm run db:status
# Revisar el plan y tomar un respaldo antes de aplicar una migración nueva.
npm run db:migrate
npm run db:access
npm run db:runtime
npm run db:verify
```

Las conexiones a Supabase usan TLS `verify-full` con la CA pública incluida en `backend/certs`. Comprueban el certificado y el nombre real del pooler. No se usa `rejectUnauthorized=false`. La comprobación local detectó y corrigió una conexión anterior sin TLS.

La imposición de SSL para **todos** los clientes del proyecto es una configuración de la cuenta de Supabase distinta de la validación del cliente. Debe revisarse en Database Settings antes del lanzamiento; no se cambió esa opción global ni se reinició el proyecto. Lo mismo aplica a MFA de las cuentas que administran Supabase y GitHub. Referencia: [SSL de Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement).

## Respaldo cifrado de la aplicación

```powershell
# Una sola vez, para un almacén nuevo. Nunca reemplazar una clave que ya protege copias.
npm --prefix backend run backup:init
npm --prefix backend run backup:create
# Usar la ruta que devolvió el comando anterior:
npm --prefix backend run backup:verify -- C:/ruta/copia.vcbackup
```

En un contenedor sin herramientas de desarrollo:

```sh
node backend/dist/scripts/backup.js create
node backend/dist/scripts/backup.js verify /private/backups/copia.vcbackup
```

- Copia consistente de las nueve tablas de aplicación y sus fotografías. No es un volcado de todos los servicios internos de Supabase; Auth, extensiones y configuración del proveedor se recuperan mediante sus herramientas propias.
- Se conservan hashes del administrador, solicitudes, ventas, entregas, configuración y bitácora. Las sesiones activas se excluyen deliberadamente para no reactivar cookies antiguas.
- Incluye archivos de Storage y las fotos externas del seed. Las fotos externas requieren un host permitido; actualmente se permite `images.unsplash.com`. Cada objeto tiene una suma SHA-256.
- El archivo está comprimido y cifrado con AES-256-GCM, que autentica su contenido y cabecera. Se probó rechazo de clave equivocada y archivo modificado.
- La clave aleatoria está en `.backups/key.hex`, con carpeta privada para el usuario local. `BACKUP_KEY_FILE` permite guardarla por separado; `BACKUP_ENCRYPTION_KEY` admite la clave hexadecimal desde un gestor de secretos. Nunca escribirla en argumentos ni mostrarla en logs.
- La clave necesita una copia segura independiente: sin ella no se puede descifrar el respaldo. No conservar la única clave y todas las copias solo en esta computadora.
- Una copia fallida queda descartada como `.partial`; no reemplaza copias anteriores.

Supabase indica expresamente que el respaldo de PostgreSQL no incluye los archivos de Storage. Por eso se respaldan ambos: [respaldos de Supabase](https://supabase.com/docs/guides/platform/backups).

La prueba `backup:verify` descifra primero y valida la autenticación antes de insertar datos. Crea un esquema `vc_restore_…` y un bucket privado `vc-restore-…`, restaura tablas y relaciones, sube y vuelve a descargar las imágenes para comprobar sus hashes, y elimina solo esos recursos temporales. No borra ni reemplaza datos de la tienda.

## Recuperar una copia sin sobrescribir la tienda

```powershell
npm --prefix backend run backup:recover -- C:/ruta/copia.vcbackup
```

`recover` conserva la copia recuperada en un esquema nuevo y un bucket privado nuevos; muestra sus nombres. No sustituye `public` ni cambia el bucket activo. Es una recuperación aislada para inspeccionar y planear la restitución. Para volver al servicio tras un desastre se necesita comparar el commit/contrato original, preparar el destino inactivo, restituir los datos y URLs de fotos, y hacer el cambio de forma controlada. No ejecutar comandos manuales que borren el esquema `public`, que también puede contener objetos administrados por Supabase.

Si falla una restauración, el original permanece intacto. El archivo de datos temporal descifrado se elimina al terminar. El archivo cifrado se conserva.

## Contraseña y recuperación del administrador

La contraseña existente no se cambió automáticamente. Para sustituir una clave inicial conocida, entrar a **Configuración → Cambiar contraseña**. El servidor exige la actual, usa Argon2id y revoca todas las sesiones al guardar.

Si se pierde el acceso, un operador con acceso privado al servidor puede ejecutar en Windows:

```powershell
./scripts/Recover-Admin.ps1 -Email CORREO_DEL_ADMINISTRADOR
```

La terminal pide la contraseña nueva dos veces de forma oculta y la pasa por stdin. No aparece en el comando ni se guarda en un archivo. El procedimiento no crea cuentas nuevas: actualiza una existente, revoca sus sesiones y deja un registro de recuperación. La recuperación y revocación se probaron con una cuenta temporal, después eliminada.

En Linux/contenedor, enviar por stdin al comando `node backend/dist/scripts/recover-admin.js --stdin` un JSON con `email` y `password`, desde un gestor de secretos o una lectura oculta del operador; nunca poner ese JSON en el historial del shell.

## Disponibilidad, registros y respuesta

```powershell
$env:MONITOR_URL = 'https://DOMINIO_REAL'
npm --prefix backend run ops:monitor
```

Comprueba la tienda, `/admin`, conexión de base de datos, catálogo/configuración y el rechazo de un acceso anónimo a pedidos. Devuelve un código distinto de cero si falla. El proveedor puede usar `/api/health/ready` como comprobación de disponibilidad; `/api/health` solo confirma que el proceso está vivo.

En producción los logs contienen ID de petición, método, plantilla de ruta, estado y duración. No incluyen cuerpos, cookies, contraseñas, teléfonos ni parámetros de consulta. Ante un error interno, el cliente recibe un ID para correlacionarlo con el servidor.

Al conectar el hosting: definir un destinatario de alertas de caída/error, retención y acceso a logs, reinicio automático, y ejecutar una prueba real de alerta. No se envió ningún mensaje ni se configuró un destinatario inventado.

Los límites de intentos son por instancia de API. Mantener una sola instancia al inicio; para varias réplicas, migrarlos a un almacén compartido. Revisar sesión vencida y tamaño del mapa de intentos bajo la carga esperada.

## Código y verificaciones automáticas

GitHub Actions comprueba instalación reproducible, TypeScript, build, pruebas sin conexión de integración y auditoría de dependencias de ejecución. Las acciones oficiales están fijadas a un commit. No se suben credenciales de Supabase a CI y los PR no ejecutan pruebas contra producción.

La integración se ejecuta explícitamente contra desarrollo. El código impide activarla con `NODE_ENV=production`. La versión actual de Prisma es una RC: mantener el lockfile y revisar/probar cualquier actualización antes de desplegarla.

## Pasos que requieren datos del propietario

- Dominio y hosting definitivos, para completar el ejemplo y activar HTTPS público.
- Elegir la nueva contraseña en el formulario o recuperación privada.
- Destino externo, periodicidad y retención de respaldos; guardar una copia independiente de su clave.
- Revisión de SSL global y MFA en las cuentas de Supabase/GitHub.
- Conectar el monitor externo y un destinatario real de alertas.
