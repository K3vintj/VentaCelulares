import { useCallback, useEffect, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { api } from "@/services/api"
import type { BusinessConfig, Delivery, Order, Product } from "@/types/models"
const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n)
const date = (s: string) => new Date(s).toLocaleString("es-MX")
function useData<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData(await loader())
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cargar la información",
      )
    } finally {
      setLoading(false)
    }
  }, [loader])
  useEffect(() => {
    void reload()
  }, [reload])
  return { data, error, loading, reload }
}
function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-page-title">
      <div>
        <span className="eyebrow">Administración</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  )
}
function State({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => void
}) {
  return (
    <>
      {loading && <p role="status">Cargando…</p>}
      {error && (
        <div className="form-banner-error" role="alert">
          {error}{" "}
          <button className="text-link" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}
    </>
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}
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
function OrderTable({ orders }: { orders: Order[] }) {
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
function SaleForm({
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
function DeliveryForm({
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
export function ConfigPage({
  notices,
  onChanged,
}: {
  notices: boolean
  onChanged: (config: BusinessConfig) => void
}) {
  const { data, error, loading, reload } = useData(api.config)
  const [config, setConfig] = useState<BusinessConfig | null>(null),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false)
  useEffect(() => {
    if (data) setConfig(data.config)
  }, [data])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!config || busy) return
    setBusy(true)
    setMessage("")
    try {
      const result = await api.saveConfig(config)
      onChanged(result.config)
      setMessage("Cambios guardados")
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="admin-content page-enter">
      <Title
        title={notices ? "Avisos comerciales" : "Configuración del negocio"}
        text="Los cambios se guardan en el servidor y se muestran en la tienda."
      />
      <State loading={loading} error={error} retry={reload} />
      {config && (
        <form className="settings-card" onSubmit={submit}>
          {!notices ? (
            <div className="form-grid">
              <Field label="Nombre del negocio">
                <input
                  required
                  value={config.businessName}
                  onChange={(e) =>
                    setConfig({ ...config, businessName: e.target.value })
                  }
                />
              </Field>
              <Field label="WhatsApp con código de país">
                <input
                  required
                  pattern="[0-9]{10,15}"
                  value={config.whatsapp}
                  onChange={(e) =>
                    setConfig({ ...config, whatsapp: e.target.value })
                  }
                />
              </Field>
              <Field label="Días de garantía">
                <input
                  required
                  type="number"
                  min={1}
                  max={3650}
                  value={config.warrantyDays}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      warrantyDays: Number(e.target.value),
                    })
                  }
                />
              </Field>
            </div>
          ) : (
            <>
              {config.noticesJson.map((notice, i) => (
                <section className="form-section" key={notice.id}>
                  <Field label="Título">
                    <input
                      required
                      maxLength={180}
                      value={notice.title}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          noticesJson: config.noticesJson.map((n, j) =>
                            j === i ? { ...n, title: e.target.value } : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="Texto del aviso">
                    <textarea
                      required
                      maxLength={2000}
                      value={notice.text}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          noticesJson: config.noticesJson.map((n, j) =>
                            j === i ? { ...n, text: e.target.value } : n,
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    className="text-link"
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        noticesJson: config.noticesJson.filter(
                          (_, j) => j !== i,
                        ),
                      })
                    }
                  >
                    Eliminar aviso
                  </button>
                </section>
              ))}
              <button
                className="btn btn-secondary"
                disabled={config.noticesJson.length >= 12}
                type="button"
                onClick={() =>
                  setConfig({
                    ...config,
                    noticesJson: [
                      ...config.noticesJson,
                      {
                        id: crypto.randomUUID(),
                        title: "",
                        text: "",
                        icon: "info",
                        featured: config.noticesJson.length === 0,
                        positive: true,
                      },
                    ],
                  })
                }
              >
                Agregar aviso
              </button>
            </>
          )}
          {message && <p role="status">{message}</p>}
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      )}
      {!notices && <PasswordForm />}
    </div>
  )
}

function PasswordForm() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const password = String(form.get("newPassword"))
    if (password !== form.get("confirmPassword")) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }
    setBusy(true)
    setError("")
    try {
      await api.changePassword(String(form.get("currentPassword")), password)
      window.dispatchEvent(new Event("vc:unauthorized"))
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo cambiar la contraseña",
      )
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="settings-card" onSubmit={submit}>
      <h2>Cambiar contraseña</h2>
      <p>
        Al guardar se cerrarán todas las sesiones. Vuelve a ingresar con tu
        contraseña nueva.
      </p>
      <div className="form-grid">
        <Field label="Contraseña actual">
          <input
            type="password"
            autoComplete="current-password"
            name="currentPassword"
            required
            maxLength={256}
          />
        </Field>
        <Field label="Nueva contraseña (mínimo 14 caracteres)">
          <input
            type="password"
            autoComplete="new-password"
            name="newPassword"
            required
            minLength={14}
            maxLength={256}
          />
        </Field>
        <Field label="Confirmar nueva contraseña">
          <input
            type="password"
            autoComplete="new-password"
            name="confirmPassword"
            required
            minLength={14}
            maxLength={256}
          />
        </Field>
      </div>
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Guardando…" : "Cambiar contraseña y salir"}
      </button>
    </form>
  )
}
