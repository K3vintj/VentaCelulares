#!/usr/bin/env python3
"""Create GitHub labels, milestones and issues from VentaCelulares backlog v2."""

from __future__ import annotations

import json
import subprocess
import sys
import time
from typing import TypedDict


REPO = "K3vintj/VentaCelulares"


class Task(TypedDict):
    id: str
    title: str
    priority: str
    phase: str
    status: str
    analysis: str


# status: hecho | parcial | prototipo | falta
TASKS: list[Task] = [
    # FASE 01
    {"id": "VC-002", "title": "Actualizar especificación funcional/no funcional con solicitud web y cierre por WhatsApp", "priority": "P0", "phase": "01", "status": "falta", "analysis": "No hay documento de especificación en el repo. Solo prototipo UI."},
    {"id": "VC-006", "title": "Cerrar lista de datos obligatorios por unidad usada (batería, piezas, Face ID, bloqueo, SIM, accesorios)", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "El formulario de producto ya captura batería, Face ID, unlock, reparaciones y accesorios, pero faltan criterios formales aprobados y campo SIM explícito."},
    {"id": "VC-007", "title": "Definir criterios verificables para clasificar seminuevo o usado", "priority": "P0", "phase": "01", "status": "falta", "analysis": "Existe enum nuevo/seminuevo/usado en UI, sin criterios de negocio documentados/aprobados."},
    {"id": "VC-008", "title": "Definir flujo exacto: solicitud → folio → WhatsApp → validación del vendedor", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "Hay pantallas de checkout/success, pero el folio es fijo (VC-2025-0184) y no hay persistencia ni validación del vendedor."},
    {"id": "VC-009", "title": "Aprobar reglas de reserva, cancelación y venta sin duplicidad", "priority": "P0", "phase": "01", "status": "falta", "analysis": "Estados Disponible/Reservado/Vendido solo en memoria local; sin reglas de negocio ni concurrencia."},
    {"id": "VC-010", "title": "Definir cobertura, precios, responsables y condiciones de entregas locales y envíos", "priority": "P0", "phase": "01", "status": "falta", "analysis": "deliveryModes=null en commercial.ts; checkout muestra 'Por confirmar'."},
    {"id": "VC-011", "title": "Redactar y aprobar políticas reales de garantía, devolución y privacidad", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "Hay textos provisionales de garantía 30 días; términos, privacidad y devolución aún sin href/documentos aprobados."},
    {"id": "VC-012", "title": "Confirmar alcance MVP; excluir pagos en línea, cuentas de clientes y animación 3D inicial", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "El backlog ya lo delimita; falta confirmación formal del cliente en el repo."},
    {"id": "VC-205", "title": "Auditar y dividir App.tsx en páginas, componentes, modelos y servicios", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "Solo se extrajo config/commercial.ts; App.tsx sigue monolítico (~3300 líneas)."},
    {"id": "VC-206", "title": "Corregir textos del prototipo: eliminar promesas no verificadas y datos demostrativos visibles", "priority": "P0", "phase": "01", "status": "parcial", "analysis": "Sigue initialProducts demo, fotos Unsplash, dashboard/pedidos mock y un equipo condition=nuevo."},
    # FASE 02
    {"id": "VC-015", "title": "Documentar convención de commits, PR, revisión y resolución de conflictos", "priority": "P0", "phase": "02", "status": "parcial", "analysis": "Existen ramas master/develop; falta documento de convenciones de colaboración."},
    {"id": "VC-016", "title": "Configurar GitHub Projects y etiquetas P0/P1/P2/P3 para seguimiento", "priority": "P0", "phase": "02", "status": "parcial", "analysis": "Esta actividad se ejecuta ahora al crear labels/milestones/issues del backlog."},
    {"id": "VC-018", "title": "Crear backend Node.js/Express separado del frontend existente", "priority": "P0", "phase": "02", "status": "falta", "analysis": "No existe carpeta/backend ni servidor API en el repositorio."},
    {"id": "VC-022", "title": "Verificar linter, formateo, typecheck y validación automática en desarrollo", "priority": "P0", "phase": "02", "status": "parcial", "analysis": "Hay oxfmt y TypeScript; no hay script lint/typecheck ni ESLint configurado."},
    {"id": "VC-023", "title": "Crear configuración de entornos con .env.example; excluir secretos del repositorio", "priority": "P0", "phase": "02", "status": "parcial", "analysis": ".gitignore ya excluye .env*; falta .env.example y variables documentadas."},
    {"id": "VC-025", "title": "Unificar scripts de ejecución, compilación y pruebas de frontend/backend", "priority": "P0", "phase": "02", "status": "parcial", "analysis": "Solo scripts frontend (dev/build/preview/format); sin tests ni backend."},
    {"id": "VC-026", "title": "Completar README con instalación, arranque y reglas de colaboración", "priority": "P0", "phase": "02", "status": "falta", "analysis": "No hay README.md de producto; solo AGENTS.md/CLAUDE.md orientados a Figma Make."},
    {"id": "VC-207", "title": "Definir estructura de carpetas, DTOs, cliente HTTP y manejo de errores compartidos", "priority": "P0", "phase": "02", "status": "falta", "analysis": "Sin capa de servicios/HTTP ni DTOs compartidos."},
    {"id": "VC-208", "title": "Crear pipeline CI (typecheck, lint, tests y build) por pull request", "priority": "P0", "phase": "02", "status": "falta", "analysis": "No hay workflows en .github/workflows."},
    # FASE 03
    {"id": "VC-043", "title": "Diseñar DER y cardinalidades (modelos, unidades, fotos, clientes, pedidos, ventas, entregas)", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin diseño de base de datos en el repo."},
    {"id": "VC-044", "title": "Provisionar PostgreSQL de desarrollo", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin base de datos."},
    {"id": "VC-045", "title": "Elegir ORM y configurar migraciones reproducibles", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin ORM ni migraciones."},
    {"id": "VC-046", "title": "Crear tabla del administrador único con credenciales hasheadas", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Login demo acepta cualquier dato; sin persistencia de admin."},
    {"id": "VC-047", "title": "Crear modelos de iPhone y variantes comerciales", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Solo tipo Product en frontend local."},
    {"id": "VC-048", "title": "Crear productos por unidad física con código único, estado y atributos técnicos", "priority": "P0", "phase": "03", "status": "falta", "analysis": "IDs demo en memoria; no hay tabla/unidades persistidas."},
    {"id": "VC-049", "title": "Crear tabla de fotos ordenadas por producto", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Una sola image URL por producto; fotos genéricas Unsplash."},
    {"id": "VC-050", "title": "Crear tabla de datos mínimos del comprador", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Checkout no persiste comprador."},
    {"id": "VC-051", "title": "Crear pedidos con folio y estado inicial pendiente", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Pedidos del admin son mock hardcodeados."},
    {"id": "VC-052", "title": "Guardar instantánea de producto/precio al solicitar un equipo", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin snapshot persistido al enviar solicitud."},
    {"id": "VC-053", "title": "Crear ventas y asociarlas a pedidos/unidades", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Módulo ventas solo UI mock."},
    {"id": "VC-054", "title": "Crear registro de pagos externos sin almacenar datos de tarjeta", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin modelo de pagos."},
    {"id": "VC-055", "title": "Crear entregas con modalidad, destino, paquetería y guía", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin módulo de entregas."},
    {"id": "VC-056", "title": "Crear historial de movimientos de inventario", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Inventario solo cambia estado en useState local."},
    {"id": "VC-057", "title": "Crear configuración del negocio y avisos editables", "priority": "P0", "phase": "03", "status": "parcial", "analysis": "commercial.ts es fuente provisional frontend; settings/notices admin no persisten."},
    {"id": "VC-058", "title": "Crear bitácora de operaciones administrativas", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin auditoría."},
    {"id": "VC-059", "title": "Añadir relaciones, índices, restricciones e integridad referencial", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Depende de BD."},
    {"id": "VC-060", "title": "Crear seed de demostración y probar migración/rollback", "priority": "P0", "phase": "03", "status": "falta", "analysis": "Sin migraciones."},
    # FASE 04
    {"id": "VC-061", "title": "Conectar backend con PostgreSQL por credenciales de entorno", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin backend."},
    {"id": "VC-062", "title": "Separar rutas, controladores, servicios, repositorios y middleware", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin backend."},
    {"id": "VC-063", "title": "Validar entradas y salidas con esquemas", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Validaciones solo parciales en formularios UI."},
    {"id": "VC-064", "title": "Centralizar errores, códigos HTTP, logging y respuestas consistentes", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin API."},
    {"id": "VC-065", "title": "Sustituir login que acepta cualquier dato por autenticación real", "priority": "P0", "phase": "04", "status": "falta", "analysis": "AdminLogin entra con cualquier dato (nota demo visible)."},
    {"id": "VC-066", "title": "Implementar cierre de sesión e invalidación de sesión", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sesión admin solo es estado React local."},
    {"id": "VC-067", "title": "Autorizar en el servidor todas las rutas y acciones del administrador", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin servidor."},
    {"id": "VC-068", "title": "Habilitar recuperación segura de contraseña o perfil controlado de restablecimiento", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Botón '¿Olvidaste tu contraseña?' sin funcionalidad."},
    {"id": "VC-069", "title": "Crear listado público de productos publicados con paginación/filtros", "priority": "P0", "phase": "04", "status": "prototipo", "analysis": "Catálogo UI con filtros locales sobre initialProducts; sin API/paginación real."},
    {"id": "VC-070", "title": "Crear API para ficha de producto con fotos y características", "priority": "P0", "phase": "04", "status": "prototipo", "analysis": "Detalle UI existe; sin endpoint."},
    {"id": "VC-071", "title": "Crear altas, ediciones y validaciones de iPhones desde panel", "priority": "P0", "phase": "04", "status": "prototipo", "analysis": "ProductsAdmin CRUD en memoria local, no API."},
    {"id": "VC-072", "title": "Implementar borrador, publicación, ocultación y archivo", "priority": "P0", "phase": "04", "status": "parcial", "analysis": "Existe isPublished local; faltan ocultar/archivar persistidos y API."},
    {"id": "VC-073", "title": "Subir imágenes de manera segura; guardar metadatos y ordenar galerías", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin upload; se usa URL/imagen única."},
    {"id": "VC-077", "title": "Implementar cambios de disponibilidad transaccionales y auditables", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Cambios locales sin transacción/auditoría."},
    {"id": "VC-078", "title": "Impedir reservar/vender una misma unidad dos veces bajo peticiones concurrentes", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin control de concurrencia."},
    {"id": "VC-084", "title": "Documentar endpoints, permisos y ejemplos de respuestas", "priority": "P0", "phase": "04", "status": "falta", "analysis": "Sin API que documentar."},
    # FASE 05
    {"id": "VC-074", "title": "Crear endpoint que guarde la solicitud de compra antes de salir a WhatsApp", "priority": "P0", "phase": "05", "status": "falta", "analysis": "Submit solo cambia de vista; no llama API."},
    {"id": "VC-075", "title": "Generar folio único real; retirar el folio fijo del prototipo", "priority": "P0", "phase": "05", "status": "falta", "analysis": "Success muestra folio hardcodeado VC-2025-0184."},
    {"id": "VC-076", "title": "Crear gestión de solicitudes: pendiente, confirmada, completada y cancelada", "priority": "P0", "phase": "05", "status": "prototipo", "analysis": "Estados visibles en tablas mock; sin backend."},
    {"id": "VC-102", "title": "Completar formulario con nombre, teléfono, consentimiento y datos pertinentes", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "UI tiene nombre/teléfono/email/consentimiento; no persiste ni valida en servidor."},
    {"id": "VC-103", "title": "Mostrar selección de entrega local o envío", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "Select de entrega existe, pero modalidades aún no definidas (por confirmar)."},
    {"id": "VC-104", "title": "Capturar datos de destino solo si se selecciona envío", "priority": "P0", "phase": "05", "status": "falta", "analysis": "No hay campos condicionales de dirección/destino."},
    {"id": "VC-105", "title": "Mostrar resumen final y precio referencial antes de enviar", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "Hay mini-product con precio en checkout; falta resumen final más explícito del flujo aprobado."},
    {"id": "VC-106", "title": "Conectar submit del formulario a la API con validación y feedback de error", "priority": "P0", "phase": "05", "status": "falta", "analysis": "Sin API ni manejo de errores de red."},
    {"id": "VC-107", "title": "Crear confirmación con folio generado por servidor", "priority": "P0", "phase": "05", "status": "prototipo", "analysis": "Pantalla Success existe con folio simulado."},
    {"id": "VC-108", "title": "Configurar número de WhatsApp real y mensaje con folio, producto y referencia", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "Número real en commercial.ts; mensaje de confirmación aún no incluye folio/producto."},
    {"id": "VC-209", "title": "Conectar botón WhatsApp de confirmación y verificar que no duplique pedidos", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "Botón abre WhatsApp genérico; no hay pedido persistido que pueda duplicarse aún."},
    {"id": "VC-210", "title": "Indicar claramente que la solicitud no reserva ni paga el equipo automáticamente", "priority": "P0", "phase": "05", "status": "parcial", "analysis": "Texto ya aparece en Success; falta reforzarlo también en checkout y políticas aprobadas."},
    # FASE 08 (P0 seguridad - urgente)
    {"id": "VC-135", "title": "Almacenar contraseñas con hash robusto (Argon2id o equivalente)", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin autenticación real."},
    {"id": "VC-136", "title": "Asegurar cookies de sesión HttpOnly, Secure y SameSite", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin cookies de sesión."},
    {"id": "VC-137", "title": "Limitar intentos de autenticación y solicitudes abusivas", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin rate limiting."},
    {"id": "VC-138", "title": "Validar inputs también en el servidor", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin servidor."},
    {"id": "VC-139", "title": "Probar controles contra SQL injection y XSS", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin pruebas de seguridad."},
    {"id": "VC-140", "title": "Añadir mitigación CSRF si se usan cookies de sesión", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Pendiente de arquitectura de auth."},
    {"id": "VC-141", "title": "Verificar autorización de cada endpoint administrativo", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin endpoints."},
    {"id": "VC-142", "title": "Validar tipo, peso y contenido de archivos cargados", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin upload."},
    {"id": "VC-143", "title": "Retirar secretos y datos reales de repositorio y logs", "priority": "P0", "phase": "08", "status": "parcial", "analysis": ".gitignore cubre .env*; WhatsApp público está intencional; falta política/auditoría de secretos."},
    {"id": "VC-144", "title": "Configurar CORS, encabezados HTTP y límites de peticiones", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin backend."},
    {"id": "VC-145", "title": "Exigir HTTPS en producción", "priority": "P0", "phase": "08", "status": "parcial", "analysis": "GitHub Pages ya sirve HTTPS para el frontend estático; falta backend producción."},
    {"id": "VC-146", "title": "Automatizar respaldos y ensayar su restauración", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin BD que respaldar."},
    {"id": "VC-147", "title": "Minimizar datos personales y limitar acceso/retención", "priority": "P0", "phase": "08", "status": "falta", "analysis": "Sin política de retención implementada."},
    {"id": "VC-148", "title": "Revisar dependencias y corregir vulnerabilidades críticas", "priority": "P0", "phase": "08", "status": "falta", "analysis": "No hay proceso/CI de auditoría de vulnerabilidades."},
    # FASE 06 P1
    {"id": "VC-027", "title": "Formalizar tokens de diseño aprovechando estilos actuales", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Estilos en index.css/Tailwind; faltan tokens documentados."},
    {"id": "VC-029", "title": "Extraer componentes reutilizables y estados (carga, vacío, error)", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Componentes internos en App.tsx; faltan estados de carga/error de API."},
    {"id": "VC-030", "title": "Validar pantalla inicial y su navegación; usar imagen/efecto ligero por ahora", "priority": "P1", "phase": "06", "status": "prototipo", "analysis": "Welcome existe; 3D aplazado."},
    {"id": "VC-031", "title": "Actualizar pantalla de avisos con condiciones aprobadas", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Notices conectada a commercialConfig; falta aprobación formal del cliente."},
    {"id": "VC-032", "title": "Validar diseño del catálogo existente frente al alcance MVP", "priority": "P1", "phase": "06", "status": "prototipo", "analysis": "Catálogo UI presente con búsqueda/filtros locales."},
    {"id": "VC-034", "title": "Completar ficha individual con información técnica verificable", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Detalle muestra atributos; depende de techInfoVerified y datos reales."},
    {"id": "VC-035", "title": "Ajustar UX del formulario de solicitud según flujo definitivo", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Checkout base listo; faltan campos de envío y copy final."},
    {"id": "VC-036", "title": "Ajustar pantalla de confirmación de folio y WhatsApp", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Success UI existe; folio/WhatsApp no operativos."},
    {"id": "VC-041", "title": "Revisar versiones móvil/tablet de todas las pantallas", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Hay CSS responsive; falta QA en dispositivos reales."},
    {"id": "VC-042", "title": "Obtener validación de los cambios de interfaz por el cliente", "priority": "P1", "phase": "06", "status": "falta", "analysis": "Sin evidencia de aceptación de UI."},
    {"id": "VC-091", "title": "Reemplazar initialProducts por datos publicados de la API", "priority": "P1", "phase": "06", "status": "falta", "analysis": "Catálogo sigue en memoria con demos."},
    {"id": "VC-094", "title": "Conectar búsqueda a datos reales", "priority": "P1", "phase": "06", "status": "prototipo", "analysis": "Búsqueda local sobre array mock."},
    {"id": "VC-095", "title": "Completar filtros por precio, capacidad, condición y disponibilidad", "priority": "P1", "phase": "06", "status": "prototipo", "analysis": "Filtros UI locales; faltan datos reales/API."},
    {"id": "VC-096", "title": "Completar ordenamiento estable por precio y fecha", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Hay ordenamiento local; falta fecha real de publicación."},
    {"id": "VC-098", "title": "Sustituir fotografías genéricas por galería vinculada a la unidad real", "priority": "P1", "phase": "06", "status": "falta", "analysis": "Fotos Unsplash genéricas."},
    {"id": "VC-100", "title": "Mostrar batería, reparaciones, estado funcional, desbloqueo, garantía y accesorios", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Campos ya se muestran en ficha; faltan datos verificados del inventario real."},
    {"id": "VC-109", "title": "Crear contacto, garantías, preguntas frecuentes y políticas comerciales", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "ContactPage y Notices existen; FAQ y políticas legales aún incompletas."},
    {"id": "VC-110", "title": "Vincular aviso de privacidad y términos desde formularios/footer", "priority": "P1", "phase": "06", "status": "parcial", "analysis": "Links legales en footer con href=null / internos parciales."},
    # FASE 07 P1
    {"id": "VC-081", "title": "Crear indicadores agregados calculados desde ventas y pedidos reales", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Dashboard con stats hardcodeados."},
    {"id": "VC-111", "title": "Conectar formulario de login con autenticación real", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Login demo."},
    {"id": "VC-112", "title": "Proteger navegación y sesiones en el layout administrativo", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Admin accesible tras login falso en estado local."},
    {"id": "VC-114", "title": "Conectar tabla del administrador con productos persistidos", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Tabla local de products state."},
    {"id": "VC-115", "title": "Conectar formulario de alta con validaciones de cada unidad", "priority": "P1", "phase": "07", "status": "parcial", "analysis": "Validaciones frontend presentes; sin persistencia."},
    {"id": "VC-116", "title": "Permitir edición de fichas, precio y condición del equipo", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Edición local en ProductsAdmin."},
    {"id": "VC-117", "title": "Administrar fotos reales desde el dashboard", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin gestor de galería/upload."},
    {"id": "VC-118", "title": "Conectar controles publicar/ocultar/archivar", "priority": "P1", "phase": "07", "status": "parcial", "analysis": "isPublished local; faltan ocultar/archivar completos."},
    {"id": "VC-119", "title": "Conectar vista de inventario a estados reales", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Inventory UI sobre estado local."},
    {"id": "VC-120", "title": "Permitir reservar, liberar y vender con reglas de concurrencia", "priority": "P1", "phase": "07", "status": "parcial", "analysis": "Cambio de status local; sin reglas/concurrencia."},
    {"id": "VC-121", "title": "Mostrar pedidos reales, no datos mock", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Pedidos hardcodeados."},
    {"id": "VC-122", "title": "Mostrar datos mínimos del comprador con acceso restringido", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin datos reales de comprador."},
    {"id": "VC-123", "title": "Permitir transiciones autorizadas de pedidos con historial", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin máquina de estados persistida."},
    {"id": "VC-124", "title": "Permitir contactar comprador por WhatsApp desde pedido", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin acción operativa en pedidos."},
    {"id": "VC-125", "title": "Crear historial de ventas en panel", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Página ventas mock."},
    {"id": "VC-126", "title": "Registrar venta completada sin confundir solicitud con ingreso", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin separación operativa solicitud/venta."},
    {"id": "VC-127", "title": "Registrar método de pago externo y estado sin procesar tarjetas", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin registro de pagos."},
    {"id": "VC-128", "title": "Implementar módulo de entrega local y envíos", "priority": "P1", "phase": "07", "status": "falta", "analysis": "No existe módulo de entregas."},
    {"id": "VC-129", "title": "Permitir guardar paquetería y guía de rastreo", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin campos/UI de guía."},
    {"id": "VC-130", "title": "Controlar estados de entrega e incidencias", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin estados de entrega."},
    {"id": "VC-131", "title": "Mostrar gráficos con ventas y productos reales", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Gráficas CSS con datos ficticios."},
    {"id": "VC-132", "title": "Permitir editar información, WhatsApp y canales del negocio", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Settings form no guarda; fuente real es commercial.ts."},
    {"id": "VC-133", "title": "Permitir editar los avisos verificados", "priority": "P1", "phase": "07", "status": "prototipo", "analysis": "Notices admin visual; sin persistencia."},
    {"id": "VC-134", "title": "Permitir cambio seguro de credenciales del administrador", "priority": "P1", "phase": "07", "status": "falta", "analysis": "Sin gestión de credenciales."},
    # FASE 09 P1
    {"id": "VC-149", "title": "Comprobar navegación entre bienvenida, avisos, catálogo y detalles", "priority": "P1", "phase": "09", "status": "parcial", "analysis": "Navegación UI existe; falta checklist formal de pruebas."},
    {"id": "VC-150", "title": "Validar resultados de búsqueda, filtros y orden", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin suite de pruebas."},
    {"id": "VC-151", "title": "Probar validación de formularios y mensajes de error", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin pruebas automatizadas/manuales documentadas."},
    {"id": "VC-152", "title": "Verificar solicitud persistida y folio único", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Aún no implementado."},
    {"id": "VC-153", "title": "Verificar enlaces de WhatsApp, mensajes y teléfonos reales", "priority": "P1", "phase": "09", "status": "parcial", "analysis": "Número configurado; mensaje con folio pendiente."},
    {"id": "VC-154", "title": "Probar rechazo de credenciales inválidas y rutas privadas", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Login no rechaza nada hoy."},
    {"id": "VC-155", "title": "Probar creación/edición/publicación desde el admin", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Pendiente de persistencia real."},
    {"id": "VC-156", "title": "Probar carga, orden y eliminación de fotos", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin feature de fotos."},
    {"id": "VC-157", "title": "Probar reservas, ventas y cancelaciones", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin flujo operativo."},
    {"id": "VC-158", "title": "Ejecutar prueba de solicitudes concurrentes sobre un mismo equipo", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin backend concurrente."},
    {"id": "VC-159", "title": "Verificar cálculos de ingresos y exclusión de cancelaciones", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Stats mock."},
    {"id": "VC-160", "title": "Probar captura, seguimiento y cierre de entregas", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin entregas."},
    {"id": "VC-161", "title": "Comprobar cifras del dashboard contra la base de datos", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin BD."},
    {"id": "VC-162", "title": "Ejecutar pruebas de integración para endpoints críticos", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin endpoints/tests."},
    {"id": "VC-163", "title": "Realizar pruebas de autorización, privacidad y seguridad básica", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin suite de seguridad."},
    {"id": "VC-164", "title": "Optimizar imágenes, carga inicial y solicitudes", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Pendiente de assets reales y API."},
    {"id": "VC-165", "title": "Probar en teléfonos y tabletas reales", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin evidencia de QA dispositivos."},
    {"id": "VC-166", "title": "Revisar contraste, teclado y opciones de movimiento reducido", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Sin auditoría a11y documentada."},
    {"id": "VC-167", "title": "Añadir metadatos, títulos y rutas para SEO", "priority": "P1", "phase": "09", "status": "parcial", "analysis": "site.json/title básico; sin rutas SEO por producto."},
    {"id": "VC-168", "title": "Corregir bugs y repetir regresión antes del despliegue", "priority": "P1", "phase": "09", "status": "falta", "analysis": "Pendiente de ciclo de QA pre-release."},
    # FASE 10 P1
    {"id": "VC-169", "title": "Definir entornos de producción y variables seguras", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin matriz de entornos."},
    {"id": "VC-170", "title": "Publicar el frontend", "priority": "P1", "phase": "10", "status": "parcial", "analysis": "Frontend prototipo publicado en GitHub Pages; no es el despliegue productivo final."},
    {"id": "VC-171", "title": "Desplegar backend y configurar acceso de API", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin backend."},
    {"id": "VC-172", "title": "Provisionar PostgreSQL de producción", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin BD producción."},
    {"id": "VC-173", "title": "Configurar almacenamiento persistente de fotografías", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin storage."},
    {"id": "VC-174", "title": "Conectar dominio y DNS", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Solo dominio github.io."},
    {"id": "VC-175", "title": "Habilitar y validar HTTPS", "priority": "P1", "phase": "10", "status": "parcial", "analysis": "HTTPS en Pages; falta stack completo."},
    {"id": "VC-176", "title": "Aplicar migraciones con plan de respaldo", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin migraciones."},
    {"id": "VC-177", "title": "Crear cuenta de administrador sin credenciales por defecto", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin cuentas reales."},
    {"id": "VC-178", "title": "Cargar inventario y fotografías reales del cliente", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Datos demo."},
    {"id": "VC-179", "title": "Actualizar WhatsApp, horarios, política comercial y datos reales", "priority": "P1", "phase": "10", "status": "parcial", "analysis": "WhatsApp/Instagram configurados; email/horarios/delivery/policies legales pendientes."},
    {"id": "VC-180", "title": "Hacer prueba de aceptación de punta a punta en producción", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Pendiente de sistema operativo."},
    {"id": "VC-181", "title": "Configurar monitoreo de errores y disponibilidad", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin monitoreo."},
    {"id": "VC-182", "title": "Documentar despliegue, recuperación y mantenimiento", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin runbook."},
    {"id": "VC-183", "title": "Entregar manual del administrador", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Sin manual."},
    {"id": "VC-184", "title": "Realizar demostración y validación con el cliente", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Pendiente."},
    {"id": "VC-185", "title": "Cerrar entrega y transferir accesos de forma segura", "priority": "P1", "phase": "10", "status": "falta", "analysis": "Pendiente."},
    # FASE 11 P3
    {"id": "VC-186", "title": "Obtener/modelar iPhone 3D con piezas independientes y licencia adecuada", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-187", "title": "Crear materiales realistas y variantes de color", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-188", "title": "Optimizar/exportar GLB o glTF", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-189", "title": "Integrar Three.js/React Three Fiber", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-190", "title": "Animar rotación 360°", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-191", "title": "Animar explosión/desensamble manteniendo alineación", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-192", "title": "Vincular continuidad al botón Siguiente", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-193", "title": "Mantener mismo render entre bienvenida y avisos", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-194", "title": "Optimizar para móviles y bajo rendimiento", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
    {"id": "VC-195", "title": "Implementar alternativa estática y movimiento reducido", "priority": "P3", "phase": "11", "status": "falta", "analysis": "Fuera del MVP."},
]


PHASES = {
    "01": "Fase 01 · Cierre de alcance y ajuste del prototipo",
    "02": "Fase 02 · Entorno y arquitectura de desarrollo",
    "03": "Fase 03 · Base de datos y operaciones seguras",
    "04": "Fase 04 · Backend, autenticación y catálogo real",
    "05": "Fase 05 · Solicitud de compra y WhatsApp",
    "06": "Fase 06 · Adaptación y conexión de la tienda pública",
    "07": "Fase 07 · Dashboard, ventas y entregas",
    "08": "Fase 08 · Seguridad, datos personales y confiabilidad",
    "09": "Fase 09 · Calidad, pruebas y optimización",
    "10": "Fase 10 · Publicación y entrega al cliente",
    "11": "Fase 11 · Fase futura - iPhone 3D (no bloquea MVP)",
}

PRIORITY_ORDER = {"P0": 0, "P1": 1, "P3": 2}
STATUS_LABEL = {
    "hecho": "estado:hecho",
    "parcial": "estado:parcial",
    "prototipo": "estado:prototipo",
    "falta": "estado:falta",
}
STATUS_EMOJI = {
    "hecho": "✅ Hecho",
    "parcial": "🟡 Parcial",
    "prototipo": "🟦 Prototipo UI (no operativo)",
    "falta": "🟥 Falta",
}


def run(cmd: list[str], check: bool = True) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{result.stderr or result.stdout}")
    return result


def ensure_label(name: str, color: str, description: str) -> None:
    result = run(
        [
            "gh",
            "label",
            "create",
            name,
            "--repo",
            REPO,
            "--color",
            color,
            "--description",
            description,
            "--force",
        ],
        check=False,
    )
    if result.returncode != 0 and "already exists" not in (result.stderr + result.stdout).lower():
        # --force updates existing labels in recent gh versions
        print(f"label warn {name}: {result.stderr.strip() or result.stdout.strip()}")


def ensure_milestone(title: str, description: str) -> int:
    listed = run(["gh", "api", f"repos/{REPO}/milestones?state=all&per_page=100"])
    milestones = json.loads(listed.stdout)
    for item in milestones:
        if item["title"] == title:
            return int(item["number"])
    created = run(
        [
            "gh",
            "api",
            f"repos/{REPO}/milestones",
            "-X",
            "POST",
            "-f",
            f"title={title}",
            "-f",
            f"description={description}",
            "-f",
            "state=open",
        ]
    )
    return int(json.loads(created.stdout)["number"])


def issue_body(task: Task) -> str:
    return f"""## Actividad `{task['id']}`

**Prioridad:** {task['priority']}  
**Fase:** {PHASES[task['phase']]}  
**Estado vs proyecto actual:** {STATUS_EMOJI[task['status']]}

### Análisis (prototipo GitHub / develop)
{task['analysis']}

### Criterio de cierre
- Código integrado y revisado mediante PR cuando corresponda
- Prueba funcional ejecutada y sin defectos críticos abiertos
- Validaciones, permisos y manejo de errores verificados
- Documentación o evidencia asociada a este Issue
- Se preserva la integridad de inventario/pedidos/ventas

### Fuente
Backlog pendiente v2.0 · 7 noviembre 2026
"""


def create_overview_issue() -> None:
    body = """## Resumen ejecutivo

Análisis del prototipo en `develop` contra *VentaCelulares Backlog Pendientes v2.0*.

### Ya tenemos (base)
- Repositorio GitHub público + ramas `master` / `develop`
- Frontend React + Vite + TypeScript + Tailwind
- Prototipo de tienda pública: welcome, avisos, catálogo, detalle, checkout, success, contacto
- Prototipo admin: login demo, dashboard, productos, inventario, pedidos, ventas, avisos, settings
- Config comercial provisional (`src/config/commercial.ts`) con WhatsApp/Instagram
- Publicación estática de preview en GitHub Pages

### Lo crítico que falta (P0)
1. Cerrar requisitos/políticas/reglas de negocio
2. Arquitectura + backend Node/Express
3. PostgreSQL + modelos reales
4. Autenticación real (hoy el login acepta cualquier dato)
5. Solicitud persistida + folio único + WhatsApp con contexto
6. Seguridad (hash, sesiones, autorización, CORS, backups)

### Precaución del backlog
Las pantallas del prototipo **no equivalen** a funciones operativas. Lo no probado contra BD/API permanece pendiente.

### Orden de ejecución recomendado
1. Cerrar requisitos y corregir prototipo
2. Configurar arquitectura
3. Base de datos y backend
4. Seguridad y login
5. Solicitudes + folios + WhatsApp
6. Conectar catálogo y dashboard
7. Pruebas
8. Despliegue
9. Fase 3D (P3, fuera del lanzamiento)

### Conteos
Ver issues etiquetadas `priority:P0`, `priority:P1`, `priority:P3`.
"""
    run(
        [
            "gh",
            "issue",
            "create",
            "--repo",
            REPO,
            "--title",
            "[META] Análisis backlog v2 vs prototipo — orden de ejecución",
            "--label",
            "documentation,priority:P0,estado:parcial",
            "--body",
            body,
        ]
    )


def main() -> int:
    print(f"Tasks loaded: {len(TASKS)}")
    expected_ids = {t["id"] for t in TASKS}
    print(f"Unique IDs: {len(expected_ids)}")

    labels = [
        ("priority:P0", "B60205", "Crítica / bloquea MVP"),
        ("priority:P1", "D93F0B", "Alta / necesaria para lanzamiento"),
        ("priority:P2", "FBCA04", "Media"),
        ("priority:P3", "0E8A16", "Futura / no bloquea MVP"),
        ("estado:falta", "B60205", "No implementado"),
        ("estado:prototipo", "1D76DB", "UI existe pero no operativa"),
        ("estado:parcial", "FBCA04", "Avance incompleto"),
        ("estado:hecho", "0E8A16", "Completado"),
        ("backlog-v2", "5319E7", "Importado del backlog pendientes v2"),
        ("fase:01", "C5DEF5", "Fase 01 alcance/prototipo"),
        ("fase:02", "C5DEF5", "Fase 02 entorno/arquitectura"),
        ("fase:03", "C5DEF5", "Fase 03 base de datos"),
        ("fase:04", "C5DEF5", "Fase 04 backend/auth/catálogo"),
        ("fase:05", "C5DEF5", "Fase 05 solicitud/WhatsApp"),
        ("fase:06", "BFDADC", "Fase 06 tienda pública"),
        ("fase:07", "BFDADC", "Fase 07 dashboard/ventas"),
        ("fase:08", "C5DEF5", "Fase 08 seguridad"),
        ("fase:09", "BFDADC", "Fase 09 calidad/pruebas"),
        ("fase:10", "BFDADC", "Fase 10 publicación"),
        ("fase:11", "D4C5F9", "Fase 11 3D futura"),
    ]
    for name, color, description in labels:
        ensure_label(name, color, description)
        print(f"label ok: {name}")

    milestone_numbers: dict[str, int] = {}
    for phase, title in PHASES.items():
        number = ensure_milestone(title, f"Backlog v2 · Fase {phase}")
        milestone_numbers[phase] = number
        print(f"milestone ok: {title} #{number}")

    create_overview_issue()
    print("overview issue created")

    ordered = sorted(
        TASKS,
        key=lambda t: (PRIORITY_ORDER[t["priority"]], t["phase"], t["id"]),
    )

    created = 0
    for task in ordered:
        title = f"[{task['id']}][{task['priority']}] {task['title']}"
        kind = "bug" if task["id"] in {"VC-065", "VC-075", "VC-206"} else "enhancement"
        labels_csv = ",".join(
            [
                "backlog-v2",
                f"priority:{task['priority']}",
                f"fase:{task['phase']}",
                STATUS_LABEL[task["status"]],
                kind,
            ]
        )

        cmd = [
            "gh",
            "issue",
            "create",
            "--repo",
            REPO,
            "--title",
            title,
            "--label",
            labels_csv,
            "--milestone",
            PHASES[task["phase"]],
            "--body",
            issue_body(task),
        ]
        for attempt in range(5):
            result = run(cmd, check=False)
            if result.returncode == 0:
                print(result.stdout.strip())
                created += 1
                break
            err = (result.stderr or result.stdout).strip()
            if "was not found" in err.lower() or "label" in err.lower():
                # retry after ensuring labels
                time.sleep(1)
                continue
            if "rate limit" in err.lower():
                time.sleep(5 + attempt * 5)
                continue
            raise RuntimeError(err)
        else:
            raise RuntimeError(f"Failed to create issue for {task['id']}")
        time.sleep(0.15)

    print(f"Created {created} task issues + 1 overview")
    return 0


if __name__ == "__main__":
    sys.exit(main())
