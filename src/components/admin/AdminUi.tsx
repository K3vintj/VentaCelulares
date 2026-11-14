export function Title({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-page-title">
      <div>
        <span className="eyebrow">Administración</span>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  )
}
export function State({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string
  retry: () => void
}) {
  return (
    <>
      {loading && <p role="status">Cargando…</p>}
      {error && (
        <div className="form-banner-error" role="alert">
          {error}{" "}
          <button className="text-link" onClick={retry}>
            Reintentar
          </button>
        </div>
      )}
    </>
  )
}
