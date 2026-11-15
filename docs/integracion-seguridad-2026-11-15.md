# Integración de develop, seguridad y preparación de Render

Fecha: 15 de noviembre de 2026. Destino: `conexion-backend`.

## Integración

- Los ZIP proporcionados coinciden byte por byte con el árbol Git de `develop` (`92b8607`) y `conexion-backend` (`35e78bb`). No fue necesario extraer ni ejecutar archivos de los ZIP.
- `develop` ya incluía la implementación de backend de `conexion-backend`. Se integró su historial mediante el merge `df78fa8`, conservando los cambios de ambas ramas.
- Se incorporan la introducción con desplazamiento, nuevos filtros, esqueletos de carga, mejoras de teclado/foco y contraste, tokens de diseño y la imagen local del iPhone.
- Se corrigió la regla de atributos para el PNG de respaldo que develop ya tenía como binario, evitando la advertencia de Git LFS. La portada principal sigue usando un recurso procesado por Vite.

## Revisión de seguridad

El primer `pnpm audit` reportó siete avisos en Vite 8.0.5: uno alto, cinco moderados y uno bajo. Se actualizó a Vite 8.3.8 y se verificó la instalación con pnpm 10.34.3, la versión utilizada en Docker y CI. La auditoría posterior no reporta avisos conocidos. `npm audit` del backend, incluyendo desarrollo, también devuelve cero. Se eliminaron las dependencias JWT sin uso; la aplicación utiliza sesiones opacas persistidas, no JWT.

Además:

- Vite bloquea explícitamente el acceso a `.backups`, archivos del backend, claves, volcados y otros archivos privados, conservando las restricciones a `.env` y `.git`.
- El limitador de intentos tiene un máximo de clientes distintos en memoria. Cuando se alcanza, rechaza entradas nuevas sin crecer indefinidamente; las entradas caducadas se recuperan.
- Las pruebas comprueban que productos, solicitudes, ventas, indicadores, bitácora y configuración administrativa rechazan accesos anónimos; también comprueban mutaciones entre orígenes, JSON inválido y cabeceras de protección.
- Se mantienen HTTPS, CSP, cookies HttpOnly/SameSite/Secure, revocación de sesiones y validación del lado del servidor. Las comprobaciones del servidor compilado incluyen que archivos privados no sean públicos.
- CI ahora audita también las dependencias de desarrollo del frontend y backend, construye el contenedor Linux de Render y lo prueba con credenciales ficticias. Esa prueba no conecta con Supabase ni usa secretos.

Esto es una revisión de código, dependencias y controles concretos; no certifica ausencia de vulnerabilidades ni capacidad para cientos de conexiones. El limitador sigue siendo por instancia, y el catálogo/indicadores necesitan trabajo adicional de paginación y consultas antes de una campaña de alta concurrencia.

## Privacidad y cookies

- Páginas `/privacidad` y `/cookies`, con el sistema visual negro/dorado, navegación por secciones y tabla de almacenamiento.
- Enlaces utilizables en el pie y en el formulario. La consulta desde el formulario abre un diálogo nativo accesible: permite Escape, mantiene el foco y conserva los datos escritos.
- El formulario describe los datos necesarios y solicita una autorización explícita sin marcarla previamente. El servidor ya exige consentimiento y lo guarda con la solicitud y su fecha.
- Aviso informativo que se puede cerrar. Solo almacena localmente la fecha de caducidad de esa elección durante 180 días; no la envía al backend y tolera almacenamiento bloqueado. Desde la política puede restablecerse.
- La aplicación usa `vc_session` para la sesión del administrador (hasta 12 horas). No incorpora analítica ni publicidad, por lo que no se añadieron controles de categorías ficticias.
- Se describen Render, Supabase, WhatsApp/Instagram y la carga de fuentes/fotos externas. No se añadió el correo privado del administrador al contenido público.

