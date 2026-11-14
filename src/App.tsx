import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useMemo,
  useEffect,
  useCallback,
  useState,
} from "react"
import {
  commercialConfig,
  getConfiguredSocialLinks,
  getProductWarrantyText,
  getWarrantyLabel,
  openWhatsApp,
} from "@/config/commercial"

import type {
  Product,
  Status,
  DeviceCondition,
  BiometricOption,
  Admin,
  OrderConfirmation,
  BusinessConfig,
} from "@/types/models"
import { api, ApiError } from "@/services/api"
import { Checkout, Success, AdminLogin } from "@/pages/PublicFlows"
import {
  Dashboard,
  OrdersPage,
  SalesPage,
  ConfigPage,
} from "@/pages/AdminPages"
import { PhotoManager } from "@/components/PhotoManager"
import { applyBusinessConfig } from "@/config/commercial"

type PublicView = "welcome" | "notices" | "catalog" | "detail" | "checkout" | "success" | "contact"
type AdminView = "dashboard" | "products" | "inventory" | "orders" | "sales" | "notices" | "settings"
const createProductDefaults =
  (): Omit<Product, "id" | "name" | "storage" | "color" | "battery" | "price" | "status" | "condition" | "image" | "description"> => ({
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
      <img src={commercialConfig.logoSrc} alt="" className="logo-img" />
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
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger" | "whatsapp" | "gold"
  icon?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
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
      <i />
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
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void
  error?: string
  min?: number | string
  max?: number | string
  step?: number | string
  children?: ReactNode
}) {
  return (
    <label className={`field${error ? " field-error" : ""}`}>
      <span>
        {label}
        {required && " *"}
      </span>
      {children || (
        <input
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
          aria-invalid={Boolean(error)}
        />
      )}
      {error && <em className="field-error-msg">{error}</em>}
    </label>
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
    <main className="welcome page-enter">
      <div className="welcome-glow" />
      <header className="welcome-top">
        <Logo onClick={onSkip} />
        <button className="text-link" onClick={onSkip}>
          Ir al catálogo
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
        <Button variant="gold" icon="arrow" onClick={onNext}>
          Siguiente
        </Button>
        <span className="microcopy">Equipos nuevos y seminuevos</span>
      </div>
      <div className="hero-product">
        <div className="hero-orbit" />
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
    <main className="notices page-enter">
      <div className="ambient ambient-one" />
      <nav className="simple-nav">
        <button className="icon-button" onClick={onBack}>
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
              <div
                className="notice-icon notice-icon-positive"
                aria-hidden="true"
              >
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
                className={`notice-card${
                  item.positive ? " notice-positive" : ""
                }`}
                key={item.id}
              >
                <div
                  className={`notice-icon${
                    item.positive ? " notice-icon-positive" : ""
                  }`}
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
  return (
    <header className="store-header">
      <Logo onClick={goCatalog} />
      <nav className={open ? "store-nav open" : "store-nav"}>
        <button onClick={goCatalog}>Catálogo</button>
        <button onClick={goNotices || goCatalog}>Condiciones</button>
        <button onClick={goContact || goCatalog}>Contacto</button>
      </nav>
      <div className="header-actions">
        {commercialConfig.contact.whatsapp && (
          <Button variant="whatsapp" onClick={() => openWhatsApp()}>
            WhatsApp
          </Button>
        )}
        <button className="menu-button" onClick={() => setOpen(!open)}>
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
        <section
          className="footer-social"
          aria-labelledby="footer-social-title"
        >
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
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
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
      </div>
    </footer>
  )
}

function ConditionBadge({ condition }: { condition: DeviceCondition }) {
  const label = getConditionLabel(condition)
  return <span className={`condition-tag condition-${condition}`}>{label}</span>
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
    commercialConfig.contact.whatsappLabel || commercialConfig.contact.phone
  return (
    <main className="contact-page page-enter">
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
                  <a href={href} target="_blank" rel="noopener noreferrer">
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
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Todos")
  const [conditionFilter, setConditionFilter] =
    useState<"Todos" | DeviceCondition>("Todos")
  const [sort, setSort] = useState("Recientes")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (status !== "Todos" ? 1 : 0) + (conditionFilter !== "Todos" ? 1 : 0)
  const publishedProducts = useMemo(
    () => products.filter((p) => p.isPublished),
    [products],
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
  return (
    <main className="catalog page-enter">
      <StoreHeader
        goCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <section className="catalog-hero">
        <div>
          <span className="eyebrow">
            Catálogo ·{" "}
            <span className="availability-count">
              {
                publishedProducts.filter((p) => p.status === "Disponible")
                  .length
              }{" "}
              disponibles
            </span>
          </span>
          <h1>
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
      <section className="catalog-tools">
        <label className="search-box">
          <Icon name="search" />
          <input
            placeholder="Buscar por modelo, color o capacidad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filtros{" "}
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
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
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recientes</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
          </select>
        </label>
      </section>
      <section className={filtersOpen ? "filter-strip open" : "filter-strip"}>
        <span className="filter-group-label">Disponibilidad</span>
        {["Todos", "Disponible", "Reservado", "Vendido"].map((item) => (
          <button
            className={[
              status === item ? "active" : "",
              item === "Disponible" ? "filter-available" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item}
            onClick={() => setStatus(item)}
          >
            {item}
          </button>
        ))}
        <span className="filter-group-label">Condición</span>
        <button
          className={conditionFilter === "Todos" ? "active" : ""}
          onClick={() => setConditionFilter("Todos")}
        >
          Todas
        </button>
        {DEVICE_CONDITIONS.map((item) => (
          <button
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
          >
            {CONDITION_LABELS[item]}
          </button>
        ))}
        <button type="button" disabled title="Filtro pendiente">
          Modelo <Icon name="chevron" size={15} />
        </button>
        <button type="button" disabled title="Filtro pendiente">
          Capacidad <Icon name="chevron" size={15} />
        </button>
      </section>
      <section className="product-grid">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => onSelect(product)}
          />
        ))}
      </section>
      {!filtered.length && (
        <div className="empty-state">
          <Icon name="search" size={34} />
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otro modelo o elimina los filtros.</p>
        </div>
      )}
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
  const [photo, setPhoto] = useState(0)
  const productPhotos = product.photos?.length
    ? product.photos.map((p) => p.url)
    : [product.image]
  const condition = normalizeCondition(product.condition)
  const conditionDisplay = product.conditionNote
    ? `${getConditionLabel(condition)} · ${product.conditionNote}`
    : getConditionLabel(condition)
  const batteryLabel = product.techInfoVerified
    ? product.battery
    : `${product.battery} · No verificada`
  const specs = [
    ["Capacidad", product.storage],
    ["Color", product.color],
    ["Salud de batería", batteryLabel],
    ["Condición comercial", conditionDisplay],
    ["Estado físico", product.physicalCondition || "No indicado"],
    [
      "Estado de pantalla",
      product.techInfoVerified
        ? product.screenCondition || "No indicado"
        : `${product.screenCondition || "No indicado"} · No verificado`,
    ],
    [
      "Cámaras",
      product.techInfoVerified
        ? product.cameraStatus || "No indicado"
        : `${product.cameraStatus || "No indicado"} · No verificado`,
    ],
    ["Face ID / Touch ID", product.biometric],
    ["Liberación", product.unlockStatus || "No indicado"],
    ["Reparaciones / piezas", product.repairHistory || "No indicado"],
    ["Accesorios", product.accessories || "No indicado"],
    ["Garantía comercial", getProductWarrantyText(product.warrantyDays)],
    ["Liberación (política)", commercialConfig.policies.unlockedText],
  ]
  return (
    <main className="detail page-enter">
      <StoreHeader
        goCatalog={onBack}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <div className="breadcrumb">
        <button onClick={onBack}>Catálogo</button>
        <Icon name="chevron" size={14} />
        <span>{product.name}</span>
      </div>
      <section className="detail-layout">
        <div className="gallery">
          <div className="main-photo">
            <img
              key={photo}
              src={productPhotos[photo]}
              alt={`${product.name}, vista ${photo + 1}`}
            />
            <span>Fotografía del equipo</span>
          </div>
          <div className="thumbnails">
            {productPhotos.map((img, i) => (
              <button
                key={img}
                className={photo === i ? "active" : ""}
                onClick={() => setPhoto(i)}
              >
                <img src={img} alt="Vista del producto" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-title">
            <div className="detail-badges">
              <StatusBadge status={product.status} />
              <ConditionBadge condition={condition} />
            </div>
            <span className="sku">{product.id}</span>
            <h1>{product.name}</h1>
            <p>{conditionDisplay}</p>
            <strong>
              {mxn(product.price)} <small>MXN</small>
            </strong>
          </div>
          <p className="detail-description">{product.description}</p>
          {!product.techInfoVerified && (
            <div className="request-note detail-unverified">
              <Icon name="info" size={18} />
              <p>
                Parte de la información técnica de este equipo está marcada como
                no verificada.
              </p>
            </div>
          )}
          {product.observations && (
            <p className="detail-observations">
              <span>Observaciones</span>
              {product.observations}
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
              disabled={product.status !== "Disponible"}
            >
              {product.status === "Disponible"
                ? "Comprar ahora"
                : "No disponible"}
            </Button>
            {commercialConfig.contact.whatsapp && (
              <Button
                variant="whatsapp"
                icon="phone"
                onClick={() =>
                  openWhatsApp(
                    `Hola, me interesa el ${product.name} (${product.id}).`,
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
              Enviar una solicitud no procesa un pago ni garantiza una reserva.
              Confirmaremos la disponibilidad contigo.
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
            .filter((p) => p.isPublished && p.id !== product.id)
            .slice(0, 3)
            .map((p) => (
              <ProductCard product={p} key={p.id} onOpen={() => onSelect(p)} />
            ))}
        </div>
      </section>
      <StoreFooter
        onAdmin={goAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={onBack}
      />
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
  admin,
}: {
  admin: Admin
  active: AdminView
  setActive: (v: AdminView) => void
  onLogout: () => void
  children: ReactNode
}) {
  const [mobileNav, setMobileNav] = useState(false)
  return (
    <main className="admin-shell">
      <aside className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="sidebar-top">
          <Logo />
          <button className="menu-button" onClick={() => setMobileNav(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-label">
          <span>Espacio de trabajo</span>
          <strong>
            VentaCelulares <i>PRO</i>
          </strong>
        </div>
        <nav>
          {adminNav.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => {
                setActive(item.id)
                setMobileNav(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span>{admin.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{admin.name}</strong>
              <small>{admin.email}</small>
            </div>
          </div>
          <button onClick={onLogout}>
            <Icon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}>
            <Icon name="menu" />
          </button>
          <div className="admin-search">
            <span>{commercialConfig.businessName}</span>
          </div>
          <div className="admin-date">
            <span>Datos del servidor</span>
            <strong>Actualizado hoy</strong>
          </div>
          <span className="avatar">{admin.name.slice(0, 2).toUpperCase()}</span>
        </header>
        {children}
      </section>
    </main>
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
  image: "",
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
  refresh,
}: {
  products: Product[]
  refresh: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormValues>(() =>
    buildEmptyProductForm(
      `VC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    ),
  )
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [toast, setToast] = useState("")
  const [toastTone, setToastTone] = useState<"ok" | "error">("ok")
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
  }
  const handleOpenCreate = () => {
    setEditingId(null)
    setErrors({})
    setForm(
      buildEmptyProductForm(
        `VC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ),
    )
    setModal(true)
  }
  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id)
    setErrors({})
    setForm(productToForm(product))
    setModal(true)
  }
  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
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
      if (!current[(name as keyof ProductFormErrors)] && !current.form)
        return current
      const next = { ...current }
      delete next[(name as keyof ProductFormErrors)]
      delete next.form
      return next
    })
  }
  const validateForm = (publish: boolean) => {
    const nextErrors: ProductFormErrors = {}
    if (!form.name.trim()) nextErrors.name = "El modelo es obligatorio"
    if (!form.storage.trim())
      nextErrors.storage = "Selecciona el almacenamiento"
    if (!form.color.trim()) nextErrors.color = "El color es obligatorio"
    if (!/^[A-Z0-9-]{3,40}$/.test(form.id))
      nextErrors.id = "Usa de 3 a 40 letras mayúsculas, números o guiones"
    if (!form.screenCondition.trim())
      nextErrors.screenCondition = "Indica el estado de la pantalla"
    if (!form.cameraStatus.trim())
      nextErrors.cameraStatus = "Indica el funcionamiento de las cámaras"
    if (!form.battery.trim()) nextErrors.battery = "Indica la salud de batería"
    if (!form.condition) nextErrors.condition = "Selecciona la condición"
    if (!form.physicalCondition.trim())
      nextErrors.physicalCondition = "Indica el estado físico"
    if (!form.unlockStatus.trim())
      nextErrors.unlockStatus = "Indica el estado de liberación"
    if (!form.price.trim()) nextErrors.price = "El precio es obligatorio"
    else {
      const price = Number(form.price)
      if (!Number.isInteger(price) || price < 1)
        nextErrors.price = "Indica un precio entero mayor que cero"
    }
    const warranty = Number(form.warrantyDays)
    if (
      !form.warrantyDays.trim() ||
      !Number.isFinite(warranty) ||
      warranty <= 0
    )
      nextErrors.warrantyDays = "Indica los días de garantía (mínimo 1)"
    if (form.battery.trim()) {
      const battery = parseBatteryValue(form.battery)
      if (battery === null || Number.isNaN(battery))
        nextErrors.battery = "Salud de batería inválida"
      else if (battery < 0 || battery > 100)
        nextErrors.battery = "La batería debe estar entre 0 y 100"
    }
    if (publish) {
      if (!form.techInfoVerified)
        nextErrors.techInfoVerified =
          "Confirma la revisión técnica antes de publicar"
      if (!form.verifiedNotRefurbished)
        nextErrors.verifiedNotRefurbished =
          "Debes confirmar que no es reacondicionado"
      if (!form.verifiedNoReplacedParts)
        nextErrors.verifiedNoReplacedParts =
          "Debes confirmar que no tiene piezas reemplazadas"
      if (
        !form.verifiedNotRefurbished ||
        !form.verifiedNoReplacedParts ||
        !form.techInfoVerified
      )
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
      id:
        form.id.trim() || `VC-${String(products.length + 1).padStart(3, "0")}`,
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
      image: form.image,
      description:
        form.description.trim() ||
        `${form.name.trim()} · ${CONDITION_LABELS[normalizeCondition(form.condition)]}`,
      verifiedNotRefurbished: form.verifiedNotRefurbished,
      verifiedNoReplacedParts: form.verifiedNoReplacedParts,
      techInfoVerified: form.techInfoVerified,
      isPublished: publish,
    }
  }
  const handleSave = async (publish: boolean) => {
    if (saving || !validateForm(publish)) return
    setSaving(true)
    try {
      const nextProduct = buildProductFromForm(publish)
      const { product } = await api.saveProduct(nextProduct, isEditing)
      await refresh()
      if (!isEditing) {
        setEditingId(product.id)
        setForm(productToForm(product))
        showToast(
          "Borrador guardado. Agrega las fotografías antes de publicar.",
        )
      } else {
        showToast(publish ? "Producto publicado" : "Borrador guardado")
        handleCloseModal()
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto"
      const fields =
        error instanceof ApiError && error.fields
          ? Object.fromEntries(
              Object.entries(error.fields).map(([key, values]) => [
                key === "sku" ? "id" : key,
                values.join(". "),
              ]),
            )
          : {}
      setErrors({ ...fields, form: message })
      showToast(message, "error")
    } finally {
      setSaving(false)
    }
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSave(isEditing)
  }
  const remove = async (id: string) => {
    if (
      !confirm(
        "¿Archivar este producto y retirarlo del catálogo? Su historial se conserva.",
      )
    )
      return
    try {
      await api.archiveProduct(id)
      await refresh()
      showToast("Producto archivado")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "No se pudo archivar",
        "error",
      )
    }
  }
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description={`${products.length} equipos registrados · ${products.filter((p) => p.isPublished).length} publicados`}
        action={
          <Button icon="plus" onClick={handleOpenCreate}>
            Agregar producto
          </Button>
        }
      />
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input
            placeholder="Buscar producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <article className="table-card">
        <div className="table-scroll">
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
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) =>
                  `${p.id} ${p.name} ${p.color}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((p) => (
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
                        className={`publish-pill${
                          p.isPublished ? " is-live" : ""
                        }`}
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
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="Archivar"
                          onClick={() => remove(p.id)}
                          aria-label={`Archivar ${p.name}`}
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
      {modal && (
        <div className="modal-backdrop" onMouseDown={handleCloseModal}>
          <div
            className="product-modal product-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">
                  {isEditing ? "Edición de unidad" : "Nuevo registro"}
                </span>
                <h2>{isEditing ? "Editar producto" : "Agregar producto"}</h2>
                <p>
                  Completa la información por unidad. Condición y disponibilidad
                  son independientes.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar formulario"
              >
                <Icon name="close" />
              </button>
            </header>
            <form onSubmit={handleSubmit}>
              <p className="form-sim-note">
                Guarda el borrador, agrega las fotos de la unidad y completa las
                verificaciones antes de publicar.
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
                  <Field label="Almacenamiento" required error={errors.storage}>
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
                    error={errors.id}
                    name="id"
                    value={form.id}
                    onChange={handleFieldChange}
                  >
                    <input
                      name="id"
                      value={form.id}
                      onChange={handleFieldChange}
                      readOnly={isEditing}
                    />
                  </Field>
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
                  <p>
                    Disponibilidad: {form.status}. Administra reservas desde
                    Inventario y ventas desde Pedidos o Ventas.
                  </p>
                </div>
              </section>
              <section className="form-section">
                <h3>Revisión técnica</h3>
                <div className="form-grid">
                  <Field
                    label="Estado de pantalla"
                    error={errors.screenCondition}
                    name="screenCondition"
                    placeholder="Ej. Original · Sin detalles"
                    value={form.screenCondition}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Funcionamiento de cámaras"
                    error={errors.cameraStatus}
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
                  className={`check-row form-check${
                    errors.verifiedNotRefurbished ? " field-error" : ""
                  }`}
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
                  className={`check-row form-check${
                    errors.verifiedNoReplacedParts ? " field-error" : ""
                  }`}
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
                <PhotoManager
                  product={products.find((p) => p.id === editingId)}
                  onChanged={refresh}
                />
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
                  disabled={saving}
                  onClick={() => void handleSave(false)}
                >
                  Guardar borrador
                </Button>
                <Button type="submit" variant="gold" disabled={saving}>
                  {saving
                    ? "Guardando…"
                    : isEditing
                      ? "Guardar y publicar"
                      : "Crear borrador"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast toast-${toastTone}`}>
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
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const update = async (id: string, status: Status) => {
    const current = products.find((p) => p.id === id)
    if (!current || status === current.status || busy) return
    setBusy(true)
    setError("")
    try {
      const { product } = await api.productStatus(id, status, current.status)
      setProducts(products.map((p) => (p.id === id ? product : p)))
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar el inventario",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Control de unidades"
        title="Inventario"
        description="Actualiza la disponibilidad. Los cambios se reflejan en el catálogo público."
      />
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <p>
        Para marcar un equipo como vendido, registra la venta en Pedidos o
        Ventas.
      </p>
      <div className="stat-grid compact">
        {[
          ["Total de unidades", products.length],
          [
            "Disponibles",
            products.filter((p) => p.status === "Disponible").length,
          ],
          [
            "Reservadas",
            products.filter((p) => p.status === "Reservado").length,
          ],
          ["Vendidas", products.filter((p) => p.status === "Vendido").length],
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
            <input
              placeholder="Buscar unidad..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Batería</th>
                <th>Estado actual</th>
                <th>Actualizar estado</th>
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) =>
                  `${p.id} ${p.name}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <img src={p.image} />
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
                        disabled={busy || p.status === "Vendido"}
                        onChange={(e) => update(p.id, e.target.value as Status)}
                      >
                        <option>Disponible</option>
                        <option>Reservado</option>
                        {p.status === "Vendido" && <option>Vendido</option>}
                      </select>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}

export default function App() {
  const adminLocation = () =>
    window.location.hash === "#admin" || window.location.pathname === "/admin"
  const [view, setView] = useState<PublicView | "admin-login" | "admin">(() =>
    adminLocation() ? "admin-login" : "welcome",
  )
  const [adminView, setAdminView] = useState<AdminView>("dashboard")
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [configRevision, setConfigRevision] = useState(0)
  const [noticesReturnView, setNoticesReturnView] =
    useState<PublicView>("welcome")
  const applyConfig = useCallback((config: BusinessConfig) => {
    applyBusinessConfig(config)
    setConfigRevision((n) => n + 1)
  }, [])
  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await api.products(Boolean(admin))
      if (admin) setAdminProducts(result.products)
      else setProducts(result.products)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo")
    } finally {
      setLoading(false)
    }
  }, [admin])
  useEffect(() => {
    void refresh()
  }, [refresh])
  useEffect(() => {
    let live = true
    api
      .me()
      .then(({ admin }) => {
        if (live) {
          setAdmin(admin)
          if (adminLocation()) setView("admin")
        }
      })
      .catch(() => {})
      .finally(() => {
        if (live) setCheckingSession(false)
      })
    api
      .config()
      .then(({ config }) => {
        if (live) applyConfig(config)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [applyConfig])
  useEffect(() => {
    const open = () => setView(admin ? "admin" : "admin-login")
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault()
        open()
      }
    }
    const hash = () => {
      if (adminLocation()) open()
    }
    const expired = () => {
      setAdmin(null)
      setAdminProducts([])
      setView("admin-login")
    }
    window.addEventListener("keydown", key)
    window.addEventListener("hashchange", hash)
    window.addEventListener("vc:unauthorized", expired)
    return () => {
      window.removeEventListener("keydown", key)
      window.removeEventListener("hashchange", hash)
      window.removeEventListener("vc:unauthorized", expired)
    }
  }, [admin])
  const goCatalog = () => {
    setView("catalog")
    window.scrollTo(0, 0)
    if (admin)
      api
        .products()
        .then(({ products }) => setProducts(products))
        .catch(() => setError("No se pudo actualizar el catálogo"))
  }
  const openProduct = (product: Product) => {
    setSelected(product)
    setView("detail")
    window.scrollTo(0, 0)
  }
  const openNotices = () => {
    if (view !== "admin" && view !== "admin-login" && view !== "notices")
      setNoticesReturnView(view)
    setView("notices")
    window.scrollTo(0, 0)
  }
  const openContact = () => {
    setView("contact")
    window.scrollTo(0, 0)
  }
  const openAdmin = () => setView(admin ? "admin" : "admin-login")
  const logout = async () => {
    try {
      await api.logout()
      setAdmin(null)
      setAdminProducts([])
      setView("catalog")
      history.replaceState(null, "", "/")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la sesión")
    }
  }
  const loadState = (
    <div className="data-state" role={error ? "alert" : "status"}>
      {loading ? "Cargando equipos…" : error}
      {error && <Button onClick={() => void refresh()}>Reintentar</Button>}
    </div>
  )
  if (view === "welcome")
    return (
      <Welcome
        onNext={() => {
          setNoticesReturnView("welcome")
          setView("notices")
        }}
        onSkip={goCatalog}
      />
    )
  if (view === "notices")
    return (
      <Notices
        key={configRevision}
        onContinue={goCatalog}
        onBack={() => setView(noticesReturnView)}
      />
    )
  if (view === "contact")
    return (
      <ContactPage
        onBack={goCatalog}
        onAdmin={openAdmin}
        onOpenNotices={openNotices}
      />
    )
  if (view === "admin-login")
    return checkingSession ? (
      <main className="data-state" role="status">
        Verificando sesión…
      </main>
    ) : (
      <AdminLogin
        onLogin={(a) => {
          setAdmin(a)
          setView("admin")
        }}
        onBack={goCatalog}
      />
    )
  if (view === "admin" && admin)
    return (
      <AdminShell
        admin={admin}
        active={adminView}
        setActive={(v) => {
          setAdminView(v)
          setError("")
        }}
        onLogout={() => void logout()}
      >
        {error && loadState}
        {adminView === "dashboard" && <Dashboard />}
        {adminView === "products" && (
          <>
            {loading && loadState}
            <ProductsAdmin products={adminProducts} refresh={refresh} />
          </>
        )}
        {adminView === "inventory" &&
          (loading ? (
            loadState
          ) : (
            <Inventory
              products={adminProducts}
              setProducts={setAdminProducts}
            />
          ))}
        {adminView === "orders" && <OrdersPage onChanged={refresh} />}
        {adminView === "sales" && (
          <SalesPage products={adminProducts} onChanged={refresh} />
        )}
        {(adminView === "settings" || adminView === "notices") && (
          <ConfigPage
            key={adminView}
            notices={adminView === "notices"}
            onChanged={applyConfig}
          />
        )}
      </AdminShell>
    )
  if (view === "detail" && selected)
    return (
      <Detail
        key={selected.id}
        product={selected}
        products={products}
        onBack={goCatalog}
        onBuy={() => setView("checkout")}
        onSelect={openProduct}
        goAdmin={openAdmin}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  if (view === "checkout" && selected)
    return (
      <Checkout
        product={selected}
        onBack={() => setView("detail")}
        onComplete={(data) => {
          setConfirmation(data)
          setView("success")
        }}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
        onOpenCatalog={goCatalog}
        footer={
          <StoreFooter
            onOpenCatalog={goCatalog}
            onOpenNotices={openNotices}
            onOpenContact={openContact}
          />
        }
      />
    )
  if (view === "success" && confirmation)
    return (
      <Success
        footer={
          <StoreFooter
            onOpenCatalog={goCatalog}
            onOpenNotices={openNotices}
            onOpenContact={openContact}
          />
        }
        confirmation={confirmation}
        onCatalog={goCatalog}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  return (
    <>
      {(loading || error) && loadState}
      <Catalog
        products={products}
        onSelect={openProduct}
        goAdmin={openAdmin}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    </>
  )
}
