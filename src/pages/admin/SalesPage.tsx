import { State, Title } from "@/components/admin/AdminUi"
import { SaleForm } from "@/components/admin/SaleForm"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import type { Product } from "@/types/models"
import { formatDate as date, mxn as money } from "@/utils/format"
import { useState } from "react"

export function SalesPage({
  products,
  onChanged,
}: {
  products: Product[]
  onChanged: () => Promise<void>
}) {
  const { data, loading, error, reload } = useData(api.sales)
  const [create, setCreate] = useState(false)
  const total = data?.sales.reduce((sum, s) => sum + s.finalPrice, 0) || 0
  return (
    <div className="admin-content page-enter">
      <Title
        title="Ventas"
        text="Pagos confirmados fuera de la plataforma. Las solicitudes pendientes no son ingresos."
      />
      <State loading={loading} error={error} retry={reload} />
      <div className="stat-grid compact">
        <article className="stat-card">
          <span>Ingresos registrados</span>
          <strong>{money(total)}</strong>
        </article>
        <article className="stat-card">
          <span>Ventas confirmadas</span>
          <strong>{data?.sales.length || 0}</strong>
        </article>
      </div>
      <button className="btn btn-gold" onClick={() => setCreate(!create)}>
        Registrar venta directa
      </button>
      {create && (
        <SaleForm
          products={products.filter((p) => p.status !== "Vendido")}
          onCancel={() => setCreate(false)}
          onSaved={() => {
            setCreate(false)
            void reload()
            void onChanged()
          }}
        />
      )}
      <article className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Equipo</th>
                <th>Solicitud</th>
                <th>Importe final</th>
                <th>Pago externo</th>
              </tr>
            </thead>
            <tbody>
              {data?.sales.map((s) => (
                <tr key={s.id}>
                  <td>{date(s.soldAt)}</td>
                  <td>
                    {s.product?.name} · {s.product?.sku}
                  </td>
                  <td>{s.order?.folio || "Venta directa"}</td>
                  <td>{money(s.finalPrice)}</td>
                  <td>{s.paymentMethod}</td>
                </tr>
              ))}
              {data?.sales.length === 0 && (
                <tr>
                  <td colSpan={5}>Todavía no hay ventas confirmadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}
