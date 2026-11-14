import { useCallback, useState } from "react"
import type { FormEvent } from "react"
import { Title, State } from "@/components/admin/AdminUi"
import { Field, Button } from "@/components/ui"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import type { AuditQuery } from "@/types/models"
import { formatDate } from "@/utils/format"

const actions: Record<string, string> = {
  create: "Alta de producto", update: "Edición", status: "Cambio de estado",
  archive: "Archivo de producto", upload_photo: "Fotografía agregada",
  reorder_photos: "Orden de fotografías", delete_photo: "Fotografía eliminada",
  reserve: "Reserva", release: "Liberación de reserva", sale: "Venta confirmada",
  delivery: "Entrega actualizada", change_password: "Cambio de contraseña",
  operator_password_recovery: "Recuperación de acceso", operator_update_email: "Cambio de correo administrativo",
}
const entities: Record<string, string> = { Product: "Producto", Order: "Solicitud", BusinessConfig: "Configuración", AdminUser: "Administrador" }
const emptyFilters = { action: "", entityType: "", entityId: "", from: "", to: "" }
export function AuditPage() {
  const [form, setForm] = useState(emptyFilters)
  const [query, setQuery] = useState<AuditQuery>({ page: 1, limit: 25 })
  const [validation, setValidation] = useState("")
  const load = useCallback(() => api.audit(query), [query])
  const { data, loading, error, reload } = useData(load)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (form.from && form.to && form.from > form.to) { setValidation("La fecha inicial debe ser anterior a la final"); return }
    setValidation(""); setQuery({ ...form, page: 1, limit: query.limit })
  }
  return <div className="admin-content page-enter">
    <Title title="Bitácora administrativa" text="Historial de cambios del negocio. Las fechas y horas corresponden a Ciudad de México." />
    <form className="settings-card audit-filters" onSubmit={submit}>
      <div className="audit-filter-grid">
        <Field label="Acción"><select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })}><option value="">Todas las acciones</option>{Object.entries(actions).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
        <Field label="Área"><select value={form.entityType} onChange={(e) => setForm({ ...form, entityType: e.target.value })}><option value="">Todas las áreas</option>{Object.entries(entities).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></Field>
        <Field label="Referencia exacta"><input maxLength={100} placeholder="Identificador del registro" value={form.entityId} onChange={(e) => setForm({ ...form, entityId: e.target.value })} /></Field>
        <Field label="Desde"><input type="date" value={form.from} max={form.to || undefined} onChange={(e) => setForm({ ...form, from: e.target.value })} /></Field>
        <Field label="Hasta"><input type="date" value={form.to} min={form.from || undefined} onChange={(e) => setForm({ ...form, to: e.target.value })} /></Field>
      </div>
      {validation && <p role="alert" className="form-banner-error">{validation}</p>}
      <div className="admin-actions"><Button type="submit" disabled={loading}>Aplicar filtros</Button><Button variant="secondary" disabled={loading} onClick={() => { setForm(emptyFilters); setValidation(""); setQuery({ page: 1, limit: 25 }) }}>Limpiar filtros</Button><Button variant="ghost" disabled={loading} onClick={() => void reload()}>Actualizar</Button></div>
    </form>
    <State loading={loading} error={error} retry={reload} />
    <article className="table-card" aria-busy={loading}>
      <div className="card-title"><div><h2>Movimientos registrados</h2><p aria-live="polite">{data ? `${data.total} movimientos encontrados` : "Historial protegido del negocio"}</p></div></div>
      <div className="table-scroll"><table className="audit-table"><thead><tr><th>Fecha y hora</th><th>Administrador</th><th>Acción</th><th>Área y referencia</th><th>Detalles</th></tr></thead><tbody>
        {data?.logs.map((log) => <tr key={log.id}><td>{formatDate(log.createdAt)}</td><td><strong>{log.admin.name}</strong><small className="cell-subline">{log.admin.email}</small></td><td>{actions[log.action] || log.action}</td><td>{entities[log.entityType] || log.entityType}<code className="cell-subline audit-reference">{log.entityId}</code></td><td>{log.details && Object.keys(Object(log.details)).length ? <details className="audit-details"><summary>Ver detalle</summary><pre>{JSON.stringify(log.details, null, 2)}</pre></details> : <span>Sin detalles adicionales</span>}</td></tr>)}
        {!loading && !error && data?.logs.length === 0 && <tr><td colSpan={5}>No hay movimientos que coincidan con estos filtros.</td></tr>}
      </tbody></table></div>
      {data && <div className="audit-pagination"><span>Página {data.page} de {data.pages}</span><div className="admin-actions"><Button variant="secondary" disabled={loading || data.page <= 1} onClick={() => setQuery({ ...query, page: data.page - 1 })}>Anterior</Button><Button variant="secondary" disabled={loading || data.page >= data.pages} onClick={() => setQuery({ ...query, page: data.page + 1 })}>Siguiente</Button></div></div>}
    </article>
  </div>
}
