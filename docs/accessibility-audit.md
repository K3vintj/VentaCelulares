# Auditoría de accesibilidad — VentaCelulares

**Fecha de revisión:** 13 de noviembre de 2026  
**Estándar objetivo:** WCAG 2.2 niveles A y AA  
**Rama revisada:** `develop`  
**Alcance:** sitio público + panel administrativo (prototipo frontend)  
**Autor de la pasada:** auditoría asistida por código + contraste calculado programáticamente  

> Esta revisión **no declara conformidad total WCAG 2.2 AA**.  
> Las herramientas automatizadas y la revisión de código no sustituyen pruebas completas con lectores de pantalla ni QA en dispositivos reales.

---

## 1. Vistas evaluadas

| Vista | Estado en código | Evaluada |
|-------|------------------|----------|
| Bienvenida | Presente | Sí |
| Avisos / condiciones | Presente | Sí |
| Catálogo | Presente | Sí |
| Detalle de producto | Presente | Sí |
| Solicitud de compra (checkout) | Presente | Sí |
| Confirmación de solicitud | Presente | Sí |
| Contacto | Presente | Sí |
| Footer | Presente | Sí |
| Login administrativo | Presente | Sí |
| Dashboard | Presente | Sí |
| Productos (CRUD modal) | Presente | Sí |
| Inventario | Presente | Sí |
| Pedidos | Presente (mock) | Sí |
| Ventas | Presente (mock) | Sí |
| Configuración / avisos admin | Presente (mock) | Sí |
| Entregas | **No existe** como vista independiente | N/A — pendiente de producto |

---

## 2. Criterios WCAG aplicables (A / AA) considerados

Se revisaron, entre otros: 1.1.1, 1.3.1, 1.3.2, 1.3.4, 1.3.5, 1.4.1, 1.4.3, 1.4.4, 1.4.5, 1.4.10, 1.4.11, 1.4.12, 1.4.13, 2.1.1, 2.1.2, 2.2.2, 2.3.1, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.5, 2.4.6, 2.4.7, 2.4.11, 2.5.3, 2.5.8, 3.2.1, 3.2.2, 3.3.1, 3.3.2, 3.3.3, 3.3.4, 4.1.2, 4.1.3.

---

## 3. Hallazgos principales (auditoría inicial)

| ID | Severidad | Componente | Criterio | Impacto | Corrección |
|----|-----------|------------|----------|---------|------------|
| H01 | Alta | Tokens / CSS | 1.4.3 | Placeholders ~2.9:1 y encabezados de tabla ~3.1:1 ilegibles | Tokens placeholder/table-header/text-faint ajustados |
| H02 | Alta | Global | 2.4.7 | `outline: none` sin foco visible consistente | Foco `:focus-visible` global + componentes clave |
| H03 | Alta | App / navegación | 2.4.1 / 2.4.3 | Sin skip link ni foco al cambiar de vista | `SkipLink` + `useViewFocus` + `#main-content` |
| H04 | Alta | Modal productos | 2.1.2 / 2.4.3 / 4.1.2 | Sin `dialog`, Escape ni trampa de foco | `role="dialog"`, `useFocusTrap`, Escape, restore focus |
| H05 | Alta | Formularios | 1.3.1 / 3.3.1 / 3.3.2 | Errores sin `aria-describedby`; labels frágiles | `Field` con `htmlFor`, errores asociados, `aria-invalid` |
| H06 | Media | Login | 1.3.5 / 3.3.7 | Sin `autocomplete`; toggle password sin nombre | `autocomplete`, `aria-label` en mostrar/ocultar |
| H07 | Media | Catálogo | 4.1.3 / 2.4.6 | Filtros sin anuncio ni `aria-pressed` | `aria-live`, `aria-pressed`, labels de búsqueda |
| H08 | Media | Header / admin | 4.1.2 / 2.5.8 | Menú móvil sin `aria-expanded`; targets pequeños | Atributos ARIA + targets ≥44px en controles clave |
| H09 | Media | Dashboard | 1.1.1 | Gráficas sin alternativa textual | Tablas ocultas + `role="img"` con nombre |
| H10 | Media | Tipografía admin | 1.4.3 / 1.4.4 | Textos 7–9px con contraste dudoso | Tamaños y colores elevados a tokens AA |
| H11 | Media | Estados | 1.4.1 | Riesgo de depender solo del color | Badges con texto + prefijo sr-only “Estado:” |
| H12 | Baja | Bienvenida | 2.2.2 | Animación/intro sin omitir claro | CTA “Omitir animación” + omitir al catálogo |
| H13 | Info | Entregas | — | Vista solicitada no implementada | Registrar como pendiente de producto |
| H14 | Info | Pruebas AT | — | Sin sesión NVDA/VoiceOver en esta pasada | Pendiente de QA asistiva real |

---

## 4. Contraste (muestras calculadas)

Ratios aproximados (sRGB relativo):

