import { CSSProperties, HTMLAttributes } from "react"

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number
  height?: string | number
  radius?: string | number
  circle?: boolean
  className?: string
}

const toCssSize = (value?: string | number) => {
  if (value === undefined) return undefined
  return typeof value === "number" ? `${value}px` : value
}

/**
 * Bloque decorativo de carga. No interactivo, oculto a lectores de pantalla
 * cuando se usa dentro de una región con aria-busy + sr-only "Cargando…".
 */
export const Skeleton = ({
  width,
  height,
  radius,
  circle = false,
  className = "",
  style,
  ...rest
}: SkeletonProps) => {
  const mergedStyle: CSSProperties = {
    width: toCssSize(width),
    height: toCssSize(height),
    borderRadius: circle ? "9999px" : toCssSize(radius),
    ...style,
  }

  return (
    <div
      className={`ui-skeleton${circle ? " ui-skeleton-circle" : ""}${className ? ` ${className}` : ""}`}
      style={mergedStyle}
      aria-hidden="true"
      tabIndex={-1}
      {...rest}
    />
  )
}

export default Skeleton
