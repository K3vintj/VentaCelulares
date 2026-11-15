# Design System — VentaCelulares

Sistema centralizado de Design Tokens para el sitio público y el dashboard administrativo.

**Stack:** React 19 · TypeScript · Tailwind CSS v4 · CSS Custom Properties  
**Archivo fuente:** `src/styles/design-tokens.css`  
**Consumo global:** `src/index.css` (`@import './styles/design-tokens.css'`)

---

## Principios de marca

| Rol | Uso |
|-----|-----|
| **Negro** | Color dominante de fondos y atmósfera premium |
| **Dorado** | Bordes, líneas decorativas, acentos y focus |
| **Verde** | WhatsApp, disponibilidad y estados positivos |
| **Rojo** | Errores y estados cancelado/vendido |

---

## Paleta de colores

### Primitivos (valores crudos)

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-black-primary` | `#080808` | Fondo principal |
| `--color-black-secondary` | `#111113` | Paneles / surface |
| `--color-gray-graphite` | `#1C1C1E` | Superficies elevadas |
| `--color-gray-mid` | `#2C2C2E` | Líneas / divisores |
| `--color-white` | `#F5F5F7` | Texto primario |
| `--color-gray-text` | `#A1A1A6` | Texto secundario |
| `--color-gold-primary` | `#D4AF37` | Acento principal |
| `--color-gold-soft` | `#C6A667` | Acento suave / hover |
| `--color-green-primary` | `#22C55E` | Éxito / disponible |
| `--color-green-dark` | `#15803D` | WhatsApp / éxito oscuro |
| `--color-red-error` | `#FF453A` | Error |
| `--color-warning-raw` | `#FFB340` | Advertencia / reservado |

### Contraste (WCAG 2.2 AA)

| Combinación | Ratio aprox. | Resultado |
|-------------|--------------|-----------|
| `#F5F5F7` sobre `#080808` | ≥ 15:1 | AA / AAA texto |
| `#A1A1A6` sobre `#080808` | ≥ 7:1 | AA texto normal |
| `#D4AF37` sobre `#080808` | ≥ 8:1 | AA acentos / texto |
| `#080808` sobre `#D4AF37` | ≥ 8:1 | AA botones gold |
| `#ecfdf5` sobre `#15803D` | ≥ 4.5:1 | AA botones WhatsApp |
| `#bbf7d0` sobre fondos dark+green | ≥ 4.5:1 | AA badges éxito |
| `#ffb4ae` sobre `#351614` | ≥ 4.5:1 | AA mensajes error |

No usar dorado claro (`#C6A667`) como único color de texto de cuerpo sobre negro sin verificar contraste en el contexto concreto. Preferir `--text-primary` o `--text-secondary` para párrafos.

---

## A. Tokens primitivos

### Tipografía

| Token | Valor |
|-------|-------|
| `--font-sans` | Inter, ui-sans-serif, system-ui, sans-serif |
| `--font-display` | Manrope, Inter, … (titulares) |
| `--text-xs` … `--text-4xl` | 12 · 14 · 16 · 18 · 20 · 24 · 32 · 48 px |
| `--font-weight-normal` … `--font-weight-bold` | 400 · 500 · 600 · 700 |

### Espaciado (múltiplos de 4px)

| Token | px |
|-------|----|
| `--spacing-1` | 4 |
| `--spacing-2` | 8 |
| `--spacing-3` | 12 |
| `--spacing-4` | 16 |
| `--spacing-5` | 20 |
| `--spacing-6` | 24 |
| `--spacing-8` | 32 |
| `--spacing-12` | 48 |
| `--spacing-16` | 64 |

### Bordes y radios

| Token | Valor |
|-------|-------|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 16px |
| `--radius-xl` | 20px |
| `--radius-full` | 9999px |
| `--border-width` | 1px |
| `--border-width-2` | 2px |

### Sombras

| Token | Uso |
|-------|-----|
| `--shadow-soft` | Elevación suave |
| `--shadow-elevated` | Hover de tarjetas |
| `--shadow-card-featured` | Modales / login |
| `--shadow-gold-glow` | Resalte dorado discreto |

### Movimiento

| Token | Valor |
|-------|-------|
| `--duration-fast` / `--motion-fast` | 150ms |
| `--duration-normal` / `--motion-normal` | 250ms |
| `--duration-slow` / `--motion-slow` | 400ms |
| `--ease-standard` / `--ease-entrance` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `--ease-out` / `--ease-default` | `ease` |

---

## B. Tokens semánticos

Usar estos tokens en UI nueva. No hardcodear hex en componentes.

