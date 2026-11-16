# Pedidos, ventas y entregas

La navegación concentra la operación en **Pedidos**. El apartado independiente Ventas se retiró; sus registros, API e indicadores se conservan.

Cada pedido muestra por separado su estado, la venta del celular y la entrega. **Registrar venta** abre la confirmación de importe y pago externo. Solo se debe confirmar cuando el negocio haya recibido el pago. El servidor conserva su operación transaccional: crea la venta, marca la unidad como vendida, completa el pedido asociado y registra la acción en bitácora. Esto no marca la entrega como realizada.

Un celular vendido mediante otra operación se identifica así y no permite registrar otra venta. Los pedidos cancelados tampoco ofrecen el botón. Se conserva la protección contra doble venta y no existe un interruptor para deshacer ventas confirmadas.

**Venta sin pedido** conserva las ventas directas para unidades disponibles. El historial se consulta al final de Pedidos y los indicadores del Resumen siguen usando ventas persistidas. No hay pagos en línea ni cambios de tablas, migraciones o permisos en esta actualización.

La pantalla conserva colores, tipografía y componentes de la tienda. Incluye búsqueda y filtros en servidor, rango de fechas de solicitud con días completos de México, 20 pedidos por página, estados vacíos, mensajes de confirmación y tarjetas en móviles. Al cambiar de página se vuelve al inicio de la lista. La búsqueda vuelve a la primera página y los contadores de pendientes y confirmados incluyen todos los pedidos, no solo los visibles. Ver pedido incluye solicitud, venta y movimientos reales de estado y entrega desde la bitácora, con fecha y administrador. La revisión visual usa datos ficticios en una vista local aislada; no registra ventas reales.
