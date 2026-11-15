import { ReactNode } from "react"
import { AsyncResource } from "@/lib/async-state"
import { AsyncRegion } from "@/components/ui/AsyncRegion"

type QueryStateProps<T> = {
  resource: AsyncResource<T>
  skeleton: ReactNode
  empty?: ReactNode
  isEmpty?: (data: T) => boolean
  errorTitle?: string
  errorFallback?: string
  className?: string
  children: (data: T) => ReactNode
}

export const ErrorState = ({
  title = "No se pudo cargar la información",
  description,
  onRetry,
}: {
  title?: string
  description: string
  onRetry?: () => void
}) => (
  <div className="async-state async-state-error" role="alert">
    <h3>{title}</h3>
    <p>{description}</p>
    {onRetry && (
      <button
        type="button"
        className="btn btn-secondary"
        onClick={onRetry}
        aria-label="Reintentar carga"
      >
        Reintentar
      </button>
    )}
  </div>
)

export const EmptyState = ({
  title,
  description,
  icon,
}: {
  title: string
  description: string
  icon?: ReactNode
}) => (
  <div className="empty-state async-state-empty">
    {icon}
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)

/**
 * Orquesta loading / error / empty / success.
 * Conserva datos visibles en refrescos (isRefreshing).
 * En error sin datos previos muestra ErrorState (nunca skeleton infinito).
 */
export const QueryState = <T,>({
  resource,
  skeleton,
  empty,
  isEmpty,
  errorTitle,
  errorFallback = "Ocurrió un problema al consultar los datos. Intenta de nuevo.",
  className = "",
  children,
}: QueryStateProps<T>) => {
  const showSkeleton = resource.isInitialLoading
  const showError = resource.status === "error" && !resource.data
  const showEmpty =
    resource.status === "success" &&
    resource.data !== null &&
    isEmpty?.(resource.data) === true

  return (
    <AsyncRegion
      busy={showSkeleton || resource.isRefreshing}
      className={className}
      label="Cargando contenido"
    >
      {showSkeleton && skeleton}
      {showError && (
        <ErrorState
          title={errorTitle}
          description={resource.error || errorFallback}
          onRetry={resource.refetch}
        />
      )}
      {showEmpty && empty}
      {resource.data !== null &&
        !showSkeleton &&
        !showEmpty &&
        children(resource.data)}
    </AsyncRegion>
  )
}

export default QueryState
