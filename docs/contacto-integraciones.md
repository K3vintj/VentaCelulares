# Contacto: mapa e Instagram

El commit `dc9ac2e` preparó el diseño, pero Express no tenía `/api/instagram/feed`, Google Maps requería una clave y la CSP no permitía cargar los servicios externos. Esta corrección conserva las tarjetas y conecta el contrato del frontend con una ruta real.

## Mapa

Se usa la inserción web de Google Maps, sin clave de Maps JavaScript API ni configuración de Google Cloud. El mapa se carga directamente al abrir Contacto, sin clic previo, por petición del propietario. Entrega local muestra Coatzacoalcos y Envío nacional cambia la vista a México. No se inventa una dirección del negocio ni un marcador de tienda. El enlace externo sigue disponible si un bloqueador o el proveedor impide la carga. Se comprobó HTTP 200 y la redirección a `/maps/embed`, sin `X-Frame-Options` que impida insertar el mapa. El intento con OpenStreetMap devolvió HTTP 429 y se descartó.

La información de privacidad explica la conexión automática y el proveedor puede aplicar sus propias condiciones de almacenamiento. Express permite Maps, la ruta de mapas de Google e Instagram como orígenes de iframe; no se abre la CSP a scripts externos. La clave `VITE_GOOGLE_MAPS_API_KEY` no es necesaria para esta tarjeta. Los controles y la tarjeta mantienen el diseño oscuro; el mapa utiliza su presentación web normal.

## Instagram

La tarjeta muestra directamente la inserción oficial del perfil público `alexxzino_store`, con su enlace de respaldo siempre disponible. Esta vista no necesita un token del backend, ni scrapea Instagram, ni fabrica estadísticas o fotos. Requiere que la cuenta sea pública y permita inserciones; Instagram o los bloqueadores del navegador pueden limitarla. El endpoint público del perfil respondió HTTP 200 con contenido `EmbedProfile`, sin redirección a login ni `X-Frame-Options` que impida la inserción. El botón Ver perfil está centrado verticalmente y pasa centrado a su propia fila en móvil.

La ruta `/api/instagram/feed` sigue disponible como integración opcional para una futura galería propia; ya no bloquea la vista incrustada del perfil. Lo siguiente aplica únicamente a esa integración personalizada:

La API del servidor usa Instagram API with Instagram Login. Requiere que el propietario autorice una cuenta profesional (Business o Creator). Variables privadas en el entorno del backend/Render:

```env
INSTAGRAM_ACCESS_TOKEN=TOKEN_AUTORIZADO_POR_EL_PROPIETARIO
INSTAGRAM_USERNAME=alexxzino_store
INSTAGRAM_API_VERSION=v27.0
```

Nunca colocar el token en `VITE_*`, en el repositorio, en capturas o en el chat. No hace falta proporcionar la contraseña de Instagram al operador. El propietario obtiene y renueva el token mediante su panel autorizado de Meta; la caducidad depende del token emitido. Estas variables se leen al iniciar Express, sin recompilar el frontend.

El servidor obtiene el perfil de `/me`, comprueba que sea la cuenta esperada y solicita hasta tres publicaciones. Las credenciales viajan en el encabezado de autorización y no se devuelven al navegador. La caché de cinco minutos comparte las consultas simultáneas, limita llamadas a Meta y aplica una pausa tras errores. Hay un tiempo máximo de espera; los errores externos se sustituyen por mensajes públicos sin credenciales. Solo se publican campos permitidos, enlaces a publicaciones de Instagram y fotos de sus CDN oficiales. No hay scraping, publicaciones inventadas, escritura en Instagram ni nuevas tablas en Supabase.

La conexión real de esta API opcional no queda comprobada hasta configurar un token autorizado y verificar las publicaciones del negocio. El perfil incrustado se carga independientemente de esa configuración.

Fuentes: [Meta: iniciar Instagram API with Instagram Login](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started) y [Google Maps: compartir e insertar mapas](https://support.google.com/maps/answer/7101463).

Validación: compilación, pruebas de integración simulada de Instagram y seguridad, y prueba del proceso compilado de producción. Se verificó la respuesta HTTP del perfil incrustado real. La comprobación visual en el navegador y la publicación en Render deben completarse con esta actualización. La autorización de la API es opcional para esta vista.
