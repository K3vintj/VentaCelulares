import { useEffect, useId, useRef, useState } from "react"
import { Button, Icon } from "@/components/ui"
import { api } from "@/services/api"
import type { Product } from "@/types/models"

function PendingPhoto({ file, onRemove, disabled }: { file: File; onRemove: () => void; disabled: boolean }) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])
  return <div className="photo-pending">
    {url && <img src={url} alt={`Foto seleccionada: ${file.name}`} />}
    <p className="photo-file-name" title={file.name}>{file.name}</p>
    <div><span className="photo-pending-label">Pendiente de guardar</span><button type="button" className="text-link" disabled={disabled} onClick={onRemove} aria-label={`Quitar ${file.name}`}>Quitar</button></div>
  </div>
}

export function PhotoManager({
  product,
  onChanged,
  files,
  onFilesChange,
  disabled = false,
  onBusyChange,
}: {
  product?: Product
  onChanged: () => Promise<void>
  files: File[]
  onFilesChange: (files: File[]) => void
  disabled?: boolean
  onBusyChange: (busy: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const locked = disabled || busy
  const photos = (product?.photos || []).filter((photo) => photo.kind !== "reference")
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true)
    onBusyChange(true)
    setError("")
    try {
      await work()
      await onChanged()
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo actualizar la galería",
      )
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }
  return (
    <div className="photo-manager">
      <p id={hintId} className="form-section-copy">
        Agrega fotos tomadas por el cliente o por la tienda para mostrar el estado real del equipo.
        Complementan la imagen de biblioteca. JPEG, PNG o WebP · Máximo 5 MB por foto · Hasta 12 fotos reales.
        Las fotos nuevas se subirán al guardar el producto.
      </p>
      <div className="photo-upload-row">
        <Button type="button" variant="secondary" icon="plus" disabled={locked || photos.length + files.length >= 12} onClick={() => input.current?.click()}>Agregar fotos del equipo</Button>
        <span className="photo-counter">{photos.length + files.length} de 12 fotos reales</span>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        aria-label="Seleccionar fotos adicionales del equipo"
        aria-describedby={hintId}
        disabled={locked || photos.length + files.length >= 12}
        onChange={(e) => {
          const selected = Array.from(e.target.files || [])
          e.target.value = ""
          setError("")
          if (selected.length + photos.length + files.length > 12) { setError("Puedes agregar hasta 12 fotos reales por equipo."); return }
          const invalid = selected.find((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size === 0 || file.size > 5 * 1024 * 1024)
          if (invalid) { setError(`${invalid.name}: selecciona una imagen JPEG, PNG o WebP de hasta 5 MB.`); return }
          onFilesChange([...files, ...selected])
        }}
      />
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={photo.id}>
            <img src={photo.url} alt={`Foto ${index + 1} de ${product?.name || "la unidad"}`} />
            <div>
              <button
                type="button"
                className="text-link"
                disabled={locked || index === 0}
                onClick={() => {
                  const ids = photos.map((p) => p.id)
                  ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
                  if (product) void run(() => api.orderPhotos(product.id, ids))
                }}
              >
                Mover antes
              </button>
              <button
                className="text-link"
                disabled={locked}
                type="button"
                onClick={() => {
                  if (product && confirm("¿Eliminar esta fotografía?"))
                    void run(() => api.deletePhoto(product.id, photo.id))
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {files.map((file, index) => <PendingPhoto key={`${file.name}-${file.lastModified}-${index}`} file={file} disabled={locked} onRemove={() => onFilesChange(files.filter((_, i) => i !== index))} />)}
      </div>
      {files.length > 0 && <p className="request-note" role="status"><Icon name="info" size={16} /> {files.length} {files.length === 1 ? "foto se subirá" : "fotos se subirán"} al guardar.</p>}
      {busy && <p role="status">Actualizando fotografías…</p>}
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
