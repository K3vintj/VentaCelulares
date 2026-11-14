import { commercialConfig } from "@/config/commercial"

export function Logo({
  compact = false,
  onClick,
}: {
  compact?: boolean
  onClick?: () => void
}) {
  const content = (
    <>
      <img src={commercialConfig.logoSrc} alt="" className="logo-img" />
      {!compact && (
        <span className="logo-text">
          Alexx<span className="logo-accent">ziño</span>{" "}
          <span className="muted">Store</span>
        </span>
      )}
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        className={`logo logo-button${compact ? " logo-compact" : ""}`}
        onClick={onClick}
        aria-label={`Ir al catálogo de ${commercialConfig.businessName}`}
      >
        {content}
      </button>
    )
  }
  return (
    <div className={`logo${compact ? " logo-compact" : ""}`}>{content}</div>
  )
}