| Token | Rol |
|-------|-----|
| `--background` | Lienzo principal |
| `--background-secondary` | Lienzo admin |
| `--surface` | Paneles / cards base |
| `--surface-elevated` | Superficie elevada |
| `--text-primary` | Texto principal |
| `--text-secondary` | Texto secundario |
| `--text-muted` | Texto atenuado |
| `--border-default` | Borde estándar |
| `--border-accent` | Borde dorado |
| `--accent-primary` | Dorado principal |
| `--accent-secondary` | Dorado suave |
| `--success` | Éxito / disponible |
| `--warning` | Advertencia / reservado |
| `--error` | Error / vendido |
| `--focus-ring` | Anillo de foco |
| `--disabled` | Opacidad deshabilitado (0.45) |
| `--link` / `--link-hover` | Enlaces |

### Alias legacy (compatibilidad)

Los estilos existentes pueden seguir usando `--ink`, `--panel`, `--graphite`, `--paper`, `--muted`, `--gold`, `--gold-soft`, `--green`, `--green-dark`, `--danger`, `--warning`, `--border-gold`. Todos apuntan a los tokens semánticos.

---

## C. Tokens de componentes

| Dominio | Prefijo | Ejemplos |
|---------|---------|----------|
| Tarjetas de producto | `--card-*` | `--card-bg`, `--card-border`, `--card-available-border` |
| Botones | `--btn-*` | `--btn-primary-bg`, `--btn-gold-bg`, `--btn-whatsapp-bg` |
| Formularios | `--field-*` | `--field-bg`, `--field-focus-border`, `--field-error-text` |
| Disponibilidad | `--status-*` | `--status-available-fg`, `--status-sold-bg` |
| Tablas admin | `--table-*` | `--table-header-bg`, `--table-cell-fg` |
| Modales | `--modal-*` | `--modal-bg`, `--modal-backdrop`, `--modal-shadow` |
| Navbar | `--navbar-*` | `--navbar-height`, `--navbar-border`, `--navbar-link` |
| Footer | `--footer-*` | `--footer-heading`, `--footer-border`, `--footer-text` |
| Skeletons | `--skeleton-*` | `--skeleton-base`, `--skeleton-highlight`, `--skeleton-duration` |
| Admin shell | `--admin-*` | `--admin-sidebar-bg`, `--admin-stat-bg` |

---

## Reglas de uso

1. **Un solo origen de verdad:** cambia identidad visual en `src/styles/design-tokens.css`.
2. **Preferir semánticos** sobre primitivos en CSS de componentes.
3. **Dorado** = acento (bordes, focus, CTAs gold), no fondos masivos.
4. **Verde** = WhatsApp y estados positivos únicamente.
5. **Negro** permanece dominante; no aclarar el canvas sin necesidad.
6. **No instalar** librerías de tokens adicionales.
7. **No romper** alias legacy (`--ink`, `--gold`, …) sin migrar consumidores.
8. **Focus visible:** usar `outline: var(--border-width-2) solid var(--focus-ring)`.
9. **Reduced motion:** respetar `prefers-reduced-motion` (ya aplicado a skeletons/animaciones).
10. **Tailwind v4:** los colores en `@theme` generan utilidades (`bg-gold-primary`, `text-white`, `rounded-lg`, etc.).

---

## Ejemplos de implementación

### CSS (clases del producto)

```css
.product-card {
  background: var(--card-bg);
  border: var(--border-width) solid var(--card-border);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow-hover);
}

.btn-whatsapp {
  color: var(--btn-whatsapp-fg);
  background: var(--btn-whatsapp-bg);
  border: var(--border-width) solid var(--btn-whatsapp-border);
}
```

### Tailwind utilities (cuando convenga en JSX)

```tsx
<div className="bg-black-primary text-white border border-gold-primary rounded-lg p-4">
  <p className="text-gray-text text-sm">Texto secundario</p>
  <button className="bg-gold-primary text-black-primary font-semibold">
    Solicitar
  </button>
</div>
```

### Cambiar la identidad (ejemplo)

Para ajustar el dorado de marca, editar solo el primitivo:

```css
/* src/styles/design-tokens.css */
--color-gold-primary: #d4af37;
```

`--accent-primary`, `--btn-gold-bg`, `--border-accent`, `--focus-ring` y utilidades Tailwind se actualizan en cascada.

---

## Indicaciones para futuros desarrolladores

1. Antes de añadir un hex nuevo, busca si ya existe un token semántico o de componente.
2. Si el valor es específico de un patrón UI (botón, tabla, modal), añade un token `--component-*` en la sección C.
3. Documenta tokens nuevos en esta página.
4. Verifica contraste AA en texto y botones antes de merge.
5. Ejecuta `pnpm build` (o `npm run build`) tras cambios en tokens.
6. No modifiques lógica de negocio, rutas ni Supabase para cambios visuales.
7. Sitio público y admin comparten el mismo archivo de tokens; no crear paletas paralelas.

---

## Mapa de archivos

```
src/
  styles/
    design-tokens.css   ← Primitivos (@theme) + semánticos + componentes (:root)
  index.css             ← Estilos de producto; consume tokens
  components/           ← Skeletons y UI; clases que ya usan tokens vía CSS
docs/
  design-system.md      ← Este documento
```
