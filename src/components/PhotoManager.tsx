import { useRef, useState } from "react"
import { api } from "@/services/api"
import type { Product } from "@/types/models"
export function PhotoManager({
  product,
  onChanged,
}: {
  product?: Product
  onChanged: () => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const run = async (work: () => Promise<unknown>) => {
    setBusy(true)
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
    }
  }
  if (!product)
    return (
      <p className="request-note">
        Guarda primero el borrador para agregar las fotos reales del equipo.
      </p>
    )
  const photos = product.photos || []
  return (
    <div className="photo-manager">
      <p>
        JPEG, PNG o WebP · Máximo 5 MB por foto · Hasta 12 fotos. La primera es
        la portada.
      </p>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={busy || photos.length >= 12}
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ""
          if (file) {
            if (file.size > 5 * 1024 * 1024) {
              setError("La foto supera 5 MB")
              return
            }
            void run(() => api.uploadPhoto(product.id, file))
          }
        }}
      />
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <div key={photo.id}>
            <img src={photo.url} alt={`Foto ${index + 1} de ${product.name}`} />
            <div>
              <button
                type="button"
                className="text-link"
                disabled={busy || index === 0}
                onClick={() => {
                  const ids = photos.map((p) => p.id)
                  ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
                  void run(() => api.orderPhotos(product.id, ids))
                }}
              >
                Mover antes
              </button>
              <button
                className="text-link"
                disabled={busy}
                type="button"
                onClick={() => {
                  if (confirm("¿Eliminar esta fotografía?"))
                    void run(() => api.deletePhoto(product.id, photo.id))
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
      {busy && <p role="status">Actualizando fotografías…</p>}
      {error && (
        <p className="form-banner-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
