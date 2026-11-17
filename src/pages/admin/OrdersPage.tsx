import { State, Title } from "@/components/admin/AdminUi";
import { DeliveryForm } from "@/components/admin/DeliveryForm";
import { SaleForm } from "@/components/admin/SaleForm";
import { Icon } from "@/components/ui";
import { useData } from "@/hooks/useData";
import { api } from "@/services/api";
import type { Order, Product } from "@/types/models";
import { formatDate as date, mxn as money } from "@/utils/format";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

const statusLabels = {
  pendiente: "Pendiente",
  confirmada: "Confirmado",
  completada: "Completado",
  cancelada: "Cancelado",
};
const deliveryLabels = {
  pendiente: "Por entregar",
  en_ruta: "En ruta",
  entregado: "Entregado",
  incidencia: "Incidencia",
};
function OrderTracking({ order }: { order: Order }) {
  const [page, setPage] = useState(1);
  const load = useCallback(
    () =>
      api.audit({ entityType: "Order", entityId: order.id, page, limit: 10 }),
    [order.id, page],
  );
  const { data, loading, error, reload } = useData(load);
  return (
    <section className="order-tracking">
      <h3>Seguimiento del pedido</h3>
      <p>Solicitud recibida · {date(order.createdAt)}</p>
      {order.sale && (
        <p>
          Venta registrada · {date(order.sale.soldAt)} ·{" "}
          {money(order.sale.finalPrice)}
        </p>
      )}
      <h4>Movimientos más recientes</h4>
      <State loading={loading} error={error} retry={reload} />
      <ol>
        {data?.logs.map((log) => {
          const details =
            log.details && typeof log.details === "object"
              ? (log.details as Record<string, unknown>)
              : {};
          const status =
            typeof details.to === "string"
              ? details.to
              : typeof details.status === "string"
                ? details.status
                : "";
          const label =
            statusLabels[status as keyof typeof statusLabels] ||
            deliveryLabels[status as keyof typeof deliveryLabels] ||
            status;
          return (
            <li key={log.id}>
              <strong>
                {log.action === "delivery"
                  ? "Entrega actualizada"
                  : log.action === "status"
                    ? "Estado del pedido actualizado"
                    : "Pedido actualizado"}
                {label ? ` · ${label}` : ""}
              </strong>
              <small>
                {date(log.createdAt)} · {log.admin.name}
              </small>
            </li>
          );
        })}
      </ol>
      {!loading && !error && data?.total === 0 && (
        <p>Todavía no hay cambios registrados.</p>
      )}
      {data && data.pages > 1 && (
        <nav className="orders-pagination" aria-label="Páginas del seguimiento">
          <button
            className="btn btn-secondary"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anteriores
          </button>
          <span>
            {page} / {data.pages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={loading || page >= data.pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguientes
          </button>
        </nav>
      )}
    </section>
  );
}
function OrderDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="product-modal order-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const controls = Array.from(
              ref.current?.querySelectorAll<HTMLElement>(
                "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
              ) || [],
            );
            const first = controls[0],
              last = controls[controls.length - 1];
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === ref.current)
            ) {
              e.preventDefault();
              last?.focus();
            } else if (
              !e.shiftKey &&
              (document.activeElement === last ||
                document.activeElement === ref.current)
            ) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <header>
          <div>
            <span className="eyebrow">Control de operaciones</span>
            <h2>{title}</h2>
          </div>
          <button
            className="modal-close"
            aria-label="Cerrar ventana"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </header>
        <div className="order-dialog-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
