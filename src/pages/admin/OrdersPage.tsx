import { State, Title } from "@/components/admin/AdminUi"
import { DeliveryForm } from "@/components/admin/DeliveryForm"
import { SaleForm } from "@/components/admin/SaleForm"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import { formatDate as date, mxn as money } from "@/utils/format"
import { useState } from "react"

export function OrdersPage({ onChanged }: { onChanged: () => Promise<void> }) {
  const { data, loading, error, reload } = useData(api.orders)
  const [selected, setSelected] = useState<string | null>(null),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false)
  const [query, setQuery] = useState("")
  const order = data?.orders.find((o) => o.id === selected)
  const refresh = async () => {
    await reload()
    await onChanged()
  }
  const change = async (id: string, status: string) => {
    setBusy(true)
    setActionError("")
    try {
      await api.orderStatus(id, status)
      await refresh()
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo cambiar el estado",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-content page-enter">
      <Title
        title="Pedidos y entregas"
        text="Confirma solicitudes, registra ventas y da seguimiento a cada entrega."
      />
      <State loading={loading} error={error} retry={reload} />
      {actionError && (
        <p className="form-banner-error" role="alert">
          {actionError}
        </p>
      )}
      <label className="search-box">
        <input
          placeholder="Buscar folio, cliente o equipo…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <article className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Folio / fecha</th>
                <th>Cliente</th>
                <th>Equipo</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data?.orders
                .filter((o) =>
                  `${o.folio} ${o.customerName} ${o.productNameSnapshot}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((o) => (
                  <tr key={o.id}>
                    <td>
                      {o.folio}
                      <small className="cell-subline">
                        {date(o.createdAt)}
                      </small>
                    </td>
                    <td>
                      {o.customerName}
                      <small className="cell-subline">{o.customerPhone}</small>
                    </td>
                    <td>{o.productNameSnapshot}</td>
                    <td>{money(o.priceSnapshot)}</td>
                    <td>{o.status}</td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="text-link"
                          onClick={() => {
                            setSelected(o.id)
                            setActionError("")
                          }}
                        >
                          Gestionar
                        </button>
                        {o.status === "pendiente" && (
                          <button
                            disabled={busy}
                            className="text-link"
                            onClick={() => change(o.id, "confirmada")}
                          >
                            Confirmar y reservar
                          </button>
                        )}
                        {["pendiente", "confirmada"].includes(o.status) && (
                          <button
                            disabled={busy}
                            className="text-link"
                            onClick={() => {
                              if (confirm(`¿Cancelar ${o.folio}?`))
                                void change(o.id, "cancelada")
                            }}
                          >
                            Cancelar
                          </button>
                        )}
                        <a
                          className="text-link"
                          href={`https://wa.me/${o.customerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "52$1")}?text=${encodeURIComponent(`Hola ${o.customerName}, te contactamos sobre la solicitud ${o.folio}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              {data?.orders.length === 0 && (
                <tr>
                  <td colSpan={6}>Todavía no hay solicitudes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
      {order && (
        <section className="settings-card">
          <div className="admin-actions">
            <h2>{order.folio}</h2>
            <button className="text-link" onClick={() => setSelected(null)}>
              Cerrar detalle
            </button>
          </div>
          {["pendiente", "confirmada"].includes(order.status) && (
            <SaleForm
              key={`sale-${order.id}`}
              products={[]}
              order={order}
              onSaved={() => void refresh()}
            />
          )}
          {order.status !== "cancelada" && (
            <DeliveryForm
              key={`delivery-${order.id}-${order.delivery?.id || "new"}`}
              order={order}
              onSaved={() => void refresh()}
            />
          )}
          {order.sale && (
            <p>
              Venta confirmada: {money(order.sale.finalPrice)} ·{" "}
              {order.sale.paymentMethod}
            </p>
          )}
        </section>
      )}
    </div>
  )
}