| Par | Antes | Después / resultado |
|-----|-------|---------------------|
| `#F5F5F7` / `#080808` | ~18.4:1 | Cumple AA/AAA |
| `#A1A1A6` / `#080808` | ~7.8:1 | Cumple AA |
| `#D4AF37` / `#080808` | ~9.5:1 | Cumple (acentos/texto grande) |
| Placeholder `#626267` / `#18181B` | ~2.9:1 | Corregido a `#94949A` (≥4.5:1) |
| Table header `#66666C` / `#18181B` | ~3.1:1 | Corregido a `#9B9BA1` (≥4.5:1) |
| Text faint `#68686D` / `#080808` | ~3.6:1 | Alineado a `#77777D` (~4.5:1) |

**Política:** no usar dorado/verde como único indicador de estado; el texto del badge permanece visible.

---

## 5. Correcciones realizadas en esta pasada

### Código / arquitectura a11y
- `src/components/a11y/SkipLink.tsx`
- `src/hooks/use-focus-trap.ts`
- `src/hooks/use-view-focus.ts`

### Design tokens
- `src/styles/design-tokens.css` — contraste placeholder, headers de tabla, faint text, tamaño de status

### Estilos
- `src/index.css` — skip link, focus visible global, scroll-padding, targets táctiles, tipografía admin, reduced motion (ya existente, reforzado con skeletons)

### UI / vistas
- `src/App.tsx` — Field accesible, Welcome skip, StoreHeader/AdminShell ARIA, catálogo live region, checkout autocomplete, login password, modal dialog + focus trap, tablas con `scope`, gráficas con alternativa, toasts con live regions, `#main-content`

### Ya existía y se conservó
- Skeletons con `aria-hidden`
- `AsyncRegion` / `QueryState` con `aria-busy` y anuncios
- Footer con landmarks y nombres accesibles
- Iconos decorativos con `aria-hidden`

---

## 6. Evidencias de pruebas

| Prueba | Resultado | Notas |
|--------|-----------|-------|
| `pnpm exec tsc --noEmit` | OK | Sin errores de tipos |
| `pnpm run build` | OK | Build de producción correcto |
| Contraste programático (script local) | Parcial | Pares clave recalculados; no cubre 100% de combinaciones dinámicas |
| axe-core / Lighthouse | **No ejecutados** en esta sesión | No hay script/CI de a11y en el proyecto; no se inventan resultados |
| Teclado (Tab / Escape / modal) | Revisado en código | Requiere verificación manual en navegador |
| NVDA / VoiceOver | **No ejecutados** | Sin acceso documentado a sesión AT en esta pasada |
| Zoom 200% / reflow 320px | Revisado por CSS | Requiere verificación visual manual |

---

## 7. Criterios / riesgos pendientes

1. **Pruebas con lectores de pantalla** (NVDA + Chrome/Firefox, VoiceOver + Safari) en flujos públicos y admin.
2. **Auditoría axe/Lighthouse** integrada en CI (recomendado; no añadida para evitar dependencia no solicitada).
3. **Vista Entregas** aún no existe: auditar cuando se implemente.
4. **Autenticación real / Supabase**: cuando el backend esté conectado, revalidar errores de login, sesiones y mensajes live.
5. **Galería de producto**: thumbs con nombre; valorar navegación por flechas si crece a carrusel completo.
6. **SEO / `document.title` por vista**: no hay router; títulos dinámicos pendientes (2.4.2 parcial a nivel de app SPA).
7. **Animación 3D futura**: mantener alternativa estática + `prefers-reduced-motion` (ya previsto en backlog P3).
8. **Confirmación nativa `window.confirm`** al eliminar productos: limitada para AT; sustituir por diálogo accesible propio.
9. **Densidad tipográfica residual** en algunos metadatos admin: vigilar en zoom 200%.
10. **No declarar AA completo** hasta cerrar pendientes 1–2 y revalidar contraste en estados hover/disabled reales.

---

## 8. Limitaciones de la revisión

- Revisión basada en código fuente del frontend; no hay API/Supabase activa que cambie DOM de error en runtime.
- No se realizaron capturas de herramientas automáticas externas.
- El panel sigue siendo prototipo con datos mock: algunos controles (exportar, olvidé contraseña) no tienen flujo real.
- No se modificó la arquitectura de Supabase ni se añadieron dependencias nuevas de testing a11y.
- No se hizo commit/push (según instrucción del solicitante).

---

## 9. Criterios de aceptación (estado)

| Criterio | Estado |
|----------|--------|
| Funciones principales usables por teclado | Mejorado — verificar manualmente |
| Contraste de textos/componentes clave | Corregido en tokens auditados |
| Formularios con labels y errores asociados | Mejorado (`Field`) |
| Controles con nombre accesible | Mejorado |
| Estados no solo por color | Mejorado (texto + sr-only) |
| Modales con foco correcto | Implementado en modal de productos |
| Zoom / móvil | Mejorado en CSS — QA pendiente |
| `prefers-reduced-motion` | Presente |
| Reporte documentado | Este archivo |
| Sin incumplimientos A/AA conocidos sin registrar | Incumplimientos conocidos corregidos o listados como pendientes |

**Veredicto:** avance sustancial hacia WCAG 2.2 AA en el prototipo actual, **sin declaración de conformidad total**.
