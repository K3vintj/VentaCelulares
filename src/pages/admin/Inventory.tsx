import { Icon, PageTitle, StatusBadge } from "@/components/ui"
import { api } from "@/services/api"
import type { Product, Status } from "@/types/models"
import { useState } from "react"

export function Inventory({
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
