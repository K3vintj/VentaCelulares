import { ReactNode } from "react"

type AsyncRegionProps = {
  busy: boolean
  label?: string
  className?: string
  children: ReactNode
}

/** Región con aria-busy y anuncio accesible durante la carga. */
export const AsyncRegion = ({
  busy,
  label = "Cargando contenido",
  className = "",
  children,
}: AsyncRegionProps) => (
  <div
    className={className}
    aria-busy={busy}
    aria-live={busy ? "polite" : undefined}
  >
    {busy && <span className="sr-only">{label}</span>}
    {children}
  </div>
)

export default AsyncRegion
