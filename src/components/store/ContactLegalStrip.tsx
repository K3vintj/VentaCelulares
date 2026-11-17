import { LegalLink } from "@/components/legal/LegalLink"
import {
  commercialConfig,
  getWarrantyLabel,
} from "@/config/commercial"

export function ContactLegalStrip({
  onOpenNotices,
}: {
  onOpenNotices: () => void
}) {
  const commercialFacts = [
    commercialConfig.policies.unlockedTitle,
    commercialConfig.policies.notRefurbishedTitle,
    commercialConfig.policies.noReplacedPartsTitle,
  ]

  return (
    <section
      className="contact-strip contact-strip--legal"
      aria-labelledby="contact-legal-title"
    >
      <div className="contact-strip-legal-head">
        <h2 id="contact-legal-title" className="footer-heading">
          Información legal y comercial
        </h2>
        <button
          type="button"
          className="contact-strip-notices-link"
          onClick={onOpenNotices}
        >
          <span>Ver avisos completos</span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
      <ul className="footer-legal-list contact-strip-legal-list">
        {commercialConfig.legal.map((item) => {
          if (item.internal === "privacy" || item.internal === "cookies") {
            return (
              <li key={item.label}>
                <LegalLink
                  document={item.internal}
                  className="footer-legal-link"
                />
              </li>
            )
          }
          if (item.href) {
            return (
              <li key={item.label}>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-legal-link"
                >
                  {item.label}
                </a>
              </li>
            )
          }
          if (item.internal === "notices") {
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className="footer-legal-link"
                  onClick={onOpenNotices}
                  aria-label={`${item.label}: garantía comercial de ${getWarrantyLabel()}`}
                >
                  <span>{item.label}</span>
                  <small className="footer-available">
                    {item.badge || getWarrantyLabel()}
                  </small>
                </button>
              </li>
            )
          }
          return (
            <li key={item.label}>
              <span
                className="footer-pending-link"
                title="Configuración pendiente"
              >
                {item.label}
                <small>Pendiente</small>
              </span>
            </li>
          )
        })}
        {commercialFacts.map((label) => (
          <li key={label}>
            <span className="contact-strip-fact">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
