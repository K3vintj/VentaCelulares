import { useCallback, useMemo } from "react"
import {
  AsyncResource,
  createLoadingResource,
  createSuccessResource,
} from "@/lib/async-state"

type UseLocalResourceOptions<T> = {
  /** Datos locales actuales. Cuando exista Supabase, sustituir por fetch. */
  data: T
  /**
   * Si es false, el recurso queda en loading inicial (sin datos).
   * Usar solo cuando exista una consulta async real pendiente.
   */
  enabled?: boolean
}

/** Vista previa de skeletons: añade `?skeletons` a la URL (sin setTimeout). */
const isSkeletonPreview = () => {
  if (typeof window === "undefined") return false
  return new URLSearchParams(window.location.search).has("skeletons")
}

/**
 * Recurso async listo para Supabase.
 * Hoy resuelve en success de inmediato (datos en memoria).
 * No usa setTimeout ni simula latencia.
 *
 * Al conectar Supabase: pasar `enabled` según el fetch y mapear
 * loading / error / success a createLoadingResource / createErrorResource /
 * createSuccessResource desde `@/lib/async-state`.
 *
 * Preview: abrir la app con `?skeletons` para forzar el estado loading.
 */
export const useLocalResource = <T>({
  data,
  enabled = true,
}: UseLocalResourceOptions<T>): AsyncResource<T> => {
  const refetch = useCallback(() => {
    /* Placeholder: con Supabase invalidar/refetch la query real. */
  }, [])

  return useMemo(() => {
    if (!enabled || isSkeletonPreview()) {
      return createLoadingResource<T>(null)
    }
    return createSuccessResource(data, refetch)
  }, [data, enabled, refetch])
}
