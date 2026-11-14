import {
  ChangeEvent,
  FormEvent,
  ReactElement,
  ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  commercialConfig,
  getConfiguredSocialLinks,
  getProductWarrantyText,
  getWarrantyLabel,
  openWhatsApp,
} from "@/config/commercial"
import {
  CatalogGridSkeleton,
  CommercialConfigSkeleton,
  DashboardStatsSkeleton,
  FormSkeleton,
  ProductDetailSkeleton,
  TableSkeleton,
} from "@/components/skeletons"
import { EmptyState, QueryState } from "@/components/ui/QueryState"
import { AsyncRegion } from "@/components/ui/AsyncRegion"
import { SkipLink } from "@/components/a11y/SkipLink"
import { useLocalResource } from "@/hooks/use-local-resource"
import { useFocusTrap } from "@/hooks/use-focus-trap"
import { useViewFocus } from "@/hooks/use-view-focus"

type PublicView =
  | "welcome"
  | "notices"
  | "catalog"
  | "detail"
  | "checkout"
  | "success"
  | "contact"
type AdminView = "dashboard" | "products" | "inventory" | "orders" | "sales" | "notices" | "settings"
/** Estado de inventario (independiente de la condición comercial). */
type Status = "Disponible" | "Reservado" | "Vendido"

/**
 * Condición comercial por unidad.
 * Pendiente de integración: cuando exista API/BD, persistir `condition`
 * como enum restringido a estos tres valores por registro/unidad.
 */
type DeviceCondition = "nuevo" | "seminuevo" | "usado"

type BiometricOption = "Face ID" | "Touch ID" | "No aplica"

type Product = {
  id: string
  name: string
  storage: string
  color: string
  battery: string
  price: number
  status: Status
  condition: DeviceCondition
  /** Nota opcional de la unidad; no sustituye ni amplía el enum de condición. */
  conditionNote?: string
  warrantyDays: number
  physicalCondition: string
  screenCondition: string
  cameraStatus: string
  biometric: BiometricOption
  unlockStatus: string
  repairHistory: string
  accessories: string
  observations: string
  image: string
  description: string
  /** Verificación comercial obligatoria para publicar. */
  verifiedNotRefurbished: boolean
  verifiedNoReplacedParts: boolean
  /** Si es false, la ficha marca la información técnica como no verificada. */
  techInfoVerified: boolean
  /** false = borrador local; no aparece en el catálogo público. */
  isPublished: boolean
}

const createProductDefaults = (): Omit<
  Product,
  "id" | "name" | "storage" | "color" | "battery" | "price" | "status" | "condition" | "image" | "description"
> => ({
  conditionNote: undefined,
  warrantyDays: commercialConfig.policies.warrantyDays,
  physicalCondition: "",
  screenCondition: "",
  cameraStatus: "",
  biometric: "Face ID",
  unlockStatus: commercialConfig.policies.unlockedStatusLabel,
  repairHistory: "Sin reparaciones conocidas",
  accessories: "",
  observations: "",
  verifiedNotRefurbished: false,
  verifiedNoReplacedParts: false,
  techInfoVerified: false,
  isPublished: false,
})

const DEVICE_CONDITIONS: DeviceCondition[] = ["nuevo", "seminuevo", "usado"]

const CONDITION_LABELS: Record<DeviceCondition, string> = {
  nuevo: "Nuevo",
  seminuevo: "Seminuevo",
  usado: "Usado",
}

const isDeviceCondition = (value: string): value is DeviceCondition =>
  DEVICE_CONDITIONS.includes(value as DeviceCondition)

/** Compatibilidad con datos legacy tipo "Seminuevo · Excelente". */
const normalizeCondition = (value: string): DeviceCondition => {
  const normalized = value.toLowerCase().trim()
  if (isDeviceCondition(normalized)) return normalized
  if (normalized.includes("seminuevo")) return "seminuevo"
  if (normalized.includes("usado")) return "usado"
  if (normalized.includes("nuevo")) return "nuevo"
  return "seminuevo"
}

const getConditionLabel = (condition: DeviceCondition | string) =>
  CONDITION_LABELS[normalizeCondition(condition)]

const photos = [
  "https://images.unsplash.com/photo-1697636979316-cc18d4369e66?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1697636979311-511164585ca9?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1511140973288-19bf21d7e771?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1697636979792-fb057f6cbe8d?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1759588071895-6b5efd5502af?auto=format&fit=crop&w=1200&q=88",
]

const demoVerifiedFields = {
  warrantyDays: commercialConfig.policies.warrantyDays,
  physicalCondition: "Excelente",
  screenCondition: "Original · Sin detalles",
  cameraStatus: "Funcionamiento correcto",
  biometric: "Face ID" as BiometricOption,
  unlockStatus: commercialConfig.policies.unlockedStatusLabel,
  repairHistory: "Sin reparaciones conocidas",
  accessories: "Cable USB-C",
  observations: "",
  verifiedNotRefurbished: true,
  verifiedNoReplacedParts: true,
  techInfoVerified: true,
  isPublished: true,
}

const initialProducts: Product[] = [
  {
    id: "VC-001",
    name: "iPhone 15 Pro",
    storage: "256 GB",
    color: "Titanio natural",
    battery: "98%",
    price: 22990,
    status: "Disponible",
    condition: "seminuevo",
    conditionNote: "Excelente",
    image: photos[0],
    description:
      "Titanio de calidad aeroespacial, cámara Pro y rendimiento extraordinario. Equipo cuidadosamente revisado.",
    ...demoVerifiedFields,
    physicalCondition: "Excelente",
  },
  {
    id: "VC-002",
    name: "iPhone 14 Pro Max",
    storage: "256 GB",
    color: "Negro espacial",
    battery: "91%",
    price: 19490,
    status: "Disponible",
    condition: "seminuevo",
    conditionNote: "Muy bueno",
    image: photos[1],
    description:
      "Una pantalla amplia y brillante, sistema de cámaras Pro y batería para todo el día.",
    ...demoVerifiedFields,
    physicalCondition: "Muy bueno",
  },
  {
    id: "VC-003",
    name: "iPhone 15",
    storage: "128 GB",
    color: "Negro",
    battery: "100%",
    price: 16990,
    status: "Reservado",
    condition: "nuevo",
    conditionNote: "Caja abierta",
    image: photos[2],
    description:
      "Dynamic Island, cámara principal de 48 MP y diseño resistente con vidrio tintado.",
    ...demoVerifiedFields,
    physicalCondition: "Nuevo · Caja abierta",
    accessories: "Cable USB-C · Caja",
  },
  {
    id: "VC-004",
    name: "iPhone 13 Pro",
    storage: "256 GB",
    color: "Grafito",
    battery: "88%",
    price: 13990,
    status: "Disponible",
    condition: "usado",
    conditionNote: "Bueno",
    image: photos[3],
    description:
      "Pantalla ProMotion, cámara triple y un acabado grafito atemporal.",
    ...demoVerifiedFields,
    physicalCondition: "Bueno",
  },
  {
    id: "VC-005",
    name: "iPhone 14",
    storage: "128 GB",
    color: "Blanco estelar",
    battery: "94%",
    price: 14490,
    status: "Vendido",
    condition: "seminuevo",
    conditionNote: "Excelente",
    image: photos[4],
    description:
      "Diseño ligero, gran cámara y funciones de seguridad avanzadas.",
    ...demoVerifiedFields,
    physicalCondition: "Excelente",
  },
  {
    id: "VC-006",
    name: "iPhone 13",
    storage: "128 GB",
    color: "Medianoche",
    battery: "90%",
    price: 10990,
    status: "Disponible",
    condition: "usado",
    conditionNote: "Muy bueno",
    image: photos[0],
    description:
      "Potencia, equilibrio y excelente calidad fotográfica para todos los días.",
    ...demoVerifiedFields,
    physicalCondition: "Muy bueno",
  },
]

const mxn = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)

const iconPaths: Record<string, ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 2.7 8 7 10 4.3-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  phone: (
    <>
      <path d="M7 3h3l1 5-2 1c1 3 3 5 6 6l1-2 5 1v3c0 2-2 4-4 4C9 20 4 15 3 7c0-2 2-4 4-4Z" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
      <path d="M12 11v10" />
    </>
  ),
  orders: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7L6.5 6 4.5 9.5l2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4L9 17a8 8 0 0 0 1.4 1l.3 2.6h4L15 18a8 8 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
      <path d="m14 7 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 14v6h14v-6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 7 9-7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  facebook: (
    <>
      <path d="M14 8h2V5h-2c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.2l.8-3H13V9c0-.6.4-1 1-1Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 4v10.2a3.8 3.8 0 1 1-3.2-3.75V13a1.6 1.6 0 1 0 1.2 1.55V4h2Z" />
      <path d="M14 6.5c1.2 1.6 2.8 2.4 4.5 2.6" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Logo({
  compact = false,
  onClick,
}: {
  compact?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <img
        src={commercialConfig.logoSrc}
        alt=""
        className="logo-img"
      />
      {!compact && (
        <span className="logo-text">
          Alexx<span className="logo-accent">ziño</span>{" "}
          <span className="muted">Store</span>
        </span>
      )}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        className={`logo logo-button${compact ? " logo-compact" : ""}`}
        onClick={onClick}
        aria-label={`Ir al catálogo de ${commercialConfig.businessName}`}
      >
        {content}
      </button>
    )
  }
  return (
    <div className={`logo${compact ? " logo-compact" : ""}`}>{content}</div>
  )
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-controls": ariaControls,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger" | "whatsapp" | "gold"
  icon?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
  "aria-label"?: string
  "aria-expanded"?: boolean
  "aria-controls"?: string
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      <span>{children}</span>
      {icon && <Icon name={icon} size={18} />}
    </button>
  )
}

function StatusBadge({ status }: { status: Status | string }) {
  return (
    <span
      className={`status status-${status.toLowerCase().replace(/ /g, "-")}`}
    >
      <i aria-hidden="true" />
      <span className="sr-only">Estado: </span>
      {status}
    </span>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  required = false,
  defaultValue,
  name,
  value,
  onChange,
  error,
  min,
  max,
  step,
  autoComplete,
  id,
  children,
}: {
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  defaultValue?: string
  name?: string
  value?: string | number
  onChange?: (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void
  error?: string
  min?: number | string
  max?: number | string
  step?: number | string
  autoComplete?: string
  id?: string
  children?: ReactNode
}) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const labelId = `${fieldId}-label`
  const errorId = `${fieldId}-error`
  const describedBy = error ? errorId : undefined
  const isNativeChild =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type)
  const labelContent = (
    <>
      {label}
      {required && (
        <>
          {" "}
          <span className="required-marker" aria-hidden="true">
            *
          </span>
          <span className="sr-only"> (obligatorio)</span>
        </>
      )}
    </>
  )
  const control = !children ? (
    <input
      id={fieldId}
      type={type}
      name={name}
      placeholder={placeholder}
      required={required}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      autoComplete={autoComplete}
      aria-required={required || undefined}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy}
    />
  ) : isNativeChild ? (
    cloneElement(children as ReactElement<Record<string, unknown>>, {
      id: fieldId,
      name: name ?? (children.props as { name?: string }).name,
      required: required || (children.props as { required?: boolean }).required,
      "aria-required":
        required || (children.props as { required?: boolean }).required || undefined,
      "aria-invalid": error ? true : undefined,
      "aria-describedby": describedBy,
    })
  ) : (
    children
  )
  return (
    <div className={`field${error ? " field-error" : ""}`}>
      <label htmlFor={fieldId} id={labelId}>
        {labelContent}
      </label>
      {control}
      {error && (
        <em className="field-error-msg" id={errorId} role="alert">
          {error}
        </em>
      )}
    </div>
  )
}

