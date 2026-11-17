# Pedidos, ventas y entregas

La navegación concentra la operación en **Pedidos**. El apartado independiente Ventas se retiró; sus registros, API e indicadores se conservan.

Cada pedido muestra por separado su estado, la venta del celular y la entrega. **Registrar venta** abre la confirmación de importe y pago externo. Solo se debe confirmar cuando el negocio haya recibido el pago. El servidor conserva su operación transaccional: crea la venta, marca la unidad como vendida, completa el pedido asociado y registra la acción en bitácora. Esto no marca la entrega como realizada.

Un celular vendido mediante otra operación se identifica así y no permite registrar otra venta. Los pedidos cancelados tampoco ofrecen el botón. Se conserva la protección contra doble venta y no existe un interruptor para deshacer ventas confirmadas.

**Venta sin pedido** conserva las ventas directas para unidades disponibles. El historial se consulta al final de Pedidos y los indicadores del Resumen siguen usando ventas persistidas. No hay pagos en línea ni cambios de tablas, migraciones o permisos en esta actualización.

La pantalla conserva colores, tipografía y componentes de la tienda. Incluye búsqueda y filtros en servidor, rango de fechas de solicitud con días completos de México, 20 pedidos por página, estados vacíos, mensajes de confirmación y tarjetas en móviles. Al cambiar de página se vuelve al inicio de la lista. La búsqueda vuelve a la primera página y los contadores de pendientes y confirmados incluyen todos los pedidos, no solo los visibles. Ver pedido incluye solicitud, venta y movimientos reales de estado y entrega desde la bitácora, con fecha y administrador. La revisión visual usa datos ficticios en una vista local aislada; no registra ventas reales.

## Reservar desde Inventario

«Reservar equipo» sustituye al cambio directo de estado. El formulario consulta las solicitudes pendientes de esa unidad, paginadas de diez en diez. Se puede confirmar una de ellas conservando cliente y folio, o elegir expresamente una reserva nueva con nombre, WhatsApp y modalidad de entrega (destino obligatorio para envío).

`POST /api/admin/reservations` requiere sesión administrativa y una clave de idempotencia. En una sola transacción bloquea la unidad, comprueba disponibilidad y venta, crea o confirma el pedido, reserva la unidad y prepara su entrega pendiente. Registra las acciones en bitácora. Las peticiones repetidas de una misma operación no crean nuevos pedidos y no se puede reservar una unidad vendida ni apartada para otro pedido. Las reservas capturadas por un administrador no fingen haber recibido consentimiento en el formulario público.

Al guardar se abre el pedido correspondiente. «Ver pedido» en Inventario lleva a Pedidos filtrado por ese folio y abre el detalle, aunque el pedido no esté en la primera página de la lista general. Desde ahí se puede registrar la venta, cancelar la reserva y gestionar la entrega. Cancelar un pedido confirmado libera su equipo; registrar la venta lo marca como vendido y conserva la entrega como estado independiente.

Las unidades antiguas reservadas sin pedido se identifican como tales. «Completar reserva» vincula una solicitud pendiente o captura los datos de su cliente manteniendo el estado reservado. «Liberar equipo» requiere una acción explícita. Esta actualización no libera ni asigna automáticamente esas reservas existentes. La API antigua de estado rechaza nuevas reservas sin pedido; permite liberar una reserva antigua solo si no hay un pedido confirmado asociado. Los datos de cliente y la relación del pedido se devuelven solo en el inventario administrativo, nunca en el catálogo público.

## Filtros de Pedidos

El estado del pedido (pendiente, confirmado/reservado, completado, cancelado o con venta) se consulta por separado del estado de entrega (sin programar, por entregar, en ruta, entregado o incidencia). Ambos filtros se combinan con búsqueda y fechas mediante AND, y vuelven a la primera página. «Limpiar filtros» restablece también la entrega. Los pedidos cancelados no aparecen como entregas pendientes; su columna indica «No aplica». Si no hay coincidencias se muestra un estado vacío específico; durante la consulta no se mantienen filas de la selección anterior.

La integración real prueba todos los estados, combinaciones de venta/entrega, reutilización de folio, cancelación, reservas anteriores sin pedido, idempotencia, privacidad del catálogo y la carrera entre venta y reserva. Crea y elimina solo sus propios registros de prueba. No requiere cambios de esquema, migraciones ni políticas de Supabase. Falta revisar visualmente esta actualización en el navegador y publicarla para que se refleje en Render.
