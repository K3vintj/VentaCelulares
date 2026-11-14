import { Field } from "@/components/ui"
import { api } from "@/services/api"
import type { Order, Product } from "@/types/models"
import type { FormEvent } from "react"
import { useState } from "react"

export function SaleForm({
  products,
  order,
  onSaved,
  onCancel,
}: {
  products: Product[]
  order?: Order
  onSaved: () => void
  onCancel?: () => void
}) {
  const [productId, setProductId] = useState(
    order?.productId || products[0]?.dbId || "",
  )
  const [price, setPrice] = useState(
    String(order?.priceSnapshot || products[0]?.price || ""),
  )
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const form = new FormData(e.currentTarget)
    setBusy(true)
    setError("")
    try {
      await api.createSale({
        productId,
        ...(order ? { orderId: order.id } : {}),
        finalPrice: Number(price),
        paymentMethod: String(form.get("payment")),
      })
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo registrar la venta")
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="admin-inline-form" onSubmit={submit}>
      <h3>Registrar venta confirmada {order ? `· ${order.folio}` : ""}</h3>
      <p>
        Registra únicamente el pago confirmado con el comprador. La unidad
        quedará vendida.
      </p>
      <div className="form-grid">
        {order ? (
          <p>{order.productNameSnapshot}</p>
        ) : (
          <Field label="Unidad">
            <select
              required
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value)
                setPrice(
                  String(
                    products.find((p) => p.dbId === e.target.value)?.price ||
                      "",
                  ),
                )
              }}
            >
              <option value="">Selecciona un equipo</option>
              {products
                .filter((p) => p.status !== "Vendido")
                .map((p) => (
                  <option key={p.id} value={p.dbId}>
                    {p.id} · {p.name}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Importe final (MXN)">
          <input
            type="number"
            required
            min={1}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </Field>
        <Field label="Método de pago externo">
          <select name="payment">
            <option>Efectivo</option>
            <option>Transferencia</option>
          </select>
        </Field>
      </div>
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-actions">
        <button className="btn btn-gold" type="submit" disabled={busy}>
          {busy ? "Registrando…" : "Confirmar venta"}
        </button>
        {onCancel && (
          <button
            className="btn btn-secondary"
            type="button"
            onClick={onCancel}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
