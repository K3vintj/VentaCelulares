# Prueba pública gratuita en Render

Configuración preparada en `render.yaml`: un servicio web Docker **Free**, región Virginia y rama `conexion-backend`. Sirve React y Express desde el mismo origen. No crea bases de datos, discos ni servicios de pago. El despliegue y su URL se consideran pendientes hasta comprobarlos en Render.

## Crear el servicio

1. Entrar en [Render](https://dashboard.render.com/) con la cuenta del propietario. Elegir el workspace Hobby gratuito; no contratar Pro ni un plan de cómputo de pago.
2. Crear **New → Blueprint**, seleccionar `K3vintj/VentaCelulares`, rama `conexion-backend` y archivo `render.yaml`. Si GitHub pide permisos, conceder acceso únicamente a este repositorio.
3. Comprobar que el resumen muestre **un único Web Service Free**, sin base de datos, discos ni servicios adicionales. No añadir un método de pago para esta prueba. Si Render exige tarjeta o un servicio de pago, detenerse y revisar antes de continuar.
4. Completar de forma privada los tres valores solicitados con los de `backend/.env`: `DATABASE_URL` (rol limitado `vc_runtime`), `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Son secretos del servidor. No copiar todo el `.env`, ni `DIRECT_URL`, claves de respaldo o contraseña del administrador.
5. Crear el Blueprint y revisar el primer build/deploy. El contenedor compila todo; no ejecuta migraciones ni seed. Las tablas, el administrador y las fotografías existentes se conservan en Supabase.

La API utiliza `RENDER_EXTERNAL_URL`, proporcionada por Render, para el origen HTTPS, CORS y redirecciones. No hace falta adivinar ni comprar un dominio. Si después se usa otro dominio, establecer `FRONTEND_URL` explícitamente. `TRUST_PROXY` acepta el ingreso desde redes privadas y loopback; comprobar el HTTPS público y el inicio de sesión para validar la configuración real de ingreso. No cambiarlo por `true`.

Los despliegues automáticos están desactivados para no publicar cada cambio de desarrollo ni consumir builds innecesarios. Para actualizar, usar **Manual Deploy → Deploy latest commit** después de revisar las pruebas.

## Comprobar antes de compartir

Abrir la URL HTTPS asignada y verificar catálogo, fotos y `/admin`. Iniciar sesión, recargar para comprobar que se conserva la sesión y cerrarla. Crear una solicitud identificada como prueba, comprobar su folio en administración y abrir su enlace de WhatsApp sin enviar mensajes automáticamente. La solicitud usa la base actual: sus datos quedan guardados; cancelarla al terminar.

Ejecutar el monitor usando la URL que realmente devuelva Render:

```powershell
$env:MONITOR_URL = 'https://URL_ASIGNADA.onrender.com'
npm --prefix backend run ops:monitor
Remove-Item Env:MONITOR_URL
```

El monitor es una comprobación manual, no una tarea periódica para mantener despierto el servicio. Los respaldos continúan en el equipo local; no guardarlos en el disco temporal de Render.

## Límites y costo

Render Free se suspende después de 15 minutos sin tráfico y puede tardar aproximadamente un minuto en despertar. Tiene cuotas de horas, transferencia y builds. Sin método de pago, al agotar transferencia Render suspende los servicios Free en vez de cobrar un excedente. Revisar el uso del workspace y de Supabase antes de compartir ampliamente. Esta prueba no certifica capacidad para cientos de usuarios ni disponibilidad de producción.

Referencias oficiales: [servicios gratuitos](https://render.com/docs/free), [Blueprints](https://render.com/docs/blueprint-spec), [variables del entorno](https://render.com/docs/environment-variables) y [secretos](https://render.com/docs/configure-environment-variables).
