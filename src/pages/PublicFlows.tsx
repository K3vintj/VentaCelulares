import { useRef, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { api, ApiError } from "@/services/api"
import { commercialConfig } from "@/config/commercial"
import type { Admin, OrderConfirmation, Product } from "@/types/models"

const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "No se pudo completar la operación"
function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo logo-button" type="button" onClick={onClick}>
      <img className="logo-img" src={commercialConfig.logoSrc} alt="" />
      <span className="logo-text">{commercialConfig.businessName}</span>
    </button>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}
type Navigation = {
  onOpenCatalog: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
  footer?: ReactNode
}
function FooterLinks(props: Navigation) {
  if (props.footer) return <>{props.footer}</>
  return (
    <footer className="flow-links">
      <button onClick={props.onOpenCatalog}>Catálogo</button>
      <button onClick={props.onOpenNotices}>Condiciones y privacidad</button>
      <button onClick={props.onOpenContact}>Contacto</button>
    </footer>
  )
}
export function Checkout({
  product,
  onBack,
  onComplete,
  ...navigation
}: Navigation & {
  product: Product
  onBack: () => void
  onComplete: (data: OrderConfirmation) => void
}) {
  const [mode, setMode] = useState<"local" | "envio">("local")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const attempt = useRef<{ key: string; body: string } | null>(null)
  const inFlight = useRef(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (inFlight.current) return
    const data = new FormData(event.currentTarget)
    const body = {
      productId: product.dbId || product.id,
      customerName: String(data.get("name")),
      customerPhone: String(data.get("phone")),
      consentAccepted: data.get("consent") === "on",
      deliveryMode: mode,
      ...(mode === "envio"
        ? { shippingDestination: String(data.get("destination")) }
        : {}),
    }
    const fingerprint = JSON.stringify(body)
    if (!attempt.current || attempt.current.body !== fingerprint)
      attempt.current = { key: crypto.randomUUID(), body: fingerprint }
    inFlight.current = true
    setBusy(true)
    setError("")
    try {
      onComplete(await api.createOrder(body, attempt.current.key))
    } catch (e) {
      setError(
        e instanceof ApiError && e.fields
          ? `${e.message}. ${Object.values(e.fields).flat().join(". ")}`
          : errorMessage(e),
      )
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }
  return (
    <main className="checkout page-enter">
      <nav className="simple-nav">
        <button className="text-link" onClick={onBack}>
          ← Volver
        </button>
        <Brand onClick={navigation.onOpenCatalog} />
      </nav>
      <section className="checkout-layout">
        <div className="checkout-intro">
          <span className="eyebrow">Solicitud de compra</span>
          <h1>Estás a un paso.</h1>
          <p>
            Déjanos tus datos para confirmar disponibilidad y coordinar la
            entrega.
          </p>
          <div className="mini-product">
            <img src={product.image} alt={product.name} />
            <div>
              <span>{product.id}</span>
              <h3>{product.name}</h3>
              <p>
                {product.storage} · {product.color}
              </p>
              <strong>{money(product.price)}</strong>
            </div>
          </div>
          <div className="request-note">
            <p>
              El precio es de referencia. Enviar esta solicitud no cobra ni
              reserva el equipo automáticamente. La disponibilidad y el costo de
              entrega se confirman con el negocio.
            </p>
          </div>
        </div>
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-heading">
            <span>01</span>
            <div>
              <h2>Datos de contacto</h2>
              <p>Campos con * obligatorios.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nombre completo *">
              <input
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
              />
            </Field>
            <Field label="Teléfono / WhatsApp *">
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                minLength={10}
                maxLength={25}
              />
            </Field>
            <Field label="Método de entrega *">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as typeof mode)}
              >
                <option value="local">Entrega local</option>
                <option value="envio">Envío</option>
              </select>
            </Field>
          </div>
          {mode === "envio" && (
            <Field label="Destino del envío *">
              <textarea
                name="destination"
                autoComplete="street-address"
                required
                minLength={8}
                maxLength={600}
                rows={3}
                placeholder="Dirección, ciudad, estado y código postal"
              />
            </Field>
          )}
          <label className="check-row">
            <input name="consent" type="checkbox" required />
            <span>
              Acepto el uso de mis datos para atender esta solicitud y entiendo
              que está sujeta a confirmación.{" "}
              <button
                className="text-link"
                type="button"
                onClick={navigation.onOpenNotices}
              >
                Consultar condiciones
              </button>
            </span>
          </label>
          {error && (
            <p role="alert" className="form-banner-error">
              {error}
            </p>
          )}
          <button className="btn btn-gold wide" disabled={busy} type="submit">
            {busy ? "Guardando solicitud…" : "Enviar solicitud"}
          </button>
        </form>
      </section>
      <FooterLinks {...navigation} />
    </main>
  )
}
export function Success({
  confirmation,
  onCatalog,
  onOpenNotices,
  onOpenContact,
  footer,
}: {
  confirmation: OrderConfirmation
  onCatalog: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
  footer?: ReactNode
}) {
  const { order, whatsappUrl } = confirmation
  return (
    <main className="success page-enter">
      <Brand onClick={onCatalog} />
      <div className="success-card">
        <span className="success-icon">✓</span>
        <span className="eyebrow">Solicitud guardada</span>
        <h1>Gracias, {order.customerName}.</h1>
        <p>
          Confirmaremos contigo la disponibilidad y las condiciones de entrega.
        </p>
        <div className="folio">
          <span>Tu folio</span>
          <strong>{order.folio}</strong>
        </div>
        <div className="confirmation-product">
          <div>
            <span>Producto</span>
            <strong>{order.productNameSnapshot}</strong>
          </div>
          <div>
            <span>Precio de referencia</span>
            <strong>{money(order.priceSnapshot)}</strong>
          </div>
          <div>
            <span>Entrega</span>
            <strong>
              {order.deliveryMode === "envio" ? "Envío" : "Local"}
            </strong>
          </div>
        </div>
        <div className="request-note">
          <p>La solicitud no representa un pago ni una reserva garantizada.</p>
        </div>
        <div className="success-actions">
          <button className="btn btn-gold" onClick={onCatalog}>
            Volver al catálogo
          </button>
          <a
            className="btn btn-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Continuar por WhatsApp
          </a>
        </div>
      </div>
      <FooterLinks
        footer={footer}
        onOpenCatalog={onCatalog}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
      />
    </main>
  )
}
export function AdminLogin({
  onLogin,
  onBack,
}: {
  onLogin: (admin: Admin) => void
  onBack: () => void
}) {
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    setBusy(true)
    setError("")
    try {
      onLogin(
        (
          await api.login(
            String(data.get("email")),
            String(data.get("password")),
          )
        ).admin,
      )
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <main className="admin-login page-enter">
      <div className="login-brand">
        <Brand onClick={onBack} />
        <button className="text-link" onClick={onBack}>
          Volver a la tienda
        </button>
      </div>
      <section className="login-card">
        <span className="eyebrow">Acceso privado</span>
        <h1>Bienvenido de nuevo.</h1>
        <p>Administra {commercialConfig.businessName}.</p>
        <form onSubmit={submit}>
          <Field label="Correo electrónico">
            <input name="email" type="email" autoComplete="username" required />
          </Field>
          <Field label="Contraseña">
            <div className="password-field">
              <input
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {show ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </Field>
          {error && (
            <p className="form-banner-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn btn-primary wide"
            type="submit"
            disabled={busy}
          >
            {busy ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  )
}
