import { useState } from "react"
import { Field } from "@/components/ui"
import { ProductImage } from "@/components/ProductImage"
import { useData } from "@/hooks/useData"
import { api } from "@/services/api"
import type { LibraryModel } from "@/types/models"
import type { ProductFormErrors, ProductFormValues } from "@/types/product-form"

export function ReferenceSelector({ form, errors, onChange }: {
  form: ProductFormValues
  errors: ProductFormErrors
  onChange: (patch: Partial<ProductFormValues>) => void
}) {
  const { data, loading, error, reload } = useData(api.productLibrary)
  const models = data?.models || []
  const [useLibrary, setUseLibrary] = useState(Boolean(form.referenceVariantId) || !form.name)
  const model = models.find((item) => item.id === form.referenceVariantId?.split("/")[0])
  const color = model?.colors.find((item) => item.id === form.referenceVariantId?.split("/")[1])
  const selectModel = (selected: LibraryModel) => {
    const selectedColor = selected.colors.find((item) => item.name === form.color) || selected.colors[0]!
    onChange({ name: selected.name, color: selectedColor.name, referenceVariantId: `${selected.id}/${selectedColor.id}`, storage: selected.storage.includes(form.storage) ? form.storage : selected.storage[0]! })
  }
  const toggleLibrary = (enabled: boolean) => {
    setUseLibrary(enabled)
    if (!enabled) onChange({ referenceVariantId: null })
    else {
      const matching = models.find((item) => item.name.toLowerCase() === form.name.toLowerCase() && item.available)
      if (matching) selectModel(matching)
      else onChange({ referenceVariantId: null, name: "", color: "" })
    }
  }
  return (
    <div className="reference-selector">
      <fieldset className="reference-mode">
        <legend>Fotografía del producto</legend>
        <label><input type="radio" name="photo-source" checked={useLibrary} onChange={() => toggleLibrary(true)} /> Biblioteca por modelo y color</label>
        <label><input type="radio" name="photo-source" checked={!useLibrary} onChange={() => toggleLibrary(false)} /> Fotos propias / otro modelo</label>
      </fieldset>
      {useLibrary && loading && <p role="status">Cargando modelos y colores verificados…</p>}
      {useLibrary && error && <p className="form-banner-error" role="alert">{error} <button className="text-link" type="button" onClick={() => void reload()}>Reintentar biblioteca</button></p>}
      <div className="form-grid">
        <Field label="Modelo" required error={errors.name}>
          {useLibrary ? (
            <select required value={model?.id || ""} onChange={(event) => {
              const selected = models.find((item) => item.id === event.target.value)
              if (selected) selectModel(selected)
            }}>
              <option value="">Selecciona un modelo</option>
              {[12, 13, 14, 15, 16, 17, 18].map((generation) => <optgroup key={generation} label={`Generación ${generation}`}>
                {models.filter((item) => item.generation === generation).map((item) => <option key={item.id} value={item.id} disabled={!item.available}>{item.name}{!item.available ? " · Imagen no disponible" : ""}</option>)}
              </optgroup>)}
            </select>
          ) : <input required name="name" value={form.name} onChange={(event) => onChange({ name: event.target.value })} />}
        </Field>
        <Field label="Color" required error={errors.color}>
          {useLibrary ? <select required disabled={!model} value={color?.id || ""} onChange={(event) => {
            const selected = model?.colors.find((item) => item.id === event.target.value)
            if (model && selected) onChange({ color: selected.name, referenceVariantId: `${model.id}/${selected.id}` })
          }}>
            <option value="">Selecciona un color</option>
            {model?.colors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select> : <input required name="color" value={form.color} onChange={(event) => onChange({ color: event.target.value })} />}
        </Field>
        <Field label="Almacenamiento" required error={errors.storage}>
          <select required value={form.storage} onChange={(event) => onChange({ storage: event.target.value })}>
            {(useLibrary && model ? model.storage : ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB"]).map((value) => <option key={value}>{value}</option>)}
          </select>
        </Field>
      </div>
      {useLibrary && model && color && (
        <div className="reference-preview">
          <ProductImage src={color.imageUrl} kind="reference" alt={`${model.name}, ${color.name}`} loading="eager" />
          <div>
            <span className="eyebrow">Imagen preestablecida</span>
            <h4>{model.name}</h4>
            <p className="reference-color"><i style={{ backgroundColor: color.hex }} />{color.name}</p>
            <p>{model.cameraLayout} · {model.displayInches} pulgadas</p>
            <p>{model.material}</p>
            <small>Se reutiliza esta imagen sin subir archivos. Las fotos reales de la unidad se pueden agregar como complemento.</small>
          </div>
        </div>
      )}
      {errors.referenceVariantId && <p className="field-error-msg" role="alert">{errors.referenceVariantId}</p>}
    </div>
  )
}
