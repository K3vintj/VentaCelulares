import { State, Title } from "@/components/admin/AdminUi"
import { OrderTable } from "@/components/admin/OrderTable"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import { mxn as money } from "@/utils/format"

export function Dashboard() {
  const { data, error, loading, reload } = useData(api.dashboard)
  return (
    <div className="admin-content page-enter">
      <Title
        title="Panel de administración"
        text="Indicadores calculados a partir de ventas e inventario registrados."
      />
      <State loading={loading} error={error} retry={reload} />
      {data && (
        <>
          <div className="stat-grid">
            {[
              ["Ventas registradas", data.salesCount],
              ["Ingresos del mes", money(data.monthRevenue)],
              ["iPhones disponibles", data.inventory.available],
              ["Pedidos pendientes", data.pendingOrders],
            ].map(([label, value]) => (
              <article className="stat-card" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>
          <div className="analytics-grid">
            <article className="chart-card sales-chart">
              <div className="card-title">
                <div>
                  <h3>Evolución de ventas</h3>
                  <p>Últimos seis meses · Ventas confirmadas</p>
                </div>
              </div>
              <div className="chart-total">
                <strong>
                  {money(data.months.reduce((sum, m) => sum + m.revenue, 0))}
                </strong>
              </div>
              <div className="bars">
                {data.months.map((m, i) => (
                  <div key={i}>
                    <i
                      title={money(m.revenue)}
                      style={{
                        minHeight: 0,
                        height: `${(m.revenue / Math.max(1, ...data.months.map((m) => m.revenue))) * 100}%`,
                      }}
                    />
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </article>
            <article className="chart-card inventory-chart">
              <h3>Estado del inventario</h3>
              <div className="legend">
                <p>
                  Disponibles <strong>{data.inventory.available}</strong>
                </p>
                <p>
                  Reservados <strong>{data.inventory.reserved}</strong>
                </p>
                <p>
                  Vendidos <strong>{data.inventory.sold}</strong>
                </p>
                <p>
                  Archivados <strong>{data.inventory.archived}</strong>
                </p>
                <p>
                  Unidades registradas <strong>{data.inventory.total}</strong>
                </p>
              </div>
              <p>Ingresos acumulados: {money(data.revenue)}</p>
            </article>
          </div>
          <article className="table-card">
            <div className="card-title">
              <h3>Solicitudes recientes</h3>
            </div>
            <OrderTable orders={data.recentOrders} />
          </article>
        </>
      )}
    </div>
  )
}
