# Biblioteca de fotografías de iPhone

28 modelos y 126 combinaciones verificadas el 15 de noviembre de 2026. El registro está en `backend/src/catalog/iphone-library.json`; `sources.json` conserva la URL y SHA-256 de cada original y de cada archivo publicado.

Las imágenes proceden de [Comparar iPhone de Apple](https://www.apple.com/iphone/compare/). Modelos, acabados y capacidades se contrastaron con [Identificar el modelo de iPhone](https://support.apple.com/es-es/108044). Solo se incluyen modelos y colores documentados: no hay un iPhone 18 estándar inventado ni combinaciones de colores entre familias. Cada variante tiene su propio archivo.

Se usan las fotografías originales, sin generar, reconstruir ni recolorear cámaras, chasis o pantallas. Un recorrido desde los bordes elimina únicamente el fondo casi blanco conectado al exterior, añadiendo transparencia. WebP sin pérdida conserva exactamente los píxeles opacos; la preparación aborta si cambia alguno. La página aplica fondo negro y `object-fit: contain`, sin recortes ni filtros. Son imágenes de referencia del modelo/color, identificadas así en la ficha; no documentan el estado de la unidad usada.

La disponibilidad pública de una fotografía no otorga por sí misma permiso comercial. Antes de uso comercial, el propietario debe confirmar derechos de utilización o sustituir estos archivos por fotografías autorizadas manteniendo sus identificadores.

## Operación

En Administración → Productos, seleccionar «Biblioteca por modelo y color». Modelo, color y capacidad solo ofrecen combinaciones válidas. La vista previa cambia antes de guardar. Se puede publicar sin subir otra foto cuando se completan las verificaciones técnicas y comerciales. «Fotos propias / otro modelo» conserva el flujo anterior. Las fotos reales siguen disponibles como complemento y no se eliminan al elegir una referencia.

Solo se guarda `Product.referenceVariantId`, por ejemplo `iphone-15-pro/titanio-natural`. Los archivos son públicos, compartidos y versionados en Git, servidos por Render con caché; no se duplican en Supabase por cada unidad. No hay generación de IA durante el uso ni nuevas claves o servicios que configurar. Los respaldos cifrados incluyen el identificador; para restaurar la presentación también se necesita el código y sus archivos de esta versión.

## Validación y actualización

`npm run check:library` verifica los 126 archivos, metadatos, SHA-256, transparencia y procedencia. También se ejecuta en `build:all`, CI y Docker. `npm run prepare:library` vuelve a descargar las URLs registradas y procesa las fotos de manera determinista. Revisar visualmente toda actualización; cambiar `-v1` por una nueva versión si se sustituye un archivo para invalidar cachés. No sobrescribir una foto con otra familia o color.

`npm --prefix backend run library:assign` muestra coincidencias exactas de los productos existentes. Con `-- --apply` asigna solo referencias vacías y deja registro en la bitácora; conserva las fotos reales. Crear respaldo antes. No adivina coincidencias ambiguas.

## Migraciones y RLS

La base existente tenía RLS y las nueve políticas `vc_runtime_access`, administradas previamente por los scripts de operación, pero no estaban descritas en Prisma. Se capturaron mediante `contract infer`, se declararon `@@rls` y las políticas exactas en el contrato, y `db verify --schema-only` confirmó coincidencia completa. Después se registró ese estado existente con `db sign`; no se desactivó RLS, ni se cambiaron políticas o datos. La migración `adopt_existing_runtime_rls` documenta ese estado para bases nuevas. La siguiente migración añade únicamente la columna nullable `referenceVariantId`.

Para una base nueva debe existir antes el rol restringido `vc_runtime`; Prisma verifica roles pero no los crea. Inicializar la clave de respaldos y ejecutar `npm --prefix backend run db:runtime -- --provision-only` con la conexión de aprovisionamiento: crea el rol y guarda sus credenciales protegidas, sin otorgar acceso a tablas ni cambiar `.env`. Después ejecutar `db:migrate`, `db:access` y `db:runtime` completo para los grants, límites y conexión restringida, y finalmente revisar accesos. No crear las políticas por separado antes de las migraciones. La base existente ya está preparada. Render usa el rol restringido y no ejecuta migraciones al arrancar.
