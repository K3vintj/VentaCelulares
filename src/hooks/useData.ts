import { useCallback, useEffect, useRef, useState } from "react"

export function useData<T>(loader: () => Promise<T>) {
  const generation = useRef(0)
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    const current = ++generation.current
    setLoading(true)
    setError("")
    try {
      const result = await loader()
      if (current === generation.current) setData(result)
    } catch (e) {
      if (current === generation.current) setError(
        e instanceof Error ? e.message : "No se pudo cargar la información",
      )
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }, [loader])
  useEffect(() => {
    void reload()
    return () => { generation.current++ }
  }, [reload])
  return { data, error, loading, reload }
}