Los textos se centralizan en `src/config/legal.ts`. Son una **versión informativa**, no un aviso jurídico final. Por petición del propietario no se incorporaron identidad legal, domicilio ni un canal ARCO específico. Para completar el aviso hacen falta esos datos, definir conservación/supresión y aprobar el procedimiento de atención. El artículo 15 de la [LFPDPPP vigente](https://www.ordenjuridico.gob.mx/Documentos/Federal/html/wo125102.html) requiere identidad/domicilio, finalidades, mecanismos de limitación y derechos ARCO. También permanecen pendientes los términos, entregas/devoluciones y el alcance detallado de la garantía, que dependen del negocio.

No se inventó una política de eliminación automática ni se automatizó el borrado de solicitudes o ventas. Antes de publicar un aviso definitivo conviene conservar su versión exacta con cada consentimiento, además del booleano y la fecha actuales. Si se añaden herramientas de seguimiento, primero se debe implementar su bloqueo hasta obtener el consentimiento aplicable y actualizar el inventario de cookies.

## Render

La actualización de código `8815b44` ya está publicada y comprobada en Render. Se verificó que el HTML público carga exactamente el mismo bundle compilado localmente. Respondieron 200 `/`, `/admin`, `/privacidad`, `/cookies`, `/api/health/ready`, `/api/products` y `/api/config`; los pedidos administrativos rechazaron el acceso anónimo con 401. [GitHub Actions](https://github.com/K3vintj/VentaCelulares/actions/runs/43688411915) aprobó la compilación, auditorías y construcción/prueba del contenedor Linux. Los cambios documentales posteriores no requieren otro despliegue.

La URL de prueba es `https://ventacelulares-gfcm.onrender.com`. La revisión de la instancia anterior confirmó respuestas 200 en tienda, administrador, disponibilidad de base de datos, catálogo y configuración, y 401 para pedidos administrativos anónimos. La primera comprobación agotó el tiempo mientras el servicio despertaba; una segunda comprobación completa pasó. El monitor ahora espera hasta tres intentos de arranque antes de declarar una falla e incluye las nuevas rutas legales.

No se requiere una migración nueva ni modificar las variables existentes para esta actualización. Se conserva un servicio Docker Free y Supabase. Usar la rama `conexion-backend`, contexto `.`, Dockerfile `./Dockerfile` y health check `/api/health/ready`. `DATABASE_URL` debe seguir usando `vc_runtime`; no copiar `DIRECT_URL` al servicio web. Mantener `COOKIE_SECURE=true`, `SERVE_FRONTEND=true`, `SEED_DEMO=false` y la configuración actual de proxy.

Después de confirmar CI, actualizar el **servicio existente** desde **Manual Deploy → Deploy latest commit**. No crear otro servicio a partir del Blueprint: el nombre de la plantilla es diferente al de la instancia creada manualmente. El despliegue público debe comprobarse de nuevo después de actualizar; subir a Git no equivale a desplegar cuando Auto-Deploy está desactivado.

Para comprobar la nueva versión:

```powershell
$env:MONITOR_URL = 'https://ventacelulares-gfcm.onrender.com'
npm --prefix backend run ops:monitor
Remove-Item Env:MONITOR_URL
```

Revisar además, en un teléfono real, catálogo, fotos, solicitud con folio, enlace de WhatsApp, `/admin`, sesión y logout. No se envían mensajes automáticamente. El plan Free puede dormir por inactividad; no se contrató ningún servicio ni se compró dominio.

## Validación y pendientes de operación

La compilación completa y las 11 pruebas con integración pasaron. La suite crea y limpia sus propias cuentas, productos, fotos, solicitudes, entregas y ventas de prueba. No cambia las credenciales del administrador real. La revisión visual cubre escritorio y móvil, enlaces legales, cierre con Escape, persistencia de la preferencia y conservación del formulario al consultar privacidad.

Para producción quedan: completar/aprobar la información legal y comercial, cambiar la contraseña inicial si continúa en uso, MFA de los proveedores, revisar SSL global de Supabase, elegir y automatizar respaldos externos con una copia independiente de la clave, conectar alertas reales y medir capacidad en un entorno de pruebas. Los productos, fotografías, horarios y datos comerciales corresponden al cliente.
