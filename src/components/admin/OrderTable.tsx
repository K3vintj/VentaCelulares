import type { Order } from "@/types/models"
import { formatDate as date, mxn as money } from "@/utils/format"

export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Cliente</th>
            <th>Equipo</th>
            <th>Fecha</th>
            <th>Referencia</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.folio}</td>
              <td>{o.customerName}</td>
              <td>{o.productNameSnapshot}</td>
              <td>{date(o.createdAt)}</td>
              <td>{money(o.priceSnapshot)}</td>
              <td>{o.status}</td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6}>Todavía no hay solicitudes.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
