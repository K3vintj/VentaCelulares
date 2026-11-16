/** Shared library images retain their original proportions and finish colors. */
export function ProductImage({ src, alt = "", className = "", loading = "lazy", kind }: {
  src: string
  alt?: string
  className?: string
  loading?: "lazy" | "eager"
  kind?: "reference" | "unit"
}) {
  return (
    <span className={`product-media ${kind === "reference" ? "is-reference" : ""} ${className}`} role={alt ? "img" : undefined} aria-label={alt || undefined}>
      <img src={src} alt="" loading={loading} decoding="async" />
    </span>
  )
}