function Welcome({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <main id="main-content" className="welcome page-enter" tabIndex={-1}>
      <div className="welcome-glow" aria-hidden="true" />
      <header className="welcome-top">
        <Logo onClick={onSkip} />
        <button type="button" className="text-link" onClick={onSkip}>
          Omitir introducción e ir al catálogo
        </button>
      </header>
      <div className="welcome-copy">
        <span className="eyebrow">Selección premium · México</span>
        <h1>
          Tu próximo iPhone
          <br />
          <em>comienza aquí.</em>
        </h1>
        <p>
          Explora una selección curada de iPhones y encuentra el ideal para ti,
          con información clara en cada detalle.
        </p>
        <div className="welcome-actions">
          <Button variant="gold" icon="arrow" onClick={onNext}>
            Siguiente
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Omitir animación
          </Button>
        </div>
        <span className="microcopy">
          <span className="sr-only">Disponibilidad: </span>
          Equipos nuevos y seminuevos
        </span>
      </div>
      <div className="hero-product">
        <div className="hero-orbit" aria-hidden="true" />
        <img src={photos[0]} alt="iPhone en iluminación de estudio" />
        <div className="hero-caption">
          <span>Selección 01</span>
          <strong>Diseño que destaca.</strong>
        </div>
      </div>
    </main>
  )
}

