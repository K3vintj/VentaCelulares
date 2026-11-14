import { PhotoManager } from "@/components/PhotoManager"
import { Button, ConditionBadge, Field, Icon, PageTitle, StatusBadge } from "@/components/ui"
import { commercialConfig } from "@/config/commercial"
import { api, ApiError } from "@/services/api"
import type { Product } from "@/types/models"
import type { ProductFormErrors, ProductFormValues } from "@/types/product-form"
import { mxn } from "@/utils/format"
import { buildEmptyProductForm, parseBatteryValue, productToForm } from "@/utils/product-form"
import { CONDITION_LABELS, createProductDefaults, DEVICE_CONDITIONS, normalizeCondition } from "@/utils/products"
import type { ChangeEvent, FormEvent } from "react"
import { useState } from "react"

export function ProductsAdmin({
  products,
  refresh,
}: {
  products: Product[]
  refresh: () => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormValues>(() =>
    buildEmptyProductForm(
      `VC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    ),
  )
  const [errors, setErrors] = useState<ProductFormErrors>({})
  const [toast, setToast] = useState("")
  const [toastTone, setToastTone] = useState<"ok" | "error">("ok")
  const isEditing = Boolean(editingId)
  const showToast = (message: string, tone: "ok" | "error" = "ok") => {
    setToastTone(tone)
    setToast(message)
    setTimeout(() => setToast(""), 2800)
  }
  const handleCloseModal = () => {
    setModal(false)
    setEditingId(null)
    setErrors({})
  }
  const handleOpenCreate = () => {
    setEditingId(null)
    setErrors({})
    setForm(
      buildEmptyProductForm(
        `VC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      ),
    )
    setModal(true)
  }
  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id)
    setErrors({})
    setForm(productToForm(product))
    setModal(true)
  }
  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target
    const checked =
      type === "checkbox" && "checked" in event.target
        ? (event.target as HTMLInputElement).checked
        : undefined
    setForm((current) => ({
      ...current,
      [name]: checked === undefined ? value : checked,
    }))
    setErrors((current) => {
      if (!current[(name as keyof ProductFormErrors)] && !current.form)
        return current
      const next = { ...current }
      delete next[(name as keyof ProductFormErrors)]
      delete next.form
      return next
    })
  }
  const validateForm = (publish: boolean) => {
    const nextErrors: ProductFormErrors = {}
    if (!form.name.trim()) nextErrors.name = "El modelo es obligatorio"
    if (!form.storage.trim())
      nextErrors.storage = "Selecciona el almacenamiento"
    if (!form.color.trim()) nextErrors.color = "El color es obligatorio"
    if (!/^[A-Z0-9-]{3,40}$/.test(form.id))
      nextErrors.id = "Usa de 3 a 40 letras mayúsculas, números o guiones"
    if (!form.screenCondition.trim())
      nextErrors.screenCondition = "Indica el estado de la pantalla"
    if (!form.cameraStatus.trim())
      nextErrors.cameraStatus = "Indica el funcionamiento de las cámaras"
    if (!form.battery.trim()) nextErrors.battery = "Indica la salud de batería"
    if (!form.condition) nextErrors.condition = "Selecciona la condición"
    if (!form.physicalCondition.trim())
      nextErrors.physicalCondition = "Indica el estado físico"
    if (!form.unlockStatus.trim())
      nextErrors.unlockStatus = "Indica el estado de liberación"
    if (!form.price.trim()) nextErrors.price = "El precio es obligatorio"
    else {
      const price = Number(form.price)
      if (!Number.isInteger(price) || price < 1)
        nextErrors.price = "Indica un precio entero mayor que cero"
    }
    const warranty = Number(form.warrantyDays)
    if (
      !form.warrantyDays.trim() ||
      !Number.isFinite(warranty) ||
      warranty <= 0
    )
      nextErrors.warrantyDays = "Indica los días de garantía (mínimo 1)"
    if (form.battery.trim()) {
      const battery = parseBatteryValue(form.battery)
      if (battery === null || Number.isNaN(battery))
        nextErrors.battery = "Salud de batería inválida"
      else if (battery < 0 || battery > 100)
        nextErrors.battery = "La batería debe estar entre 0 y 100"
    }
    if (publish) {
      if (!form.techInfoVerified)
        nextErrors.techInfoVerified =
          "Confirma la revisión técnica antes de publicar"
      if (!form.verifiedNotRefurbished)
        nextErrors.verifiedNotRefurbished =
          "Debes confirmar que no es reacondicionado"
      if (!form.verifiedNoReplacedParts)
        nextErrors.verifiedNoReplacedParts =
          "Debes confirmar que no tiene piezas reemplazadas"
      if (
        !form.verifiedNotRefurbished ||
        !form.verifiedNoReplacedParts ||
        !form.techInfoVerified
      )
        nextErrors.form =
          "No se puede publicar hasta completar las verificaciones comerciales obligatorias"
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }
  const buildProductFromForm = (publish: boolean): Product => {
    const batteryNumber = parseBatteryValue(form.battery)
    const batteryLabel =
      batteryNumber === null || Number.isNaN(batteryNumber)
        ? ""
        : `${Math.round(batteryNumber)}%`
    return {
      ...createProductDefaults(),
      id:
        form.id.trim() || `VC-${String(products.length + 1).padStart(3, "0")}`,
      name: form.name.trim(),
      storage: form.storage,
      color: form.color.trim(),
      battery: batteryLabel || "N/D",
      price: Number(form.price),
      status: form.status,
      condition: normalizeCondition(form.condition),
      conditionNote: form.conditionNote.trim() || undefined,
      warrantyDays: Number(form.warrantyDays),
      physicalCondition: form.physicalCondition.trim(),
      screenCondition: form.screenCondition.trim(),
      cameraStatus: form.cameraStatus.trim(),
      biometric: form.biometric,
      unlockStatus: form.unlockStatus.trim(),
      repairHistory: form.repairHistory.trim(),
      accessories: form.accessories.trim(),
      observations: form.observations.trim(),
      image: form.image,
      description:
        form.description.trim() ||
        `${form.name.trim()} · ${CONDITION_LABELS[normalizeCondition(form.condition)]}`,
      verifiedNotRefurbished: form.verifiedNotRefurbished,
      verifiedNoReplacedParts: form.verifiedNoReplacedParts,
      techInfoVerified: form.techInfoVerified,
      isPublished: publish,
    }
  }
  const handleSave = async (publish: boolean) => {
    if (saving || !validateForm(publish)) return
    setSaving(true)
    try {
      const nextProduct = buildProductFromForm(publish)
      const { product } = await api.saveProduct(nextProduct, isEditing)
      await refresh()
      if (!isEditing) {
        setEditingId(product.id)
        setForm(productToForm(product))
        showToast(
          "Borrador guardado. Agrega las fotografías antes de publicar.",
        )
      } else {
        showToast(publish ? "Producto publicado" : "Borrador guardado")
        handleCloseModal()
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el producto"
      const fields =
        error instanceof ApiError && error.fields
          ? Object.fromEntries(
              Object.entries(error.fields).map(([key, values]) => [
                key === "sku" ? "id" : key,
                values.join(". "),
              ]),
            )
          : {}
      setErrors({ ...fields, form: message })
      showToast(message, "error")
    } finally {
      setSaving(false)
    }
  }
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void handleSave(isEditing)
  }
  const remove = async (id: string) => {
    if (
      !confirm(
        "¿Archivar este producto y retirarlo del catálogo? Su historial se conserva.",
      )
    )
      return
    try {
      await api.archiveProduct(id)
      await refresh()
      showToast("Producto archivado")
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "No se pudo archivar",
        "error",
      )
    }
  }
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description={`${products.length} equipos registrados · ${products.filter((p) => p.isPublished).length} publicados`}
        action={
          <Button icon="plus" onClick={handleOpenCreate}>
            Agregar producto
          </Button>
        }
      />
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input
            placeholder="Buscar producto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <article className="table-card">
        <div className="table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                {[
                  "Producto",
                  "Capacidad",
                  "Condición",
                  "Garantía",
                  "Precio",
                  "Disponibilidad",
                  "Publicación",
                  "Acciones",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products
                .filter((p) =>
                  `${p.id} ${p.name} ${p.color}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="table-product">
                        <img src={p.image} alt="" />
                        <div>
                          <strong>{p.name}</strong>
                          <span>
                            {p.id} · {p.color}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{p.storage}</td>
                    <td>
                      <ConditionBadge
                        condition={normalizeCondition(p.condition)}
                      />
                    </td>
                    <td>{p.warrantyDays} días</td>
                    <td>
                      <strong>{mxn(p.price)}</strong>
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      <span
                        className={`publish-pill${
                          p.isPublished ? " is-live" : ""
                        }`}
                      >
                        {p.isPublished ? "Publicado" : "Borrador"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          title="Editar"
                          onClick={() => handleOpenEdit(p)}
                          aria-label={`Editar ${p.name}`}
                        >
                          <Icon name="edit" size={17} />
                        </button>
                        <button
                          title="Archivar"
                          onClick={() => remove(p.id)}
                          aria-label={`Archivar ${p.name}`}
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </article>
      {modal && (
        <div className="modal-backdrop" onMouseDown={handleCloseModal}>
          <div
            className="product-modal product-modal-wide"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">
                  {isEditing ? "Edición de unidad" : "Nuevo registro"}
                </span>
                <h2>{isEditing ? "Editar producto" : "Agregar producto"}</h2>
                <p>
                  Completa la información por unidad. Condición y disponibilidad
                  son independientes.
                </p>
              </div>
              <button
                className="modal-close"
                onClick={handleCloseModal}
                aria-label="Cerrar formulario"
              >
                <Icon name="close" />
              </button>
            </header>
            <form onSubmit={handleSubmit}>
              <p className="form-sim-note">
                Guarda el borrador, agrega las fotos de la unidad y completa las
                verificaciones antes de publicar.
              </p>
              {errors.form && (
                <div className="form-banner-error" role="alert">
                  <Icon name="info" size={16} />
                  <span>{errors.form}</span>
                </div>
              )}
              <section className="form-section">
                <h3>Información general</h3>
                <div className="form-grid">
                  <Field
                    label="Modelo"
                    name="name"
                    placeholder="Ej. iPhone 15 Pro"
                    required
                    value={form.name}
                    onChange={handleFieldChange}
                    error={errors.name}
                  />
                  <Field label="Almacenamiento" required error={errors.storage}>
                    <select
                      name="storage"
                      value={form.storage}
                      onChange={handleFieldChange}
                      required
                    >
                      <option>128 GB</option>
                      <option>256 GB</option>
                      <option>512 GB</option>
                      <option>1 TB</option>
                    </select>
                  </Field>
                  <Field
                    label="Color"
                    name="color"
                    placeholder="Ej. Titanio natural"
                    required
                    value={form.color}
                    onChange={handleFieldChange}
                    error={errors.color}
                  />
                  <Field
                    label="Código interno"
                    error={errors.id}
                    name="id"
                    value={form.id}
                    onChange={handleFieldChange}
                  >
                    <input
                      name="id"
                      value={form.id}
                      onChange={handleFieldChange}
                      readOnly={isEditing}
                    />
                  </Field>
                </div>
              </section>
              <section className="form-section">
                <h3>Condición y garantía</h3>
                <div className="form-grid">
                  <Field
                    label="Condición comercial"
                    required
                    error={errors.condition}
                  >
                    <select
                      name="condition"
                      value={form.condition}
                      onChange={handleFieldChange}
                      required
                    >
                      {DEVICE_CONDITIONS.map((item) => (
                        <option value={item} key={item}>
                          {CONDITION_LABELS[item]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Nota de condición (opcional)"
                    name="conditionNote"
                    placeholder="Ej. Excelente"
                    value={form.conditionNote}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Garantía comercial (días)"
                    name="warrantyDays"
                    type="number"
                    min={1}
                    required
                    value={form.warrantyDays}
                    onChange={handleFieldChange}
                    error={errors.warrantyDays}
                  />
                  <Field
                    label="Estado físico"
                    name="physicalCondition"
                    placeholder="Ej. Excelente"
                    required
                    value={form.physicalCondition}
                    onChange={handleFieldChange}
                    error={errors.physicalCondition}
                  />
                </div>
              </section>
              <section className="form-section">
                <h3>Información comercial</h3>
                <div className="form-grid">
                  <Field
                    label="Precio (MXN)"
                    name="price"
                    type="number"
                    min={0}
                    step="1"
                    placeholder="0"
                    required
                    value={form.price}
                    onChange={handleFieldChange}
                    error={errors.price}
                  />
                  <p>
                    Disponibilidad: {form.status}. Administra reservas desde
                    Inventario y ventas desde Pedidos o Ventas.
                  </p>
                </div>
              </section>
              <section className="form-section">
                <h3>Revisión técnica</h3>
                <div className="form-grid">
                  <Field
                    label="Estado de pantalla"
                    error={errors.screenCondition}
                    name="screenCondition"
                    placeholder="Ej. Original · Sin detalles"
                    value={form.screenCondition}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Funcionamiento de cámaras"
                    error={errors.cameraStatus}
                    name="cameraStatus"
                    placeholder="Ej. Funcionamiento correcto"
                    value={form.cameraStatus}
                    onChange={handleFieldChange}
                  />
                  <Field
                    label="Estado de liberación"
                    name="unlockStatus"
                    required
                    value={form.unlockStatus}
                    onChange={handleFieldChange}
                    error={errors.unlockStatus}
                  />
                  <Field
                    label="Accesorios incluidos"
                    name="accessories"
                    placeholder="Ej. Cable USB-C"
                    value={form.accessories}
                    onChange={handleFieldChange}
                  />
                </div>
                <Field
                  label="Historial conocido de reparaciones o piezas"
                  name="repairHistory"
                  value={form.repairHistory}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="repairHistory"
                    rows={3}
                    value={form.repairHistory}
                    onChange={handleFieldChange}
                    placeholder="Describe reparaciones conocidas o indica que no hay historial"
                  />
                </Field>
                <label className="check-row form-check">
                  <input
                    type="checkbox"
                    name="techInfoVerified"
                    checked={form.techInfoVerified}
                    onChange={handleFieldChange}
                  />
                  <span>
                    La información técnica de este equipo está verificada. Si no
                    se marca, se mostrará como no verificada en la ficha.
                  </span>
                </label>
              </section>
              <section className="form-section">
                <h3>Verificación comercial obligatoria</h3>
                <p className="form-section-copy">
                  {commercialConfig.policies.notRefurbishedText}{" "}
                  {commercialConfig.policies.noReplacedPartsText} Confirma ambas
                  condiciones por unidad antes de publicar.
                </p>
                <label
                  className={`check-row form-check${
                    errors.verifiedNotRefurbished ? " field-error" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="verifiedNotRefurbished"
                    checked={form.verifiedNotRefurbished}
                    onChange={handleFieldChange}
                  />
                  <span>Verificado: este equipo no es reacondicionado.</span>
                </label>
                {errors.verifiedNotRefurbished && (
                  <em className="field-error-msg">
                    {errors.verifiedNotRefurbished}
                  </em>
                )}
                <label
                  className={`check-row form-check${
                    errors.verifiedNoReplacedParts ? " field-error" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="verifiedNoReplacedParts"
                    checked={form.verifiedNoReplacedParts}
                    onChange={handleFieldChange}
                  />
                  <span>
                    Verificado: este equipo no tiene piezas reemplazadas.
                  </span>
                </label>
                {errors.verifiedNoReplacedParts && (
                  <em className="field-error-msg">
                    {errors.verifiedNoReplacedParts}
                  </em>
                )}
              </section>
              <section className="form-section">
                <h3>Descripción, observaciones y fotografía</h3>
                <Field
                  label="Descripción"
                  name="description"
                  value={form.description}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleFieldChange}
                    placeholder="Resumen comercial del equipo"
                  />
                </Field>
                <Field
                  label="Observaciones"
                  name="observations"
                  value={form.observations}
                  onChange={handleFieldChange}
                >
                  <textarea
                    name="observations"
                    rows={3}
                    value={form.observations}
                    onChange={handleFieldChange}
                    placeholder="Notas internas o para el cliente"
                  />
                </Field>
                <PhotoManager
                  product={products.find((p) => p.id === editingId)}
                  onChanged={refresh}
                />
              </section>
              <footer className="product-form-actions">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave(false)}
                >
                  Guardar borrador
                </Button>
                <Button type="submit" variant="gold" disabled={saving}>
                  {saving
                    ? "Guardando…"
                    : isEditing
                      ? "Guardar y publicar"
                      : "Crear borrador"}
                </Button>
              </footer>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast toast-${toastTone}`}>
          <Icon name={toastTone === "ok" ? "check" : "info"} />
          {toast}
        </div>
      )}
    </div>
  )
}
