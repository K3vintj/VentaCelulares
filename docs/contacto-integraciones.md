# Contacto: mapa e Instagram

El commit `dc9ac2e` preparó el diseño, pero Express no tenía `/api/instagram/feed`, Google Maps requería una clave y la CSP no permitía cargar los servicios externos. Esta corrección conserva las tarjetas y conecta el contrato del frontend con una ruta real.

## Mapa

Se usa la inserción web de Google Maps, sin clave de Maps JavaScript API ni configuración de Google Cloud. El visitante pulsa **Mostrar mapa interactivo** antes de conectar con el proveedor. Entrega local muestra Coatzacoalcos y Envío nacional cambia la vista a México. No se inventa una dirección del negocio ni un marcador de tienda. El enlace externo sigue disponible si un bloqueador o el proveedor impide la carga. Se comprobó HTTP 200 y la redirección a `/maps/embed`, sin `X-Frame-Options` que impida insertar el mapa. El intento con OpenStreetMap devolvió HTTP 429 y se descartó.

La elección es por apertura de la página y no añade cookies propias. La información de privacidad explica la conexión externa y el proveedor puede aplicar sus propias condiciones de almacenamiento. Express permite únicamente Maps y la ruta de mapas de Google como orígenes de iframe; no se abre la CSP a scripts externos. La clave `VITE_GOOGLE_MAPS_API_KEY` ya no es necesaria para esta tarjeta. Los controles y la tarjeta mantienen el diseño oscuro; el mapa utiliza su presentación web normal.

## Instagram

La API del servidor usa Instagram API with Instagram Login. Requiere que el propietario autorice una cuenta profesional (Business o Creator). Variables privadas en el entorno del backend/Render:

```env
INSTAGRAM_ACCESS_TOKEN=TOKEN_AUTORIZADO_POR_EL_PROPIETARIO
INSTAGRAM_USERNAME=alexxzino_store
INSTAGRAM_API_VERSION=v27.0
```

Nunca colocar el token en `VITE_*`, en el repositorio, en capturas o en el chat. No hace falta proporcionar la contraseña de Instagram al operador. El propietario obtiene y renueva el token mediante su panel autorizado de Meta; la caducidad depende del token emitido. Estas variables se leen al iniciar Express, sin recompilar el frontend.

El servidor obtiene el perfil de `/me`, comprueba que sea la cuenta esperada y solicita hasta tres publicaciones. Las credenciales viajan en el encabezado de autorización y no se devuelven al navegador. La caché de cinco minutos comparte las consultas simultáneas, limita llamadas a Meta y aplica una pausa tras errores. Hay un tiempo máximo de espera; los errores externos se sustituyen por mensajes públicos sin credenciales. Solo se publican campos permitidos, enlaces a publicaciones de Instagram y fotos de sus CDN oficiales. No hay scraping, publicaciones inventadas, escritura en Instagram ni nuevas tablas en Supabase.

Sin autorización, o si Meta no está disponible, la tarjeta mantiene el perfil y su enlace y no muestra instrucciones del backend al cliente. La conexión real no queda comprobada hasta configurar un token autorizado y verificar las publicaciones del negocio.

Fuentes: [Meta: iniciar Instagram API with Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started) y [Google Maps: compartir e insertar mapas](https://support.google.com/maps/answer/7101463).

Validación: compilación, pruebas de integración simulada de Instagram y seguridad, y prueba del proceso compilado de producción. No se pudo revisar visualmente esta versión: el servicio de navegador de pruebas no estaba disponible. La publicación en Render y la autorización real de Instagram permanecen pendientes.