function Notices({
  onContinue,
  onBack,
}: {
  onContinue: () => void
  onBack: () => void
}) {
  const warrantyLink = commercialConfig.policies.warrantyTermsHref
  const notices = commercialConfig.notices.items
  const featured = notices.find((item) => item.featured)
  const rest = notices.filter((item) => !item.featured)
  return (
    <main id="main-content" className="notices page-enter" tabIndex={-1}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <nav className="simple-nav" aria-label="Secundaria">
        <button type="button" className="icon-button" onClick={onBack}>
          <Icon name="arrow" />
          <span>Volver</span>
        </button>
        <Logo onClick={onContinue} />
      </nav>
      <section className="notices-inner">
        <div className="section-heading">
          <span className="eyebrow">{commercialConfig.notices.eyebrow}</span>
          <h1>
            {commercialConfig.notices.titleLead}
            <br />
            <em>{commercialConfig.notices.titleAccent}</em>
          </h1>
          <p>{commercialConfig.notices.subtitle}</p>
        </div>
        <div className="notice-list">
          {featured && (
            <article className="notice-card notice-featured">
              <div className="notice-icon notice-icon-positive" aria-hidden="true">
                <Icon name={featured.icon} size={22} />
              </div>
              <div>
                <span className="notice-badge">Destacado</span>
                <h3>{featured.title}</h3>
                <p>{featured.text}</p>
              </div>
            </article>
          )}
          <div className="notice-grid">
            {rest.map((item) => (
              <article
                className={`notice-card${item.positive ? " notice-positive" : ""}`}
                key={item.id}
              >
                <div
                  className={`notice-icon${item.positive ? " notice-icon-positive" : ""}`}
                  aria-hidden="true"
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="notice-disclaimer">
            <Icon name="info" size={18} />
            <p>
              {commercialConfig.notices.disclaimer} Garantía vigente:{" "}
              {getWarrantyLabel(commercialConfig.policies.warrantyDays)}.
            </p>
          </div>
          {warrantyLink ? (
            <a
              className="notice-guarantee-link"
              href={warrantyLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Condiciones completas de garantía
              <Icon name="arrow" size={16} />
            </a>
          ) : (
            <p className="notice-guarantee-pending">
              Condiciones completas de garantía · Espacio reservado para enlace
              verificado
            </p>
          )}
          <Button
            variant="gold"
            onClick={onContinue}
            icon="arrow"
            className="wide-mobile"
          >
            Explorar iPhones
          </Button>
        </div>
      </section>
    </main>
  )
}

function StoreHeader({
  goCatalog,
  goAdmin,
  goContact,
  goNotices,
}: {
  goCatalog: () => void
  goAdmin: () => void
  goContact?: () => void
  goNotices?: () => void
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  return (
    <header className="store-header">
      <Logo onClick={goCatalog} />
      <nav
        id={menuId}
        className={open ? "store-nav open" : "store-nav"}
        aria-label="Navegación principal"
      >
        <button type="button" onClick={goCatalog}>
          Catálogo
        </button>
        <button type="button" onClick={goNotices || goCatalog}>
          Condiciones
        </button>
        <button type="button" onClick={goContact || goCatalog}>
          Contacto
        </button>
        <button type="button" onClick={goAdmin}>
          Administración
        </button>
      </nav>
      <div className="header-actions">
        {commercialConfig.contact.whatsapp && (
          <Button variant="whatsapp" onClick={() => openWhatsApp()}>
            WhatsApp
          </Button>
        )}
        <button
          type="button"
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  )
}

function StoreFooter({
  onAdmin,
  onOpenNotices,
  onOpenContact,
  onOpenCatalog,
}: {
  onAdmin?: () => void
  onOpenNotices?: () => void
  onOpenContact?: () => void
  onOpenCatalog?: () => void
}) {
  const socialLinks = getConfiguredSocialLinks()
  const hasWhatsApp = Boolean(commercialConfig.contact.whatsapp)
  const hasPhone = Boolean(commercialConfig.contact.phone)
  const hasEmail = Boolean(commercialConfig.contact.email)
  const hasHours = Boolean(commercialConfig.contact.supportHours)
  const hasContactDetails = hasWhatsApp || hasPhone || hasEmail
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel ||
    commercialConfig.contact.phone ||
    "WhatsApp"
  return (
    <footer className="store-footer">
      <div className="store-footer-main">
        <section className="footer-brand" aria-labelledby="footer-brand-title">
          <Logo onClick={onOpenCatalog} />
          <h2 id="footer-brand-title" className="sr-only">
            {commercialConfig.businessName}
          </h2>
          <p>{commercialConfig.description}</p>
        </section>
        <section className="footer-social" aria-labelledby="footer-social-title">
          <h2 id="footer-social-title" className="footer-heading">
            Redes sociales
          </h2>
          {socialLinks.length > 0 ? (
            <ul className="footer-social-list">
              {socialLinks.map(([icon, label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (se abre en una pestaña nueva)`}
                  >
                    <Icon name={icon} size={18} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Sin enlaces publicados
            </p>
          )}
        </section>
        <section
          className="footer-contact"
          aria-labelledby="footer-contact-title"
        >
          <h2 id="footer-contact-title" className="footer-heading">
            Contacto
          </h2>
          <ul className="footer-list">
            {hasWhatsApp && (
              <li>
                <button
                  type="button"
                  className="footer-whatsapp"
                  onClick={() => openWhatsApp()}
                  aria-label={`Contactar por WhatsApp al ${whatsappLabel}`}
                >
                  <Icon name="phone" size={16} />
                  <span>WhatsApp · {whatsappLabel}</span>
                </button>
              </li>
            )}
            {hasPhone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>{commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {hasEmail && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
            {!hasContactDetails && (
              <li className="footer-pending">
                Configuración pendiente · Datos de contacto
              </li>
            )}
          </ul>
        </section>
        <section
          className="footer-support"
          aria-labelledby="footer-support-title"
        >
          <h2 id="footer-support-title" className="footer-heading">
            Atención al cliente
          </h2>
          <ul className="footer-list">
            {hasWhatsApp && (
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => openWhatsApp()}
                >
                  <Icon name="phone" size={16} />
                  <span>Canal de atención por WhatsApp</span>
                </button>
              </li>
            )}
            {hasPhone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>Tel. {commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {hasHours ? (
              <li>
                <span className="footer-hours">
                  <Icon name="clock" size={16} />
                  <span>{commercialConfig.contact.supportHours}</span>
                </span>
              </li>
            ) : (
              <li className="footer-pending">
                Configuración pendiente · Horarios de atención
              </li>
            )}
            {hasEmail && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>
      <section className="footer-legal" aria-labelledby="footer-legal-title">
        <h2 id="footer-legal-title" className="footer-heading">
          Información legal
        </h2>
        <ul className="footer-legal-list">
          {commercialConfig.legal.map((item) => {
            if (item.href) {
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                </li>
              )
            }
            if (item.internal === "notices" && onOpenNotices) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className="footer-legal-link"
                    onClick={onOpenNotices}
                    aria-label={`${item.label}: garantía comercial de ${getWarrantyLabel()}`}
                  >
                    <span>{item.label}</span>
                    <small className="footer-available">
                      {item.badge || getWarrantyLabel()}
                    </small>
                  </button>
                </li>
              )
            }
            if (item.internal === "contact" && onOpenContact) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className="footer-legal-link"
                    onClick={onOpenContact}
                  >
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            }
            return (
              <li key={item.label}>
                <span
                  className="footer-pending-link"
                  title="Configuración pendiente"
                >
                  {item.label}
                  <small>Pendiente</small>
                </span>
              </li>
            )
          })}
        </ul>
      </section>
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {commercialConfig.businessName}. Todos
          los derechos reservados.
        </p>
        {onAdmin && (
          <button
            type="button"
            className="footer-admin-link"
            onClick={onAdmin}
          >
            Acceso administrativo
          </button>
        )}
      </div>
    </footer>
  )
}

function ConditionBadge({ condition }: { condition: DeviceCondition }) {
  const label = getConditionLabel(condition)
  return (
    <span className={`condition-tag condition-${condition}`}>{label}</span>
  )
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  const condition = normalizeCondition(product.condition)
  const statusClass =
    product.status === "Disponible"
      ? "is-available"
      : product.status === "Reservado"
        ? "is-reserved"
        : product.status === "Vendido"
          ? "is-sold"
          : ""
  return (
    <article className={`product-card ${statusClass}`.trim()}>
      <button
        className="product-image"
        onClick={onOpen}
        aria-label={`Ver detalles de ${product.name}`}
        type="button"
      >
        <img src={product.image} alt="" />
        <StatusBadge status={product.status} />
        <ConditionBadge condition={condition} />
        <span className="view-circle" aria-hidden="true">
          <Icon name="arrow" />
        </span>
      </button>
      <div className="product-info">
        <div>
          {product.conditionNote && (
            <p className="condition-grade">{product.conditionNote}</p>
          )}
          <h3>{product.name}</h3>
        </div>
        <strong className="product-price">{mxn(product.price)}</strong>
        <div className="product-meta">
          <span>{product.storage}</span>
          <span>{product.color}</span>
          <span>Batería {product.battery}</span>
        </div>
        <Button
          variant="secondary"
          icon="chevron"
          onClick={onOpen}
          className="product-details-btn"
        >
          Ver detalles
        </Button>
      </div>
    </article>
  )
}

function ContactPage({
  onBack,
  onAdmin,
  onOpenNotices,
}: {
  onBack: () => void
  onAdmin: () => void
  onOpenNotices: () => void
}) {
  const socialLinks = getConfiguredSocialLinks()
  const deliveryModes = commercialConfig.policies.deliveryModes
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel ||
    commercialConfig.contact.phone
  return (
    <main id="main-content" className="contact-page page-enter" tabIndex={-1}>
      <StoreHeader
        goCatalog={onBack}
        goAdmin={onAdmin}
        goContact={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goNotices={onOpenNotices}
      />
      <section className="contact-hero">
        <span className="eyebrow">Contacto</span>
        <h1>
          Habla con
          <br />
          <em>{commercialConfig.businessName}</em>
        </h1>
        <p>{commercialConfig.description}</p>
      </section>
      <section className="contact-grid">
        <article className="contact-card">
          <h2 className="footer-heading">Canales de atención</h2>
          <ul className="footer-list">
            {commercialConfig.contact.whatsapp && (
              <li>
                <button
                  type="button"
                  className="footer-whatsapp"
                  onClick={() => openWhatsApp()}
                >
                  <Icon name="phone" size={16} />
                  <span>
                    WhatsApp
                    {whatsappLabel ? ` · ${whatsappLabel}` : ""}
                  </span>
                </button>
              </li>
            )}
            {commercialConfig.contact.phone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>{commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {commercialConfig.contact.email && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
            {commercialConfig.contact.supportHours ? (
              <li>
                <span className="footer-hours">
                  <Icon name="clock" size={16} />
                  <span>{commercialConfig.contact.supportHours}</span>
                </span>
              </li>
            ) : (
              <li className="footer-pending">
                Configuración pendiente · Horarios de atención
              </li>
            )}
            {!commercialConfig.contact.whatsapp &&
              !commercialConfig.contact.phone &&
              !commercialConfig.contact.email && (
                <li className="footer-pending">
                  Configuración pendiente · Datos de contacto
                </li>
              )}
          </ul>
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Redes sociales</h2>
          {socialLinks.length > 0 ? (
            <ul className="footer-social-list">
              {socialLinks.map(([icon, label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name={icon} size={18} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Sin redes publicadas
            </p>
          )}
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Condiciones clave</h2>
          <ul className="contact-policy-list">
            <li>
              <strong>{commercialConfig.policies.warrantyTitle}</strong>
              <span>{commercialConfig.policies.warrantyText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.unlockedTitle}</strong>
              <span>{commercialConfig.policies.unlockedText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.notRefurbishedTitle}</strong>
              <span>{commercialConfig.policies.notRefurbishedText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.noReplacedPartsTitle}</strong>
              <span>{commercialConfig.policies.noReplacedPartsText}</span>
            </li>
          </ul>
          <Button variant="secondary" onClick={onOpenNotices}>
            Ver avisos completos
          </Button>
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Modalidades de entrega</h2>
          {deliveryModes && deliveryModes.length > 0 ? (
            <ul className="contact-policy-list">
              {deliveryModes.map((mode) => (
                <li key={mode}>
                  <strong>{mode}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Modalidades de entrega
            </p>
          )}
        </article>
      </section>
      <StoreFooter
        onAdmin={onAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onOpenCatalog={onBack}
      />
    </main>
  )
}

function Catalog({
  products,
  onSelect,
  goAdmin,
  onOpenNotices,
  onOpenContact,
}: {
  products: Product[]
  onSelect: (p: Product) => void
  goAdmin: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
}) {
  const productsQuery = useLocalResource({ data: products })
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Todos")
  const [conditionFilter, setConditionFilter] = useState<"Todos" | DeviceCondition>(
    "Todos",
  )
  const [sort, setSort] = useState("Recientes")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (status !== "Todos" ? 1 : 0) + (conditionFilter !== "Todos" ? 1 : 0)
  const catalogSource = productsQuery.data ?? products
  const publishedProducts = useMemo(
    () => catalogSource.filter((p) => p.isPublished),
    [catalogSource],
  )
  const filtered = useMemo(() => {
    const result = publishedProducts.filter(
      (p) =>
        (status === "Todos" || p.status === status) &&
        (conditionFilter === "Todos" ||
          normalizeCondition(p.condition) === conditionFilter) &&
        `${p.name} ${p.storage} ${p.color} ${getConditionLabel(p.condition)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    if (sort === "Menor precio")
      return [...result].sort((a, b) => a.price - b.price)
    if (sort === "Mayor precio")
      return [...result].sort((a, b) => b.price - a.price)
    return result
  }, [publishedProducts, query, status, conditionFilter, sort])
  const filtersId = useId()
  const availableCount = publishedProducts.filter(
    (p) => p.status === "Disponible",
  ).length
  return (
    <main id="main-content" className="catalog page-enter" tabIndex={-1}>
      <StoreHeader
        goCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <div>
          <span className="eyebrow">
            Catálogo ·{" "}
            <span className="availability-count">
              {availableCount} disponibles
            </span>
          </span>
          <h1 id="catalog-title">
            Encuentra el iPhone
            <br />
            <em>perfecto para ti.</em>
          </h1>
        </div>
        <p>
          Modelos seleccionados, información transparente y atención personal en
          cada paso.
        </p>
      </section>
      <section className="catalog-tools" aria-label="Buscar y filtrar catálogo">
        <label className="search-box">
          <Icon name="search" />
          <span className="sr-only">Buscar productos</span>
          <input
            type="search"
            placeholder="Buscar por modelo, color o capacidad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
        >
          Filtros{" "}
          {activeFilterCount > 0 && (
            <span className="filter-count" aria-label={`${activeFilterCount} filtros activos`}>
              {activeFilterCount}
            </span>
          )}
        </Button>
        <label className="select-wrap">
          Condición:{" "}
          <select
            value={conditionFilter}
            onChange={(e) =>
              setConditionFilter(
                e.target.value === "Todos"
                  ? "Todos"
                  : normalizeCondition(e.target.value),
              )
            }
            aria-label="Filtrar por condición comercial"
          >
            <option value="Todos">Todas</option>
            {DEVICE_CONDITIONS.map((item) => (
              <option value={item} key={item}>
                {CONDITION_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="select-wrap">
          Ordenar:{" "}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Ordenar resultados"
          >
            <option>Recientes</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
          </select>
        </label>
      </section>
      <p className="filter-results-live" aria-live="polite" aria-atomic="true">
        {filtered.length} producto{filtered.length === 1 ? "" : "s"} encontrado
        {filtered.length === 1 ? "" : "s"}
      </p>
      <section
        id={filtersId}
        className={filtersOpen ? "filter-strip open" : "filter-strip"}
        aria-label="Filtros de disponibilidad y condición"
      >
        <span className="filter-group-label" id="filter-availability-label">
          Disponibilidad
        </span>
        {["Todos", "Disponible", "Reservado", "Vendido"].map((item) => (
          <button
            type="button"
            className={[
              status === item ? "active" : "",
              item === "Disponible" ? "filter-available" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item}
            onClick={() => setStatus(item)}
            aria-pressed={status === item}
          >
            {item}
          </button>
        ))}
        <span className="filter-group-label">Condición</span>
        <button
          type="button"
          className={conditionFilter === "Todos" ? "active" : ""}
          onClick={() => setConditionFilter("Todos")}
          aria-pressed={conditionFilter === "Todos"}
        >
          Todas
        </button>
        {DEVICE_CONDITIONS.map((item) => (
          <button
            type="button"
            className={[
              conditionFilter === item ? "active" : "",
              item === "nuevo" ? "filter-condition-nuevo" : "",
              item === "seminuevo" ? "filter-condition-seminuevo" : "",
              item === "usado" ? "filter-condition-usado" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item}
            onClick={() => setConditionFilter(item)}
            aria-pressed={conditionFilter === item}
          >
            {CONDITION_LABELS[item]}
          </button>
        ))}
        <button type="button" disabled aria-disabled="true" title="Filtro pendiente">
          Modelo <Icon name="chevron" size={15} />
          <span className="sr-only"> (no disponible aún)</span>
        </button>
        <button type="button" disabled aria-disabled="true" title="Filtro pendiente">
          Capacidad <Icon name="chevron" size={15} />
          <span className="sr-only"> (no disponible aún)</span>
        </button>
      </section>
      <QueryState
        resource={productsQuery}
        skeleton={<CatalogGridSkeleton count={6} />}
        errorTitle="No se pudo cargar el catálogo"
        errorFallback="Hubo un problema al consultar los productos. Intenta de nuevo."
        isEmpty={(data) => data.filter((p) => p.isPublished).length === 0}
        empty={
          <EmptyState
            icon={<Icon name="box" size={34} />}
            title="Aún no hay productos publicados"
            description="Cuando se agreguen equipos al inventario aparecerán aquí."
          />
        }
      >
        {() => (
          <>
            <section className="product-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpen={() => onSelect(product)}
                />
              ))}
            </section>
            {!filtered.length && publishedProducts.length > 0 && (
              <EmptyState
                icon={<Icon name="search" size={34} />}
                title="No encontramos coincidencias"
                description="Prueba con otro modelo o elimina los filtros."
              />
            )}
          </>
        )}
      </QueryState>
      <StoreFooter
        onAdmin={goAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </main>
  )
}

function Detail({
  product,
  products,
  onBack,
  onBuy,
  onSelect,
  goAdmin,
  onOpenNotices,
  onOpenContact,
}: {
  product: Product
  products: Product[]
  onBack: () => void
  onBuy: () => void
  onSelect: (p: Product) => void
  goAdmin: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
}) {
  const productQuery = useLocalResource({ data: product })
  const [photo, setPhoto] = useState(0)
  const activeProduct = productQuery.data ?? product
  const productPhotos = [
    activeProduct.image,
    photos[(photos.indexOf(activeProduct.image) + 1) % photos.length],
    photos[(photos.indexOf(activeProduct.image) + 2) % photos.length],
  ]
  const condition = normalizeCondition(activeProduct.condition)
  const conditionDisplay = activeProduct.conditionNote
    ? `${getConditionLabel(condition)} · ${activeProduct.conditionNote}`
    : getConditionLabel(condition)
  const batteryLabel = activeProduct.techInfoVerified
    ? activeProduct.battery
    : `${activeProduct.battery} · No verificada`
  const specs = [
    ["Capacidad", activeProduct.storage],
    ["Color", activeProduct.color],
    ["Salud de batería", batteryLabel],
    ["Condición comercial", conditionDisplay],
    ["Estado físico", activeProduct.physicalCondition || "No indicado"],
    [
      "Estado de pantalla",
      activeProduct.techInfoVerified
        ? activeProduct.screenCondition || "No indicado"
        : `${activeProduct.screenCondition || "No indicado"} · No verificado`,
    ],
    [
      "Cámaras",
      activeProduct.techInfoVerified
        ? activeProduct.cameraStatus || "No indicado"
        : `${activeProduct.cameraStatus || "No indicado"} · No verificado`,
    ],
    ["Face ID / Touch ID", activeProduct.biometric],
    ["Liberación", activeProduct.unlockStatus || "No indicado"],
    ["Reparaciones / piezas", activeProduct.repairHistory || "No indicado"],
    ["Accesorios", activeProduct.accessories || "No indicado"],
    [
      "Garantía comercial",
      getProductWarrantyText(activeProduct.warrantyDays),
    ],
    [
      "Liberación (política)",
      commercialConfig.policies.unlockedText,
    ],
  ]
  return (
    <main id="main-content" className="detail page-enter" tabIndex={-1}>
      <StoreHeader
        goCatalog={onBack}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <QueryState
        resource={productQuery}
        skeleton={<ProductDetailSkeleton />}
        errorTitle="No se pudo cargar el producto"
        errorFallback="No encontramos los detalles de este equipo. Intenta de nuevo."
      >
        {(loadedProduct) => (
          <>
            <div className="breadcrumb">
              <button onClick={onBack}>Catálogo</button>
              <Icon name="chevron" size={14} />
              <span>{loadedProduct.name}</span>
            </div>
            <section className="detail-layout">
              <div className="gallery">
                <div className="main-photo">
                  <img
                    key={photo}
                    src={productPhotos[photo]}
                    alt={`${loadedProduct.name}, vista ${photo + 1}`}
                  />
                  <span>Fotografía del equipo</span>
                </div>
                <div className="thumbnails">
                  {productPhotos.map((img, i) => (
                    <button
                      key={img}
                      className={photo === i ? "active" : ""}
                      onClick={() => setPhoto(i)}
                      type="button"
                      aria-label={`Ver fotografía ${i + 1}`}
                    >
                      <img src={img} alt="" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="detail-copy">
                <div className="detail-title">
                  <div className="detail-badges">
                    <StatusBadge status={loadedProduct.status} />
                    <ConditionBadge condition={condition} />
                  </div>
                  <span className="sku">{loadedProduct.id}</span>
                  <h1>{loadedProduct.name}</h1>
                  <p>{conditionDisplay}</p>
                  <strong>
                    {mxn(loadedProduct.price)} <small>MXN</small>
                  </strong>
                </div>
                <p className="detail-description">{loadedProduct.description}</p>
                {!loadedProduct.techInfoVerified && (
                  <div className="request-note detail-unverified">
                    <Icon name="info" size={18} />
                    <p>
                      Parte de la información técnica de este equipo está marcada
                      como no verificada.
                    </p>
                  </div>
                )}
                {loadedProduct.observations && (
                  <p className="detail-observations">
                    <span>Observaciones</span>
                    {loadedProduct.observations}
                  </p>
                )}
                <div className="spec-grid">
                  {specs.map(([key, value]) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="detail-actions">
                  <Button
                    variant="gold"
                    onClick={onBuy}
                    disabled={loadedProduct.status !== "Disponible"}
                  >
                    {loadedProduct.status === "Disponible"
                      ? "Comprar ahora"
                      : "No disponible"}
                  </Button>
                  {commercialConfig.contact.whatsapp && (
                    <Button
                      variant="whatsapp"
                      icon="phone"
                      onClick={() =>
                        openWhatsApp(
                          `Hola, me interesa el ${loadedProduct.name} (${loadedProduct.id}).`,
                        )
                      }
                    >
                      Consultar por WhatsApp
                    </Button>
                  )}
                </div>
                <div className="request-note">
                  <Icon name="info" size={18} />
                  <p>
                    Enviar una solicitud no procesa un pago ni garantiza una
                    reserva. Confirmaremos la disponibilidad contigo.
                  </p>
                </div>
              </div>
            </section>
            <section className="related">
              <div className="related-heading">
                <div>
                  <span className="eyebrow">También podrían gustarte</span>
                  <h2>Otros equipos seleccionados</h2>
                </div>
                <Button variant="ghost" icon="arrow" onClick={onBack}>
                  Ver catálogo
                </Button>
              </div>
              <div className="product-grid">
                {products
                  .filter((p) => p.isPublished && p.id !== loadedProduct.id)
                  .slice(0, 3)
                  .map((p) => (
                    <ProductCard
                      product={p}
                      key={p.id}
                      onOpen={() => onSelect(p)}
                    />
                  ))}
              </div>
            </section>
          </>
        )}
      </QueryState>
      <StoreFooter
        onAdmin={goAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={onBack}
      />
    </main>
  )
}

function Checkout({
  product,
  onBack,
  onComplete,
  onOpenNotices,
  onOpenContact,
  onOpenCatalog,
}: {
  product: Product
  onBack: () => void
  onComplete: (name: string) => void
  onOpenNotices: () => void
  onOpenContact: () => void
  onOpenCatalog: () => void
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    onComplete(String(data.get("name")))
  }
  return (
    <main id="main-content" className="checkout page-enter" tabIndex={-1}>
      <nav className="simple-nav" aria-label="Secundaria">
        <button type="button" className="icon-button" onClick={onBack}>
          <Icon name="arrow" />
          <span>Volver</span>
        </button>
        <Logo onClick={onOpenCatalog} />
      </nav>
      <section className="checkout-layout">
        <div className="checkout-intro">
          <span className="eyebrow">Solicitud de compra</span>
          <h1>Estás a un paso.</h1>
          <p>
            Déjanos tus datos para confirmar la disponibilidad y coordinar
            contigo los siguientes pasos. Esta solicitud no reserva ni paga el
            equipo automáticamente.
          </p>
          <div className="mini-product">
            <img
              src={product.image}
              alt={`${product.name}, ${product.storage}, ${product.color}`}
            />
            <div>
              <span>{product.id}</span>
              <h3>{product.name}</h3>
              <p>
                {product.storage} · {product.color}
              </p>
              <strong>{mxn(product.price)}</strong>
            </div>
          </div>
          <div className="secure-note">
            <Icon name="shield" />
            <p>Tus datos se usarán únicamente para atender esta solicitud.</p>
          </div>
        </div>
        <form className="checkout-form" onSubmit={submit} noValidate={false}>
          <div className="form-heading">
            <span aria-hidden="true">01</span>
            <div>
              <h2>Datos de contacto</h2>
              <p>Los campos marcados con asterisco son obligatorios.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nombre completo" placeholder="Tu nombre" required>
              <input
                name="name"
                placeholder="Tu nombre"
                required
                autoComplete="name"
              />
            </Field>
            <Field
              label="Número de teléfono"
              placeholder="55 0000 0000"
              type="tel"
              name="phone"
              required
              autoComplete="tel"
            />
            <Field
              label="Correo electrónico"
              placeholder="nombre@correo.com"
              type="email"
              name="email"
              autoComplete="email"
            />
            <Field label="Método de entrega" required>
              <select name="delivery" required defaultValue="" autoComplete="off">
                <option value="" disabled>
                  Seleccionar una opción
                </option>
                {commercialConfig.policies.deliveryModes &&
                commercialConfig.policies.deliveryModes.length > 0 ? (
                  commercialConfig.policies.deliveryModes.map((mode) => (
                    <option value={mode} key={mode}>
                      {mode}
                    </option>
                  ))
                ) : (
                  <option value="por-confirmar">
                    Por confirmar con el negocio
                  </option>
                )}
              </select>
            </Field>
          </div>
          <Field label="Comentarios adicionales">
            <textarea
              name="comments"
              placeholder="¿Hay algo más que debamos saber?"
              rows={4}
            />
          </Field>
          <label className="check-row">
            <input type="checkbox" name="consent" required />
            <span>
              Confirmo que mis datos son correctos y entiendo que esta solicitud
              está sujeta a confirmación.
            </span>
          </label>
          <Button type="submit" variant="gold" icon="arrow" className="wide">
            Enviar solicitud
          </Button>
        </form>
      </section>
      <StoreFooter
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={onOpenCatalog}
      />
    </main>
  )
}

function Success({
  product,
  name,
  onCatalog,
  onOpenNotices,
  onOpenContact,
}: {
  product: Product
  name: string
  onCatalog: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
}) {
  return (
    <main id="main-content" className="success page-enter" tabIndex={-1}>
      <Logo onClick={onCatalog} />
      <div className="success-card" role="status" aria-live="polite">
        <span className="success-icon" aria-hidden="true">
          <Icon name="check" size={30} />
        </span>
        <span className="eyebrow">Solicitud enviada</span>
        <h1>Gracias, {name || "hemos recibido tus datos"}.</h1>
        <p>
          Verificaremos disponibilidad y condiciones de entrega. Nos pondremos
          en contacto contigo a la brevedad.
        </p>
        <div className="folio">
          <span>Folio de referencia</span>
          <strong>VC-2025-0184</strong>
        </div>
        <div className="confirmation-product">
          <div>
            <span>Producto</span>
            <strong>
              {product.name} · {product.storage}
            </strong>
          </div>
          <div>
            <span>Precio de referencia</span>
            <strong>{mxn(product.price)}</strong>
          </div>
          <div>
            <span>Estado</span>
            <StatusBadge status="Pendiente de confirmación" />
          </div>
        </div>
        <div className="request-note">
          <Icon name="info" />
          <p>
            Esta solicitud no representa un pago ni una reserva garantizada.
          </p>
        </div>
        <div className="success-actions">
          <Button variant="gold" onClick={onCatalog}>
            Volver al catálogo
          </Button>
          {commercialConfig.contact.whatsapp && (
            <Button variant="whatsapp" icon="phone" onClick={() => openWhatsApp()}>
              Contactar por WhatsApp
            </Button>
          )}
        </div>
      </div>
      <StoreFooter
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={onCatalog}
      />
    </main>
  )
}

function AdminLogin({
  onLogin,
  onBack,
}: {
  onLogin: () => void
  onBack: () => void
}) {
  const [show, setShow] = useState(false)
  const passwordId = useId()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onLogin()
  }
  return (
    <main id="main-content" className="admin-login page-enter" tabIndex={-1}>
      <div className="login-brand">
        <Logo />
        <button type="button" className="text-link" onClick={onBack}>
          Volver a la tienda
        </button>
      </div>
      <section className="login-card" aria-labelledby="admin-login-title">
        <span className="eyebrow">Acceso privado</span>
        <h1 id="admin-login-title">Bienvenido de nuevo.</h1>
        <p>
          Ingresa tus datos para administrar {commercialConfig.businessName}.
        </p>
        <form onSubmit={submit}>
          <Field
            label="Correo electrónico"
            type="email"
            name="email"
            placeholder="admin@ventacelulares.mx"
            required
            autoComplete="username"
          />
          <Field label="Contraseña" required id={passwordId}>
            <div className="password-field">
              <input
                id={passwordId}
                name="password"
                type={show ? "text" : "password"}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                aria-required="true"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={show}
              >
                <Icon name="eye" />
              </button>
            </div>
          </Field>
          <div className="login-helper">
            <label>
              <input type="checkbox" name="remember" /> Recordarme
            </label>
            <button type="button">¿Olvidaste tu contraseña?</button>
          </div>
          <Button type="submit" className="wide">
            Iniciar sesión
          </Button>
        </form>
        <span className="demo-note" role="note">
          Prototipo demostrativo · Puedes ingresar con cualquier dato
        </span>
      </section>
    </main>
  )
}

const adminNav: { id: AdminView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Resumen", icon: "grid" },
  { id: "products", label: "Productos", icon: "box" },
  { id: "inventory", label: "Inventario", icon: "chart" },
  { id: "orders", label: "Pedidos", icon: "orders" },
  { id: "sales", label: "Ventas", icon: "chart" },
  { id: "notices", label: "Avisos", icon: "info" },
  { id: "settings", label: "Configuración", icon: "settings" },
]

function AdminShell({
  active,
  setActive,
  onLogout,
  children,
}: {
  active: AdminView
  setActive: (v: AdminView) => void
  onLogout: () => void
  children: ReactNode
}) {
  const [mobileNav, setMobileNav] = useState(false)
  const sideNavId = useId()
  return (
    <div className="admin-shell">
      <a href="#main-content" className="skip-link">
        Saltar al contenido del panel
      </a>
      <aside
        id={sideNavId}
        className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}
        aria-label="Navegación administrativa"
      >
        <div className="sidebar-top">
          <Logo />
          <button
            type="button"
            className="menu-button"
            onClick={() => setMobileNav(false)}
            aria-label="Cerrar menú del panel"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-label">
          <span>Espacio de trabajo</span>
          <strong>
            VentaCelulares <i>PRO</i>
          </strong>
        </div>
        <nav aria-label="Secciones del panel">
          {adminNav.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              aria-current={active === item.id ? "page" : undefined}
              onClick={() => {
                setActive(item.id)
                setMobileNav(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "orders" && (
                <b aria-label="4 pedidos pendientes">4</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span aria-hidden="true">AM</span>
            <div>
              <strong>Andrea M.</strong>
              <small>Administradora</small>
            </div>
          </div>
          <button type="button" onClick={onLogout}>
            <Icon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMobileNav(true)}
            aria-expanded={mobileNav}
            aria-controls={sideNavId}
            aria-label="Abrir menú del panel"
          >
            <Icon name="menu" />
          </button>
          <div className="admin-search">
            <Icon name="search" />
            <label className="sr-only" htmlFor="admin-global-search">
              Buscar en el panel
            </label>
            <input
              id="admin-global-search"
              type="search"
              placeholder="Buscar en el panel..."
              autoComplete="off"
            />
            <kbd aria-hidden="true">⌘ K</kbd>
          </div>
          <div className="admin-date">
            <span>Datos demostrativos</span>
            <strong>Actualizado hoy</strong>
          </div>
          <span className="avatar" aria-hidden="true">
            AM
          </span>
        </header>
        <div id="main-content" tabIndex={-1}>
          {children}
        </div>
      </section>
    </div>
  )
}

function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="admin-page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function Dashboard() {
  const stats = [
    ["Ventas registradas", "28", "+12% vs. mes anterior"],
    ["Ingresos del mes", "$384,720", "+8.4% vs. mes anterior"],
    ["iPhones disponibles", "16", "de 24 unidades"],
    ["Pedidos pendientes", "4", "Requieren atención"],
  ]
  const orders = [
    [
      "#VC-0184",
      "Mariana López",
      "iPhone 15 Pro",
      "Hoy, 10:24",
      "$22,990",
      "Pendiente",
    ],
    [
      "#VC-0183",
      "Daniel Torres",
      "iPhone 14 Pro Max",
      "Ayer, 18:40",
      "$19,490",
      "Confirmado",
    ],
    [
      "#VC-0182",
      "Sofía Reyes",
      "iPhone 13",
      "Ayer, 12:15",
      "$10,990",
      "Completado",
    ],
    [
      "#VC-0181",
      "Carlos Vega",
      "iPhone 15",
      "14 may, 16:02",
      "$16,990",
      "Cancelado",
    ],
  ]
  const dashboardQuery = useLocalResource({
    data: { stats, orders },
  })
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Vista general"
        title="Panel de administración"
        description="Gestiona tu catálogo, inventario y ventas desde un solo lugar."
        action={<Button icon="plus">Agregar producto</Button>}
      />
      <QueryState
        resource={dashboardQuery}
        skeleton={<DashboardStatsSkeleton />}
        errorTitle="No se pudo cargar el panel"
        errorFallback="No fue posible obtener las métricas. Intenta de nuevo."
      >
        {(data) => (
          <>
            <div className="stat-grid">
              {data.stats.map((s, i) => (
                <article className="stat-card" key={s[0]}>
                  <div>
                    <span>{s[0]}</span>
                    <Icon name={["chart", "chart", "box", "orders"][i]} />
                  </div>
                  <strong>{s[1]}</strong>
                  <p className={i === 3 ? "attention" : ""}>{s[2]}</p>
                </article>
              ))}
            </div>
            <div className="analytics-grid">
              <article
                className="chart-card sales-chart"
                aria-labelledby="sales-chart-title"
              >
                <div className="card-title">
                  <div>
                    <h3 id="sales-chart-title">Evolución de ventas</h3>
                    <p>Ingresos de los últimos 6 meses</p>
                  </div>
                  <label className="sr-only" htmlFor="sales-range">
                    Periodo del gráfico
                  </label>
                  <select id="sales-range" defaultValue="6 meses">
                    <option>6 meses</option>
                  </select>
                </div>
                <div className="chart-total">
                  <strong>$384,720</strong>
                  <span aria-label="Variación positiva 8.4 por ciento">
                    +8.4%
                  </span>
                </div>
                <div
                  className="bars"
                  role="img"
                  aria-label="Gráfico de barras de ingresos mensuales"
                >
                  {[34, 48, 43, 67, 58, 88].map((h, i) => (
                    <div key={i}>
                      <i style={{ height: `${h}%` }} aria-hidden="true" />
                      <span>
                        {["Dic", "Ene", "Feb", "Mar", "Abr", "May"][i]}
                      </span>
                    </div>
                  ))}
                </div>
                <table className="visually-hidden-table">
                  <caption>Ingresos relativos por mes (datos demostrativos)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Mes</th>
                      <th scope="col">Nivel relativo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Dic", "34%"],
                      ["Ene", "48%"],
                      ["Feb", "43%"],
                      ["Mar", "67%"],
                      ["Abr", "58%"],
                      ["May", "88%"],
                    ].map(([month, value]) => (
                      <tr key={month}>
                        <th scope="row">{month}</th>
                        <td>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
              <article
                className="chart-card inventory-chart"
                aria-labelledby="inventory-chart-title"
              >
                <div className="card-title">
                  <div>
                    <h3 id="inventory-chart-title">Estado del inventario</h3>
                    <p>24 unidades totales</p>
                  </div>
                </div>
                <div
                  className="donut"
                  role="img"
                  aria-label="Distribución de inventario: 16 disponibles, 5 reservados, 3 vendidos"
                >
                  <div>
                    <strong>24</strong>
                    <span>Equipos</span>
                  </div>
                </div>
                <div className="legend">
                  <p>
                    <i className="available" aria-hidden="true" />
                    Disponibles <strong>16</strong>
                  </p>
                  <p>
                    <i className="reserved" aria-hidden="true" />
                    Reservados <strong>5</strong>
                  </p>
                  <p>
                    <i className="sold" aria-hidden="true" />
                    Vendidos <strong>3</strong>
                  </p>
                </div>
                <table className="visually-hidden-table">
                  <caption>Resumen de inventario</caption>
                  <thead>
                    <tr>
                      <th scope="col">Estado</th>
                      <th scope="col">Unidades</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Disponibles</th>
                      <td>16</td>
                    </tr>
                    <tr>
                      <th scope="row">Reservados</th>
                      <td>5</td>
                    </tr>
                    <tr>
                      <th scope="row">Vendidos</th>
                      <td>3</td>
                    </tr>
                  </tbody>
                </table>
              </article>
            </div>
            <article className="table-card">
              <div className="card-title">
                <div>
                  <h3>Pedidos recientes</h3>
                  <p>Solicitudes más recientes · Datos demostrativos</p>
                </div>
                <Button variant="ghost" icon="arrow">
                  Ver todos
                </Button>
              </div>
              {data.orders.length === 0 ? (
                <EmptyState
                  icon={<Icon name="orders" size={34} />}
                  title="Sin pedidos recientes"
                  description="Cuando existan solicitudes aparecerán en este resumen."
                />
              ) : (
                <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de pedidos recientes">
                  <table>
                    <thead>
                      <tr>
                        {[
                          "Folio",
                          "Cliente",
                          "Producto",
                          "Fecha",
                          "Importe",
                          "Estado",
                          "Acciones",
                        ].map((x) => (
                          <th key={x} scope="col">
                            {x}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, i) => (
                            <td key={cell}>
                              {i === 5 ? <StatusBadge status={cell} /> : cell}
                            </td>
                          ))}
                          <td>
                            <button
                              className="row-action"
                              type="button"
                              aria-label={`Más acciones del pedido ${row[0]}`}
                            >
                              •••
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </article>
          </>
        )}
      </QueryState>
    </div>
  )
}

type ProductFormValues = {
  id: string
  name: string
  storage: string
  color: string
  condition: DeviceCondition
  conditionNote: string
  price: string
  status: Status
  battery: string
  warrantyDays: string
  physicalCondition: string
  screenCondition: string
  cameraStatus: string
  biometric: BiometricOption
  unlockStatus: string
  repairHistory: string
  accessories: string
  observations: string
  description: string
  image: string
  verifiedNotRefurbished: boolean
  verifiedNoReplacedParts: boolean
  techInfoVerified: boolean
}

type ProductFormErrors = Partial<Record<keyof ProductFormValues | "form", string>>

const buildEmptyProductForm = (nextId: string): ProductFormValues => ({
  id: nextId,
  name: "",
  storage: "128 GB",
  color: "",
  condition: "seminuevo",
  conditionNote: "",
  price: "",
  status: "Disponible",
  battery: "",
  warrantyDays: String(commercialConfig.policies.warrantyDays),
  physicalCondition: "",
  screenCondition: "",
  cameraStatus: "",
  biometric: "Face ID",
  unlockStatus: commercialConfig.policies.unlockedStatusLabel,
  repairHistory: "Sin reparaciones conocidas",
  accessories: "",
  observations: "",
  description: "",
  image: photos[0],
  verifiedNotRefurbished: false,
  verifiedNoReplacedParts: false,
  techInfoVerified: false,
})

const productToForm = (product: Product): ProductFormValues => ({
  id: product.id,
  name: product.name,
  storage: product.storage,
  color: product.color,
  condition: normalizeCondition(product.condition),
  conditionNote: product.conditionNote || "",
  price: String(product.price),
  status: product.status,
  battery: product.battery.replace("%", ""),
  warrantyDays: String(product.warrantyDays),
  physicalCondition: product.physicalCondition,
  screenCondition: product.screenCondition,
  cameraStatus: product.cameraStatus,
  biometric: product.biometric,
  unlockStatus: product.unlockStatus,
  repairHistory: product.repairHistory,
  accessories: product.accessories,
  observations: product.observations,
  description: product.description,
  image: product.image,
  verifiedNotRefurbished: product.verifiedNotRefurbished,
  verifiedNoReplacedParts: product.verifiedNoReplacedParts,
  techInfoVerified: product.techInfoVerified,
})

const parseBatteryValue = (value: string) => {
  const cleaned = value.replace("%", "").trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : NaN
}

function ProductsAdmin({
  products,
  setProducts,
}: {
  products: Product[]
  setProducts: (p: Product[]) => void
}) {
  const productsQuery = useLocalResource({ data: products })
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormValues>(() =>
    buildEmptyProductForm(`VC-${String(products.length + 1).padStart(3, "0")}`),
  )
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [toast, setToast] = useState("")
  const [toastTone, setToastTone] = useState<"ok" | "error">("ok")
  /** true solo durante fetch real de un producto a editar (Supabase). */
  const [isFormHydrating, setIsFormHydrating] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const isEditing = Boolean(editingId)
  const showToast = (message: string, tone: "ok" | "error" = "ok") => {
    setToastTone(tone)
    setToast(message)
    setTimeout(() => setToast(""), 2800)
  }
  const handleCloseModal = () => {
    setModal(false)
    setEditingId(null)
    setErrors({})
    setIsFormHydrating(false)
  }
  useFocusTrap(modalRef, modal, handleCloseModal)
  useEffect(() => {
    if (!modal) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [modal])
  const handleOpenCreate = () => {
    setEditingId(null)
    setErrors({})
    setIsFormHydrating(false)
    setForm(
      buildEmptyProductForm(
        `VC-${String(products.length + 1).padStart(3, "0")}`,
      ),
    )
    setModal(true)
  }
  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id)
    setErrors({})
    setIsFormHydrating(false)
    setForm(productToForm(product))
    setModal(true)
  }
  const handleFieldChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = event.target
    const checked =
      type === "checkbox" && "checked" in event.target
        ? (event.target as HTMLInputElement).checked
        : undefined
    setForm((current) => ({
      ...current,
      [name]: checked === undefined ? value : checked,
    }))
    setErrors((current) => {
      if (!current[name as keyof ProductFormErrors] && !current.form)
        return current
      const next = { ...current }
      delete next[name as keyof ProductFormErrors]
      delete next.form
      return next
    })
  }
  const validateForm = (publish: boolean) => {
    const nextErrors: ProductFormErrors = {}
    if (!form.name.trim()) nextErrors.name = "El modelo es obligatorio"
    if (!form.storage.trim()) nextErrors.storage = "Selecciona el almacenamiento"
    if (!form.color.trim()) nextErrors.color = "El color es obligatorio"
    if (!form.condition) nextErrors.condition = "Selecciona la condición"
    if (!form.physicalCondition.trim())
      nextErrors.physicalCondition = "Indica el estado físico"
    if (!form.unlockStatus.trim())
      nextErrors.unlockStatus = "Indica el estado de liberación"
    if (!form.price.trim()) nextErrors.price = "El precio es obligatorio"
    else {
      const price = Number(form.price)
      if (!Number.isFinite(price)) nextErrors.price = "Precio inválido"
      else if (price < 0) nextErrors.price = "El precio no puede ser negativo"
    }
    const warranty = Number(form.warrantyDays)
    if (!form.warrantyDays.trim() || !Number.isFinite(warranty) || warranty <= 0)
      nextErrors.warrantyDays = "Indica los días de garantía (mínimo 1)"
    if (form.battery.trim()) {
      const battery = parseBatteryValue(form.battery)
      if (battery === null || Number.isNaN(battery))
        nextErrors.battery = "Salud de batería inválida"
      else if (battery < 0 || battery > 100)
        nextErrors.battery = "La batería debe estar entre 0 y 100"
    }
    if (publish) {
      if (!form.verifiedNotRefurbished)
        nextErrors.verifiedNotRefurbished =
          "Debes confirmar que no es reacondicionado"
      if (!form.verifiedNoReplacedParts)
        nextErrors.verifiedNoReplacedParts =
          "Debes confirmar que no tiene piezas reemplazadas"
      if (!form.verifiedNotRefurbished || !form.verifiedNoReplacedParts)
        nextErrors.form =
          "No se puede publicar hasta completar las verificaciones comerciales obligatorias"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }
  const buildProductFromForm = (publish: boolean): Product => {
    const batteryNumber = parseBatteryValue(form.battery)
    const batteryLabel =
      batteryNumber === null || Number.isNaN(batteryNumber)
        ? ""
        : `${Math.round(batteryNumber)}%`
    return {
      ...createProductDefaults(),
      id: form.id.trim() || `VC-${String(products.length + 1).padStart(3, "0")}`,
      name: form.name.trim(),
      storage: form.storage,
      color: form.color.trim(),
      battery: batteryLabel || "N/D",
      price: Number(form.price),
      status: form.status,
      condition: normalizeCondition(form.condition),
      conditionNote: form.conditionNote.trim() || undefined,
      warrantyDays: Number(form.warrantyDays),
      physicalCondition: form.physicalCondition.trim(),
      screenCondition: form.screenCondition.trim(),
      cameraStatus: form.cameraStatus.trim(),
      biometric: form.biometric,
      unlockStatus: form.unlockStatus.trim(),
      repairHistory: form.repairHistory.trim(),
      accessories: form.accessories.trim(),
      observations: form.observations.trim(),
      image: form.image || photos[0],
      description:
        form.description.trim() ||
        `${form.name.trim()} · ${CONDITION_LABELS[normalizeCondition(form.condition)]}`,
      verifiedNotRefurbished: form.verifiedNotRefurbished,
      verifiedNoReplacedParts: form.verifiedNoReplacedParts,
      techInfoVerified: form.techInfoVerified,
      isPublished: publish,
    }
  }
  const handleSave = (publish: boolean) => {
    if (!validateForm(publish)) {
      showToast(
        publish
          ? "Revisa los campos y verificaciones antes de publicar"
          : "Revisa los campos obligatorios",
        "error",
      )
      return
    }
    const nextProduct = buildProductFromForm(publish)
    if (isEditing && editingId) {
      setProducts(
        products.map((item) => (item.id === editingId ? nextProduct : item)),
      )
      showToast(
        publish
          ? "Producto actualizado y publicado (simulación local)"
          : "Borrador actualizado (simulación local)",
      )
    } else {
      setProducts([nextProduct, ...products])
      showToast(
        publish
          ? "Producto publicado en el catálogo (simulación local)"
          : "Borrador guardado (simulación local)",
      )
    }
    handleCloseModal()
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleSave(true)
  }
  const remove = (id: string) => {
    if (confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      setProducts(products.filter((p) => p.id !== id))
      showToast("Producto eliminado (simulación local)")
    }
  }
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description={`${products.length} equipos registrados · ${products.filter((p) => p.isPublished).length} publicados · Persistencia simulada en memoria`}
        action={
          <Button icon="plus" onClick={handleOpenCreate}>
            Agregar producto
          </Button>
        }
      />
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input placeholder="Buscar producto..." />
        </label>
        <Button variant="secondary">Filtrar</Button>
        <Button variant="secondary">Exportar</Button>
      </div>
      <QueryState
        resource={productsQuery}
        skeleton={
          <TableSkeleton
            columns={8}
            rows={5}
            showProductCell
            headers={[
              "Producto",
              "Capacidad",
              "Condición",
              "Garantía",
              "Precio",
              "Disponibilidad",
              "Publicación",
              "Acciones",
            ]}
          />
        }
        errorTitle="No se pudieron cargar los productos"
        errorFallback="Hubo un problema al consultar el inventario de productos."
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={<Icon name="box" size={34} />}
            title="No hay productos registrados"
            description="Agrega el primer equipo para comenzar a gestionar el catálogo."
          />
        }
      >
        {(rows) => (
          <article className="table-card">
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabla de productos"
            >
              <table className="product-table">
                <thead>
                  <tr>
                    {[
                      "Producto",
                      "Capacidad",
                      "Condición",
                      "Garantía",
                      "Precio",
                      "Disponibilidad",
                      "Publicación",
                      "Acciones",
                    ].map((x) => (
                      <th key={x} scope="col">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <img src={p.image} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <span>
                              {p.id} · {p.color}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{p.storage}</td>
                      <td>
                        <ConditionBadge
                          condition={normalizeCondition(p.condition)}
                        />
                      </td>
                      <td>{p.warrantyDays} días</td>
                      <td>
                        <strong>{mxn(p.price)}</strong>
                      </td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        <span
                          className={`publish-pill${p.isPublished ? " is-live" : ""}`}
                        >
                          {p.isPublished ? "Publicado" : "Borrador"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            title="Editar"
                            onClick={() => handleOpenEdit(p)}
                            aria-label={`Editar ${p.name}`}
                            type="button"
                          >
                            <Icon name="edit" size={17} />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => remove(p.id)}
                            aria-label={`Eliminar ${p.name}`}
                            type="button"
                          >
                            <Icon name="trash" size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </QueryState>
      {modal && (
        <div
          className="modal-backdrop"
          onMouseDown={handleCloseModal}
          role="presentation"
        >
          <div
            ref={modalRef}
            className="product-modal product-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            tabIndex={-1}
            data-autofocus
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">
                  {isEditing ? "Edición de unidad" : "Nuevo registro"}
                </span>
                <h2 id="product-modal-title">
                  {isEditing ? "Editar producto" : "Agregar producto"}
                </h2>
                <p>
                  Completa la información por unidad. Condición y disponibilidad
                  son independientes.
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar formulario"
              >
                <Icon name="close" />
              </button>
            </header>
            <AsyncRegion
              busy={isFormHydrating}
              label="Cargando datos del producto"
            >
            {isFormHydrating ? (
              <div className="product-modal-body-pad">
                <FormSkeleton fields={10} />
              </div>
            ) : (
            <form onSubmit={handleSubmit}>
              <p className="form-sim-note">
                Simulación local · Los cambios se reflejan en catálogo/ficha de
                esta sesión, sin persistencia en servidor ni API.
              </p>
              {errors.form && (
                <div className="form-banner-error" role="alert">
                  <Icon name="info" size={16} />
                  <span>{errors.form}</span>
                </div>
              )}
              <section className="form-section">
                <h3>Información general</h3>
                <div className="form-grid">
                  <Field
                    label="Modelo"
                    name="name"
                    placeholder="Ej. iPhone 15 Pro"
                    required
                    value={form.name}
                    onChange={handleFieldChange}
                    error={errors.name}
                  />
                  <Field
                    label="Almacenamiento"
                    required
                    error={errors.storage}
                  >
                    <select
                      name="storage"
                      value={form.storage}
                      onChange={handleFieldChange}
                      required
                    >
                      <option>128 GB</option>
                      <option>256 GB</option>
                      <option>512 GB</option>
                      <option>1 TB</option>
                    </select>
                  </Field>
                  <Field
                    label="Color"
                    name="color"
                    placeholder="Ej. Titanio natural"
                    required
                    value={form.color}
                    onChange={handleFieldChange}
                    error={errors.color}
                  />
                  <Field
                    label="Código interno"
                    name="id"
                    value={form.id}
                    onChange={handleFieldChange}
                  />
                </div>
              </section>
              <section className="form-section">
                <h3>Condición y garantía</h3>
                <div className="form-grid">
                  <Field
                    label="Condición comercial"
                    required
                    error={errors.condition}
                  >
                    <select
                      name="condition"
                      value={form.condition}
                      onChange={handleFieldChange}
                      required
                    >
                      {DEVICE_CONDITIONS.map((item) => (
                        <option value={item} key={item}>
                          {CONDITION_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Nota de condición (opcional)"
                    name="conditionNote"
                    placeholder="Ej. Excelente"
                    value={form.conditionNote}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Garantía comercial (días)"
                    name="warrantyDays"
                    type="number"
                    min={1}
                    required
                    value={form.warrantyDays}
                    onChange={handleFieldChange}
                    error={errors.warrantyDays}
                  />
                  <Field
                    label="Estado físico"
                    name="physicalCondition"
                    placeholder="Ej. Excelente"
                    required
                    value={form.physicalCondition}
                    onChange={handleFieldChange}
                    error={errors.physicalCondition}
                  />
                </div>
              </section>
              <section className="form-section">
                <h3>Información comercial</h3>
                <div className="form-grid">
                  <Field
                    label="Precio (MXN)"
                    name="price"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    required
                    value={form.price}
                    onChange={handleFieldChange}
                    error={errors.price}
                  />
                  <Field label="Disponibilidad" required>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleFieldChange}
                    >
                      <option>Disponible</option>
                      <option>Reservado</option>
                      <option>Vendido</option>
                    </select>
                  </Field>
                  <Field
                    label="Salud de batería (%)"
                    name="battery"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="96"
                    value={form.battery}
                    onChange={handleFieldChange}
                    error={errors.battery}
                  />
                  <Field label="Face ID / Touch ID">
                    <select
                      name="biometric"
                      value={form.biometric}
                      onChange={handleFieldChange}
                    >
                      <option>Face ID</option>
                      <option>Touch ID</option>
                      <option>No aplica</option>
                    </select>
                  </Field>
                </div>
              </section>
              <section className="form-section">
                <h3>Revisión técnica</h3>
                <div className="form-grid">
                  <Field
                    label="Estado de pantalla"
                    name="screenCondition"
                    placeholder="Ej. Original · Sin detalles"
                    value={form.screenCondition}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Funcionamiento de cámaras"
                    name="cameraStatus"
                    placeholder="Ej. Funcionamiento correcto"
                    value={form.cameraStatus}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Estado de liberación"
                    name="unlockStatus"
                    required
                    value={form.unlockStatus}
                    onChange={handleFieldChange}
                    error={errors.unlockStatus}
                  />
                  <Field
                    label="Accesorios incluidos"
                    name="accessories"
                    placeholder="Ej. Cable USB-C"
                    value={form.accessories}
                    onChange={handleFieldChange}
                  />
                </div>
                <Field
                  label="Historial conocido de reparaciones o piezas"
                  name="repairHistory"
                  value={form.repairHistory}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="repairHistory"
                    rows={3}
                    value={form.repairHistory}
                    onChange={handleFieldChange}
                    placeholder="Describe reparaciones conocidas o indica que no hay historial"
                  />
                </Field>
                <label className="check-row form-check">
                  <input
                    type="checkbox"
                    name="techInfoVerified"
                    checked={form.techInfoVerified}
                    onChange={handleFieldChange}
                  />
                  <span>
                    La información técnica de este equipo está verificada. Si no
                    se marca, se mostrará como no verificada en la ficha.
                  </span>
                </label>
              </section>
              <section className="form-section">
                <h3>Verificación comercial obligatoria</h3>
                <p className="form-section-copy">
                  {commercialConfig.policies.notRefurbishedText}{" "}
                  {commercialConfig.policies.noReplacedPartsText} Confirma ambas
                  condiciones por unidad antes de publicar.
                </p>
                <label
                  className={`check-row form-check${errors.verifiedNotRefurbished ? " field-error" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="verifiedNotRefurbished"
                    checked={form.verifiedNotRefurbished}
                    onChange={handleFieldChange}
                  />
                  <span>Verificado: este equipo no es reacondicionado.</span>
                </label>
                {errors.verifiedNotRefurbished && (
                  <em className="field-error-msg">
                    {errors.verifiedNotRefurbished}
                  </em>
                )}
                <label
                  className={`check-row form-check${errors.verifiedNoReplacedParts ? " field-error" : ""}`}
                >
                  <input
                    type="checkbox"
                    name="verifiedNoReplacedParts"
                    checked={form.verifiedNoReplacedParts}
                    onChange={handleFieldChange}
                  />
                  <span>
                    Verificado: este equipo no tiene piezas reemplazadas.
                  </span>
                </label>
                {errors.verifiedNoReplacedParts && (
                  <em className="field-error-msg">
                    {errors.verifiedNoReplacedParts}
                  </em>
                )}
              </section>
              <section className="form-section">
                <h3>Descripción, observaciones y fotografía</h3>
                <Field
                  label="Descripción"
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleFieldChange}
                    placeholder="Resumen comercial del equipo"
                  />
                </Field>
                <Field
                  label="Observaciones"
                  name="observations"
                  value={form.observations}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="observations"
                    rows={3}
                    value={form.observations}
                    onChange={handleFieldChange}
                    placeholder="Notas internas o para el cliente"
                  />
                </Field>
                <Field label="Fotografía principal (URL)" error={undefined}>
                  <select
                    name="image"
                    value={form.image}
                    onChange={handleFieldChange}
                  >
                    {photos.map((src, index) => (
                      <option value={src} key={src}>
                        Imagen demostrativa {index + 1}
                      </option>
                    ))}
                  </select>
                </Field>
                <div className="upload-box">
                  <Icon name="upload" />
                  <strong>Carga de fotografías</strong>
                  <span>
                    Simulado · Selecciona una imagen demostrativa. La subida real
                    queda pendiente de integración.
                  </span>
                  {form.image && (
                    <img
                      className="form-photo-preview"
                      src={form.image}
                      alt="Vista previa del producto"
                    />
                  )}
                </div>
              </section>
              <footer className="product-form-actions">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => handleSave(false)}
                >
                  Guardar borrador
                </Button>
                <Button type="submit" variant="gold">
                  {isEditing ? "Guardar y publicar" : "Publicar producto"}
                </Button>
              </footer>
            </form>
            )}
            </AsyncRegion>
          </div>
        </div>
      )}
      {toast && (
        <div
          className={`toast toast-${toastTone}`}
          role={toastTone === "error" ? "alert" : "status"}
          aria-live={toastTone === "error" ? "assertive" : "polite"}
        >
          <Icon name={toastTone === "ok" ? "check" : "info"} />
          {toast}
        </div>
      )}
    </div>
  )
}

function Inventory({
  products,
  setProducts,
}: {
  products: Product[]
  setProducts: (p: Product[]) => void
}) {
  const inventoryQuery = useLocalResource({ data: products })
  const update = (id: string, status: Status) =>
    setProducts(products.map((p) => (p.id === id ? { ...p, status } : p)))
  const source = inventoryQuery.data ?? products
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Control de unidades"
        title="Inventario"
        description="Actualiza la disponibilidad. Los cambios se reflejan en el catálogo público."
      />
      <div className="stat-grid compact">
        {[
          ["Total de unidades", source.length],
          [
            "Disponibles",
            source.filter((p) => p.status === "Disponible").length,
          ],
          [
            "Reservadas",
            source.filter((p) => p.status === "Reservado").length,
          ],
          ["Vendidas", source.filter((p) => p.status === "Vendido").length],
        ].map((x) => (
          <article className="stat-card" key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
          </article>
        ))}
      </div>
      <article className="table-card">
        <div className="card-title">
          <div>
            <h3>Unidades registradas</h3>
            <p>Actualización rápida de estado</p>
          </div>
          <label className="search-box">
            <Icon name="search" />
            <input placeholder="Buscar unidad..." />
          </label>
        </div>
        <QueryState
          resource={inventoryQuery}
          skeleton={
            <TableSkeleton
              columns={5}
              rows={5}
              showProductCell
              embedded
              headers={[
                "Equipo",
                "Código",
                "Batería",
                "Estado actual",
                "Actualizar estado",
              ]}
            />
          }
          errorTitle="No se pudo cargar el inventario"
          errorFallback="Hubo un problema al consultar las unidades."
          isEmpty={(data) => data.length === 0}
          empty={
            <EmptyState
              icon={<Icon name="box" size={34} />}
              title="Inventario vacío"
              description="No hay unidades registradas por el momento."
            />
          }
        >
          {(rows) => (
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Tabla de inventario"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">Equipo</th>
                    <th scope="col">Código</th>
                    <th scope="col">Batería</th>
                    <th scope="col">Estado actual</th>
                    <th scope="col">Actualizar estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="table-product">
                          <img src={p.image} alt="" />
                          <strong>
                            {p.name} · {p.storage}
                          </strong>
                        </div>
                      </td>
                      <td>{p.id}</td>
                      <td>{p.battery}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        <select
                          value={p.status}
                          onChange={(e) =>
                            update(p.id, e.target.value as Status)
                          }
                          aria-label={`Actualizar estado de ${p.name}`}
                        >
                          <option>Disponible</option>
                          <option>Reservado</option>
                          <option>Vendido</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryState>
      </article>
    </div>
  )
}

function GenericAdminPage({
  type,
}: {
  type: "orders" | "sales" | "notices" | "settings"
}) {
  const isSales = type === "sales"
  const orderOrSaleRows = useMemo(
    () =>
      isSales
        ? [
            [
              "18 may 2025",
              "iPhone 15 Pro",
              "Laura Medina",
              "$22,490",
              "Transferencia",
              "#VC-0176",
            ],
            [
              "16 may 2025",
              "iPhone 13",
              "Sofía Reyes",
              "$10,990",
              "Efectivo",
              "#VC-0171",
            ],
            [
              "12 may 2025",
              "iPhone 14 Pro",
              "Manuel Ruiz",
              "$17,800",
              "Transferencia",
              "#VC-0168",
            ],
          ]
        : [
            [
              "#VC-0184",
              "Mariana López",
              "iPhone 15 Pro",
              "Hoy, 10:24",
              "$22,990",
              "Pendiente",
            ],
            [
              "#VC-0183",
              "Daniel Torres",
              "iPhone 14 Pro Max",
              "Ayer, 18:40",
              "$19,490",
              "Confirmado",
            ],
            [
              "#VC-0182",
              "Sofía Reyes",
              "iPhone 13",
              "Ayer, 12:15",
              "$10,990",
              "Completado",
            ],
          ],
    [isSales],
  )
  const commercialQuery = useLocalResource({ data: commercialConfig })
  const recordsQuery = useLocalResource({ data: orderOrSaleRows })
  if (type === "settings" || type === "notices")
    return (
      <div className="admin-content page-enter">
        <PageTitle
          eyebrow={type === "settings" ? "Preferencias" : "Contenido editable"}
          title={
            type === "settings" ? "Configuración general" : "Avisos comerciales"
          }
          description={
            type === "settings"
              ? "Administra la información pública y los datos de contacto."
              : "Actualiza los mensajes informativos que ven tus clientes."
          }
          action={<Button>Guardar cambios</Button>}
        />
        <QueryState
          resource={commercialQuery}
          skeleton={<CommercialConfigSkeleton />}
          errorTitle="No se pudo cargar la configuración"
          errorFallback="No fue posible obtener los datos comerciales. Intenta de nuevo."
        >
          {(config) => (
            <form className="settings-card">
              <div className="settings-section">
                <div>
                  <h3>
                    {type === "settings"
                      ? "Identidad del negocio"
                      : "Contenido de avisos"}
                  </h3>
                  <p>
                    {type === "settings"
                      ? "Información principal visible para tus clientes."
                      : "Comunica condiciones de forma clara y responsable."}
                  </p>
                </div>
                <div className="settings-fields">
                  {type === "settings" ? (
                    <>
                      <Field
                        label="Nombre del negocio"
                        defaultValue={config.businessName}
                      />
                      <Field
                        label="Número de WhatsApp"
                        defaultValue={
                          config.contact.phone || "Configuración pendiente"
                        }
                      />
                      <Field
                        label="Correo de contacto"
                        defaultValue={
                          config.contact.email || "Configuración pendiente"
                        }
                      />
                      <Field
                        label="Horario de atención"
                        defaultValue={
                          config.contact.supportHours ||
                          "Configuración pendiente"
                        }
                      />
                    </>
                  ) : (
                    <>
                      <Field
                        label="Encabezado"
                        defaultValue={`${config.notices.titleLead} ${config.notices.titleAccent}`}
                      />
                      <Field
                        label="Aviso 1"
                        defaultValue={config.policies.notRefurbishedTitle}
                      />
                      <Field
                        label="Aviso 2"
                        defaultValue={config.policies.noReplacedPartsTitle}
                      />
                      <Field
                        label="Aviso 3"
                        defaultValue={config.policies.unlockedTitle}
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="settings-section">
                <div>
                  <h3>Información comercial</h3>
                  <p>Textos que acompañan el proceso de compra.</p>
                </div>
                <div className="settings-fields full">
                  <Field label="Condiciones de garantía">
                    <textarea
                      rows={5}
                      defaultValue={config.policies.warrantyText}
                    />
                  </Field>
                  <Field label="Información sobre entregas">
                    <textarea
                      rows={5}
                      defaultValue={
                        config.policies.deliveryModes?.join(" · ") ||
                        "Configuración pendiente · Modalidades de entrega"
                      }
                    />
                  </Field>
                </div>
              </div>
              <footer>
                <Button variant="secondary">Cancelar</Button>
                <Button>Guardar cambios</Button>
              </footer>
            </form>
          )}
        </QueryState>
      </div>
    )
  const tableHeaders = isSales
    ? [
        "Fecha",
        "Producto",
        "Cliente",
        "Precio de venta",
        "Método de pago",
        "Folio",
      ]
    : ["Folio", "Cliente", "Producto", "Fecha", "Importe", "Estado"]
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow={isSales ? "Historial comercial" : "Solicitudes"}
        title={isSales ? "Ventas" : "Pedidos"}
        description={
          isSales
            ? "Consulta las ventas completadas y el resumen de ingresos."
            : "Da seguimiento a cada solicitud y actualiza su estado."
        }
        action={
          isSales ? (
            <Button variant="secondary">Exportar reporte</Button>
          ) : undefined
        }
      />
      {isSales && (
        <div className="stat-grid compact">
          <article className="stat-card">
            <span>Ingresos este mes</span>
            <strong>$384,720</strong>
            <p>28 ventas registradas</p>
          </article>
          <article className="stat-card">
            <span>Ticket promedio</span>
            <strong>$13,740</strong>
            <p>+4.2% este mes</p>
          </article>
        </div>
      )}
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input placeholder={`Buscar ${isSales ? "venta" : "pedido"}...`} />
        </label>
        <Button variant="secondary">Filtrar por fecha</Button>
        <Button variant="secondary">Estado</Button>
      </div>
      <QueryState
        resource={recordsQuery}
        skeleton={
          <TableSkeleton
            columns={tableHeaders.length}
            rows={5}
            headers={tableHeaders}
          />
        }
        errorTitle={
          isSales
            ? "No se pudieron cargar las ventas"
            : "No se pudieron cargar los pedidos"
        }
        errorFallback="Hubo un problema al consultar los registros. Intenta de nuevo."
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={<Icon name={isSales ? "chart" : "orders"} size={34} />}
            title={isSales ? "Sin ventas registradas" : "Sin pedidos"}
            description={
              isSales
                ? "Cuando se completen ventas aparecerán en este historial."
                : "Cuando lleguen solicitudes aparecerán en esta lista."
            }
          />
        }
      >
        {(tableRows) => (
          <article className="table-card">
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label={isSales ? "Tabla de ventas" : "Tabla de pedidos"}
            >
              <table>
                <thead>
                  <tr>
                    {tableHeaders.map((x) => (
                      <th key={x} scope="col">
                        {x}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((r, i) => (
                    <tr key={i}>
                      {r.map((x, j) => (
                        <td key={x}>
                          {!isSales && j === 5 ? (
                            <StatusBadge status={x} />
                          ) : (
                            x
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        )}
      </QueryState>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<PublicView | "admin-login" | "admin">(
    "welcome",
  )
  const [adminView, setAdminView] = useState<AdminView>("dashboard")
  const [products, setProducts] = useState(initialProducts)
  const [selected, setSelected] = useState(initialProducts[0])
  const [customerName, setCustomerName] = useState("")
  const [noticesReturnView, setNoticesReturnView] =
    useState<PublicView>("welcome")
  const focusKey = view === "admin" ? `admin:${adminView}` : view
  useViewFocus(focusKey)
  const openProduct = (p: Product) => {
    setSelected(p)
    setView("detail")
  }
  const openNotices = () => {
    if (
      view === "catalog" ||
      view === "detail" ||
      view === "checkout" ||
      view === "success" ||
      view === "contact"
    ) {
      setNoticesReturnView(view)
    }
    setView("notices")
  }
  const openContact = () => {
    setView("contact")
  }
  let content: ReactNode = null
  if (view === "welcome")
    content = (
      <Welcome
        onNext={() => {
          setNoticesReturnView("welcome")
          setView("notices")
        }}
        onSkip={() => setView("catalog")}
      />
    )
  else if (view === "notices")
    content = (
      <Notices
        onContinue={() => setView("catalog")}
        onBack={() => setView(noticesReturnView)}
      />
    )
  else if (view === "contact")
    content = (
      <ContactPage
        onBack={() => setView("catalog")}
        onAdmin={() => setView("admin-login")}
        onOpenNotices={openNotices}
      />
    )
  else if (view === "catalog")
    content = (
      <Catalog
        products={products}
        onSelect={openProduct}
        goAdmin={() => setView("admin-login")}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  else if (view === "detail")
    content = (
      <Detail
        product={selected}
        products={products}
        onBack={() => setView("catalog")}
        onBuy={() => setView("checkout")}
        onSelect={openProduct}
        goAdmin={() => setView("admin-login")}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  else if (view === "checkout")
    content = (
      <Checkout
        product={selected}
        onBack={() => setView("detail")}
        onComplete={(name) => {
          setCustomerName(name)
          setView("success")
        }}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
        onOpenCatalog={() => setView("catalog")}
      />
    )
  else if (view === "success")
    content = (
      <Success
        product={selected}
        name={customerName}
        onCatalog={() => setView("catalog")}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  else if (view === "admin-login")
    content = (
      <AdminLogin
        onLogin={() => setView("admin")}
        onBack={() => setView("catalog")}
      />
    )
  else
    content = (
      <AdminShell
        active={adminView}
        setActive={setAdminView}
        onLogout={() => setView("catalog")}
      >
        {adminView === "dashboard" && <Dashboard />}
        {adminView === "products" && (
          <ProductsAdmin products={products} setProducts={setProducts} />
        )}
        {adminView === "inventory" && (
          <Inventory products={products} setProducts={setProducts} />
        )}
        {(adminView === "orders" ||
          adminView === "sales" ||
          adminView === "notices" ||
          adminView === "settings") && <GenericAdminPage type={adminView} />}
      </AdminShell>
    )

  return (
    <>
      {view !== "admin" && <SkipLink />}
      {content}
    </>
  )
}
