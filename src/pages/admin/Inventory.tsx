import { Button, Icon, PageTitle, StatusBadge } from "@/components/ui"
import { ReservationDialog } from "@/components/admin/ReservationDialog"
import { api } from "@/services/api"
import type { Order, Product } from "@/types/models"
import { useState } from "react"
import { ProductImage } from "@/components/ProductImage"

export function Inventory({
  products,
  onChanged,
  onOpenOrder,
}: {
  products: Product[]
  onChanged: () => Promise<void>
  onOpenOrder: (order: Pick<Order, "id" | "folio">) => void
}) {
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [busy, setBusy] = useState(false)
  const [target, setTarget] = useState<Product | null>(null)
  const cancelReservation = async (product: Product) => {
    if (busy || !confirm(product.linkedOrder ? `¿Cancelar ${product.linkedOrder.folio} y liberar este equipo?` : "¿Liberar este equipo reservado sin pedido asociado?")) return
    setBusy(true)
    setError("")
    try {
      if (product.linkedOrder) await api.orderStatus(product.linkedOrder.id, "cancelada")
      else await api.productStatus(product.id, "Disponible", "Reservado")
      await onChanged()
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
        action={<Button variant="secondary" disabled={busy} onClick={() => void onChanged()}>Actualizar inventario</Button>}
      />
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <p className="inventory-note">
        Cada reserva queda vinculada a un cliente y un pedido. Registra la venta y da seguimiento a la entrega desde Pedidos.
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
      <article className="table-card inventory-table">
        <div className="card-title">
          <div>
            <h3>Unidades registradas</h3>
            <p>Reservas, clientes y seguimiento</p>
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
                <th>Pedido / acciones</th>
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
                        <ProductImage src={p.image} kind={p.imageKind} />
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
                      <div className="inventory-actions">
                        {p.linkedOrder && <><strong>{p.linkedOrder.folio}</strong><span>{p.linkedOrder.customerName}</span><Button variant="secondary" disabled={busy} onClick={() => onOpenOrder(p.linkedOrder!)}>Ver pedido</Button></>}
                        {p.status === "Disponible" && <Button variant="gold" disabled={busy} onClick={() => setTarget(p)}>Reservar equipo</Button>}
                        {p.status === "Reservado" && !p.linkedOrder && <><span className="inventory-warning">Reserva sin pedido asociado</span><Button variant="secondary" disabled={busy} onClick={() => setTarget(p)}>Completar reserva</Button></>}
                        {p.status === "Reservado" && <button className="text-link" type="button" disabled={busy} onClick={() => void cancelReservation(p)}>{p.linkedOrder ? "Cancelar reserva" : "Liberar equipo"}</button>}
                        {p.status === "Vendido" && !p.linkedOrder && <span>Venta sin pedido asociado</span>}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </article>
      {target && <ReservationDialog product={target} onClose={() => setTarget(null)} onSaved={(order) => { setTarget(null); onOpenOrder(order); void onChanged() }} />}
    </div>
  )
}