export function OrdersPage({
  products,
  onChanged,
  initialOrder,
}: {
  products: Product[];
  onChanged: () => Promise<void>;
  initialOrder?: Pick<Order, "id" | "folio"> | null;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialOrder?.folio || "");
  const [query, setQuery] = useState(initialOrder?.folio || "");
  const [filter, setFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activityVersion, setActivityVersion] = useState(0);
  useEffect(() => {
    if (query === search) return;
    const timer = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);
  const loadOrders = useCallback(
    () =>
      api.orders({
        page,
        q: search,
        status: filter,
        deliveryStatus: deliveryFilter,
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
      }),
    [page, search, filter, deliveryFilter, from, to],
  );
  const { data, loading, error, reload } = useData(loadOrders);
  const history = useData(api.sales);
  const [selected, setSelected] = useState<string | null>(initialOrder?.id || null);
  const [saleTarget, setSaleTarget] = useState<string | "direct" | null>(null);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const orders = data?.orders || [];
  const order = orders.find((o) => o.id === selected);
  const saleOrder = orders.find((o) => o.id === saleTarget);
  const visible = loading || error ? [] : orders;
  const hasFilters = Boolean(from || to || query || filter !== "all" || deliveryFilter !== "all");
  const tableRef = useRef<HTMLElement>(null);
  const goToPage = (next: number) => {
    setPage(next);
    tableRef.current?.scrollIntoView({ block: "start" });
  };
  const refresh = async () => {
    await Promise.all([reload(), history.reload(), onChanged()]);
    setActivityVersion((v) => v + 1);
  };
  const change = async (id: string, status: string) => {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await api.orderStatus(id, status);
      await refresh();
      setNotice(
        status === "cancelada"
          ? "Pedido cancelado. La reserva se liberó cuando correspondía."
          : "Pedido confirmado y equipo reservado.",
      );
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "No se pudo cambiar el estado",
      );
    } finally {
      setBusy(false);
    }
  };
  const saleSaved = () => {
    setSaleTarget(null);
    setNotice(
      "Venta registrada. El equipo ya figura como vendido y los indicadores se actualizaron.",
    );
    void refresh();
  };
  const available = products.filter(
    (p) => p.status === "Disponible" && !p.isArchived,
  );
  return (
    <div className="admin-content page-enter orders-page">
      <div className="orders-heading">
        <Title
          title="Pedidos y entregas"
          text="Cada solicitud, su venta y su entrega. Todo en un mismo lugar."
        />
        <button
          className="btn btn-gold"
          disabled={!available.length}
          onClick={() => setSaleTarget("direct")}
        >
          <Icon name="plus" />
          Venta sin pedido
        </button>
      </div>
      <div className="orders-metrics">
        <article>
          <span>Por atender</span>
          <strong>{data?.summary.pending ?? "—"}</strong>
          <small>Solicitudes pendientes</small>
        </article>
        <article>
          <span>Confirmados</span>
          <strong>{data?.summary.confirmed ?? "—"}</strong>
          <small>Equipos reservados</small>
        </article>
        <article>
          <span>Ventas registradas</span>
          <strong>{history.data?.sales.length ?? "—"}</strong>
          <small>Pagos confirmados</small>
        </article>
        <article>
          <span>Importe vendido</span>
          <strong>
            {history.data
              ? money(
                  history.data.sales.reduce((sum, s) => sum + s.finalPrice, 0),
                )
              : "—"}
          </strong>
          <small>Incluye ventas sin pedido</small>
        </article>
      </div>
      <State loading={loading} error={error} retry={reload} />
      {actionError && (
        <p className="form-banner-error" role="alert">
          {actionError}
        </p>
      )}
      {notice && (
        <p className="orders-notice" role="status">
          <Icon name="check" />
          {notice}
        </p>
      )}
      <article ref={tableRef} className="table-card orders-table-card">
        <div className="orders-toolbar" aria-busy={loading}>
          <label className="search-box">
            <Icon name="search" />
            <input
              aria-label="Buscar pedidos"
              placeholder="Buscar folio, cliente o equipo…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <label className="orders-filter">
            Pedido
            <select
              aria-label="Filtrar pedidos"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
                setSelected(null);
              }}
            >
              <option value="all">Todos los pedidos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmada">Confirmados / reservados</option>
              <option value="completada">Completados</option>
              <option value="cancelada">Cancelados</option>
              <option value="sold">Con venta registrada</option>
            </select>
          </label>
          <label className="orders-filter">
            Entrega
            <select aria-label="Filtrar por estado de entrega" value={deliveryFilter} onChange={(e) => { setDeliveryFilter(e.target.value); setPage(1); setSelected(null); }}>
              <option value="all">Todas las entregas</option>
              <option value="unscheduled">Sin programar</option>
              <option value="pendiente">Por entregar</option>
              <option value="en_ruta">En ruta</option>
              <option value="entregado">Entregados</option>
              <option value="incidencia">Con incidencia</option>
            </select>
          </label>
        </div>
        <div className="orders-date-filter">
          <label>
            Desde
            <input
              type="date"
              aria-label="Pedidos desde"
              value={from}
              max={to || undefined}
              onInput={(e) => {
                setFrom(e.currentTarget.value);
                setPage(1);
              }}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              aria-label="Pedidos hasta"
              value={to}
              min={from || undefined}
              onInput={(e) => {
                setTo(e.currentTarget.value);
                setPage(1);
              }}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <span>Fecha de solicitud · hora de México</span>
          {hasFilters && (
            <button
              className="text-link"
              onClick={() => {
                setFrom("");
                setTo("");
                setQuery("");
                setSearch("");
                setFilter("all");
                setDeliveryFilter("all");
                setPage(1);
                setSelected(null);
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pedido / cliente</th>
                <th>Equipo</th>
                <th>Estado del pedido</th>
                <th>Venta del celular</th>
                <th>Entrega</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((o) => {
                const soldElsewhere =
                  !o.sale && o.product?.status === "Vendido";
                const canSell =
                  !o.sale &&
                  !soldElsewhere &&
                  !o.product?.isArchived &&
                  ["pendiente", "confirmada"].includes(o.status);
                return (
                  <tr key={o.id}>
                    <td data-label="Pedido / cliente">
                      <strong className="order-folio">{o.folio}</strong>
                      <small className="cell-subline">
                        {date(o.createdAt)}
                      </small>
                      <span className="order-customer">{o.customerName}</span>
                      <small className="cell-subline">{o.customerPhone}</small>
                    </td>
                    <td data-label="Equipo">
                      <strong>{o.productNameSnapshot}</strong>
                      <small className="cell-subline">
                        Referencia · {money(o.priceSnapshot)}
                      </small>
                    </td>
                    <td data-label="Estado del pedido">
                      <span className={`order-pill order-${o.status}`}>
                        {statusLabels[o.status]}
                      </span>
                    </td>
                    <td data-label="Venta del celular">
                      {o.sale ? (
                        <>
                          <span className="order-pill order-sold">
                            <Icon name="check" />
                            Vendido
                          </span>
                          <small className="cell-subline">
                            {money(o.sale.finalPrice)} · {o.sale.paymentMethod}
                          </small>
                        </>
                      ) : soldElsewhere ? (
                        <>
                          <span className="order-pill order-sold">Vendido</span>
                          <small className="cell-subline">
                            En otra operación
                          </small>
                        </>
                      ) : (
                        <>
                          <span className="order-unsold">
                            Sin venta registrada
                          </span>
                          {canSell && (
                            <button
                              className="btn btn-gold order-sale-button"
                              disabled={busy}
                              onClick={() => setSaleTarget(o.id)}
                            >
                              Registrar venta
                            </button>
                          )}
                        </>
                      )}
                    </td>
                    <td data-label="Entrega">
                      <span
                        className={`order-pill order-delivery-${o.delivery?.status || "pending"}`}
                      >
                        {o.status === "cancelada"
                          ? "No aplica"
                          : o.delivery
                            ? deliveryLabels[o.delivery.status]
                            : "Sin programar"}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      <div className="order-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => setSelected(o.id)}
                        >
                          Ver pedido
                        </button>
                        {o.status === "pendiente" && !soldElsewhere && (
                          <button
                            disabled={busy}
                            className="text-link"
                            onClick={() => void change(o.id, "confirmada")}
                          >
                            Confirmar y reservar
                          </button>
                        )}
                        <a
                          className="text-link"
                          href={`https://wa.me/${o.customerPhone.replace(/\D/g, "").replace(/^(\d{10})$/, "52$1")}?text=${encodeURIComponent(`Hola ${o.customerName}, te contactamos sobre la solicitud ${o.folio}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          WhatsApp ↗
                        </a>
                        {["pendiente", "confirmada"].includes(o.status) && (
                          <button
                            disabled={busy}
                            className="order-cancel"
                            onClick={() => {
                              if (confirm(`¿Cancelar ${o.folio}?`))
                                void change(o.id, "cancelada");
                            }}
                          >
                            Cancelar pedido
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && !visible.length && (
                <tr>
                  <td colSpan={6} className="orders-empty">
                    <Icon name="orders" />
                    <h3>
                      {hasFilters
                        ? "No hay pedidos con estos filtros"
                        : "Todavía no hay pedidos"}
                    </h3>
                    <p>
                      {hasFilters
                        ? "Prueba otro filtro o término de búsqueda."
                        : "Las solicitudes de la tienda aparecerán aquí para darles seguimiento."}
                    </p>
                  </td>
                </tr>
              )}
              {loading && <tr><td colSpan={6} className="orders-empty" role="status">Actualizando pedidos…</td></tr>}
            </tbody>
          </table>
        </div>
      </article>
      <nav className="orders-pagination" aria-label="Páginas de pedidos">
        <span>
          {data?.total ?? 0} {data?.total === 1 ? "pedido" : "pedidos"} · Página{" "}
          {data?.page ?? page} de {data?.pages ?? 1}
        </span>
        <div>
          <button
            className="btn btn-secondary"
            disabled={loading || !data || data.page <= 1}
            onClick={() => goToPage((data?.page || 1) - 1)}
          >
            Anterior
          </button>
          <button
            className="btn btn-secondary"
            disabled={loading || !data || data.page >= data.pages}
            onClick={() => goToPage((data?.page || 1) + 1)}
          >
            Siguiente
          </button>
        </div>
      </nav>
      <details className="orders-history">
        <summary>
          Historial de ventas{" "}
          <span>{history.data?.sales.length ?? "—"} operaciones</span>
        </summary>
        <State
          loading={history.loading}
          error={history.error}
          retry={history.reload}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Equipo</th>
                <th>Pedido</th>
                <th>Importe final</th>
                <th>Pago recibido</th>
              </tr>
            </thead>
            <tbody>
              {history.data?.sales.map((s) => (
                <tr key={s.id}>
                  <td>{date(s.soldAt)}</td>
                  <td>
                    {s.product?.name} · {s.product?.sku}
                  </td>
                  <td>{s.order?.folio || "Venta sin pedido"}</td>
                  <td>{money(s.finalPrice)}</td>
                  <td>{s.paymentMethod}</td>
                </tr>
              ))}
              {history.data?.sales.length === 0 && (
                <tr>
                  <td colSpan={5}>Todavía no hay ventas registradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </details>
      {order && (
        <OrderDialog title={order.folio} onClose={() => setSelected(null)}>
          <div className="order-detail-summary">
            <strong>{order.customerName}</strong>
            <p>{order.productNameSnapshot}</p>
            <span className={`order-pill order-${order.status}`}>
              {statusLabels[order.status]}
            </span>
            {order.sale && (
              <p>
                Vendido · {money(order.sale.finalPrice)} ·{" "}
                {order.sale.paymentMethod}
              </p>
            )}
          </div>
          {order.status === "confirmada" && !order.sale && order.product?.status !== "Vendido" && (
            <div className="order-detail-actions">
              <button className="btn btn-gold" disabled={busy} onClick={() => { setSelected(null); setSaleTarget(order.id); }}>Registrar venta</button>
              <button className="btn btn-secondary" disabled={busy} onClick={() => { if (confirm(`¿Cancelar ${order.folio} y liberar el equipo?`)) void change(order.id, "cancelada"); }}>Cancelar reserva</button>
            </div>
          )}
          <OrderTracking key={`${order.id}-${activityVersion}`} order={order} />
          {order.status !== "cancelada" ? (
            <DeliveryForm
              key={`delivery-${order.id}-${order.delivery?.id || "new"}`}
              order={order}
              onSaved={() => {
                void refresh();
                setNotice("Entrega actualizada.");
              }}
            />
          ) : (
            <p>Este pedido está cancelado.</p>
          )}
        </OrderDialog>
      )}
      {saleTarget && (saleOrder || saleTarget === "direct") && (
        <OrderDialog
          title={saleOrder ? "Registrar venta del pedido" : "Venta sin pedido"}
          onClose={() => setSaleTarget(null)}
        >
          <SaleForm
            key={saleTarget}
            products={available}
            order={saleOrder}
            onCancel={() => setSaleTarget(null)}
            onSaved={saleSaved}
          />
        </OrderDialog>
      )}
    </div>
  );
}
