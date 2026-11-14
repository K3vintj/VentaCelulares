import type { Navigation } from "@/components/store/FlowLayout"
import { Brand, FooterLinks } from "@/components/store/FlowLayout"
import { Field } from "@/components/ui"
import { api, ApiError } from "@/services/api"
import type { OrderConfirmation, Product } from "@/types/models"
import { mxn as money } from "@/utils/format"
import type { FormEvent } from "react"
import { useState } from "react"
import { useRef } from "react"
import { errorMessage } from "@/utils/errors"

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
