import { Field } from "@/components/ui"
import { api } from "@/services/api"
import type { Delivery, Order } from "@/types/models"
import type { FormEvent } from "react"
import { useState } from "react"

export function DeliveryForm({
  order,
  onSaved,
}: {
  order: Order
  onSaved: () => void
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const [mode, setMode] = useState(order.delivery?.mode || order.deliveryMode)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const input = {
      mode,
      destination: mode === "envio" ? String(data.get("destination")) : null,
      carrier: mode === "envio" ? String(data.get("carrier")) : null,
      trackingNumber: mode === "envio" ? String(data.get("tracking")) : null,
      status: String(data.get("status")) as Delivery["status"],
      notes: String(data.get("notes") || ""),
    }
    setBusy(true)
    setError("")
    try {
      await api.saveDelivery(order.id, input)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la entrega")
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="admin-inline-form" onSubmit={submit}>
      <h3>Entrega · {order.folio}</h3>
      <div className="form-grid">
        <Field label="Modalidad">
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
          >
            <option value="local">Entrega local</option>
            <option value="envio">Envío</option>
          </select>
        </Field>
        <Field label="Estado">
          <select
            name="status"
            defaultValue={order.delivery?.status || "pendiente"}
          >
            {["pendiente", "en_ruta", "entregado", "incidencia"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        {mode === "envio" && (
          <>
            <Field label="Destino">
              <input
                name="destination"
                required
                minLength={8}
                defaultValue={
                  order.delivery?.destination || order.shippingDestination || ""
                }
              />
            </Field>
            <Field label="Paquetería">
              <input
                name="carrier"
                defaultValue={order.delivery?.carrier || ""}
              />
            </Field>
            <Field label="Guía de rastreo">
              <input
                name="tracking"
                defaultValue={order.delivery?.trackingNumber || ""}
              />
            </Field>
          </>
        )}
        <Field label="Notas e incidencias">
          <textarea name="notes" defaultValue={order.delivery?.notes || ""} />
        </Field>
      </div>
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Guardar entrega"}
      </button>
    </form>
  )
}
