import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Button, Field, Icon } from "@/components/ui"
import { State } from "@/components/admin/AdminUi"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import type { Order, Product } from "@/types/models"

export function ReservationDialog({ product, onClose, onSaved }: {
  product: Product
  onClose: () => void
  onSaved: (order: Order) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [page, setPage] = useState(1)
  const [source, setSource] = useState("")
  const [mode, setMode] = useState<"local" | "envio">("local")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const requestKey = useRef(crypto.randomUUID())
  const load = useCallback(() => api.orders({ productId: product.dbId || product.id, status: "pendiente", page, limit: 10 }), [product.dbId, product.id, page])
  const pending = useData(load)
  const selected = pending.data?.orders.find((o) => o.id === source)
  useEffect(() => {
    const element = dialog.current
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    element?.showModal()
    return () => { element?.close(); document.body.style.overflow = overflow }
  }, [])
  useEffect(() => {
    if (pending.data?.total === 0) setSource("new")
  }, [pending.data])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy || pending.loading || pending.error || (!selected && source !== "new") || product.status === "Vendido") return
    const form = new FormData(event.currentTarget)
    setBusy(true)
    setError("")
    try {
      const base = { productId: product.dbId || product.id, expectedStatus: product.status }
      const { order } = await api.reserveProduct(selected ? { ...base, orderId: selected.id } : {
        ...base, customerName: String(form.get("customerName")), customerPhone: String(form.get("customerPhone")),
        deliveryMode: mode, ...(mode === "envio" ? { shippingDestination: String(form.get("shippingDestination")) } : {}),
      }, requestKey.current)
      onSaved(order)
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo reservar el equipo") }
    finally { setBusy(false) }
  }
  return createPortal(<dialog ref={dialog} className="product-modal reservation-dialog" aria-labelledby="reservation-title" onCancel={(e) => { e.preventDefault(); if (!busy) onClose() }}>
    <header>
      <div><span className="eyebrow">Reserva con seguimiento</span><h2 id="reservation-title">{product.status === "Reservado" ? "Completar reserva" : "Reservar equipo"}</h2></div>
      <button type="button" className="modal-close" disabled={busy} onClick={onClose} aria-label="Cerrar reserva"><Icon name="close" /></button>
    </header>
    <form onSubmit={submit}>
      <div className="reservation-summary"><strong>{product.name} · {product.storage}</strong><span>{product.id} · {product.color}</span></div>
      {product.status === "Reservado" && <p className="request-note">Este equipo ya está reservado, pero no tiene un pedido asociado. Completa la información para conservar su seguimiento.</p>}
      <State loading={pending.loading} error={pending.error} retry={pending.reload} />
      {error && <p className="form-banner-error" role="alert">{error}</p>}
      <fieldset className="product-form-fields" disabled={busy || pending.loading || Boolean(pending.error)}>
        {!!pending.data?.total && <>
          <Field label="Pedido que se reservará" required>
            <select required value={source} onChange={(e) => { setSource(e.target.value); setError("") }}>
              <option value="">Selecciona una solicitud o crea una reserva nueva</option>
              {pending.data.orders.map((o) => <option key={o.id} value={o.id}>{o.folio} · {o.customerName} · {o.customerPhone}</option>)}
              <option value="new">Nueva reserva para otro cliente</option>
            </select>
          </Field>
          {pending.data.pages > 1 && <nav className="reservation-pagination" aria-label="Páginas de solicitudes del equipo">
            <Button variant="secondary" disabled={page <= 1} onClick={() => { setSource(""); setPage((p) => p - 1) }}>Anterior</Button>
            <span>{pending.data.page} / {pending.data.pages}</span>
            <Button variant="secondary" disabled={page >= pending.data.pages} onClick={() => { setSource(""); setPage((p) => p + 1) }}>Siguiente</Button>
          </nav>}
        </>}
        {selected && <div className="reservation-summary">
          <strong>{selected.customerName}</strong><span>{selected.customerPhone}</span>
          <span>{selected.deliveryMode === "envio" ? `Envío: ${selected.shippingDestination}` : "Entrega local"}</span>
          <p>Se confirmará esta solicitud conservando su folio.</p>
        </div>}
        {source === "new" && <div className="form-grid">
          <Field label="Nombre del cliente" required><input name="customerName" required minLength={2} maxLength={120} autoComplete="name" /></Field>
          <Field label="WhatsApp del cliente" required><input name="customerPhone" type="tel" required minLength={10} maxLength={25} autoComplete="tel" /></Field>
          <Field label="Modalidad de entrega" required><select value={mode} onChange={(e) => setMode(e.target.value as "local" | "envio")}><option value="local">Entrega local</option><option value="envio">Envío nacional</option></select></Field>
          {mode === "envio" && <Field label="Destino del envío" required><textarea name="shippingDestination" required minLength={8} maxLength={600} rows={3} /></Field>}
        </div>}
        <p className="request-note">La reserva aparta esta unidad y crea o confirma el pedido. La venta y la entrega se registran por separado.</p>
        <footer><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" variant="gold" disabled={!selected && source !== "new"}>{busy ? "Reservando…" : selected ? "Confirmar pedido y reservar" : "Crear pedido y reservar"}</Button></footer>
      </fieldset>
    </form>
  </dialog>, document.body)
}
