export type AsyncStatus = "idle" | "loading" | "success" | "error"

export type AsyncResource<T> = {
  status: AsyncStatus
  data: T | null
  error: string | null
  /** Carga inicial sin datos previos: sí mostrar skeleton. */
  isInitialLoading: boolean
  /** Refresco en segundo plano con datos visibles: no reemplazar por skeleton. */
  isRefreshing: boolean
  refetch: () => void
}

export const createSuccessResource = <T>(
  data: T,
  refetch: () => void = () => undefined,
): AsyncResource<T> => ({
  status: "success",
  data,
  error: null,
  isInitialLoading: false,
  isRefreshing: false,
  refetch,
})

export const createLoadingResource = <T>(
  previous: T | null = null,
): AsyncResource<T> => ({
  status: "loading",
  data: previous,
  error: null,
  isInitialLoading: previous === null,
  isRefreshing: previous !== null,
  refetch: () => undefined,
})

export const createErrorResource = <T>(
  error: string,
  previous: T | null = null,
  refetch: () => void = () => undefined,
): AsyncResource<T> => ({
  status: "error",
  data: previous,
  error,
  isInitialLoading: false,
  isRefreshing: false,
  refetch,
})
