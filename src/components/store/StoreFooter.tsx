import { Icon, Logo } from "@/components/ui"
import { commercialConfig, getConfiguredSocialLinks, getWarrantyLabel, openWhatsApp } from "@/config/commercial"

export function StoreFooter({
  onAdmin,
  onOpenNotices,
  onOpenContact,
  onOpenCatalog,
}: {
  onAdmin?: () => void
  onOpenNotices?: () => void
  onOpenContact?: () => void
  onOpenCatalog?: () => void
}) {
  const socialLinks = getConfiguredSocialLinks()
  const hasWhatsApp = Boolean(commercialConfig.contact.whatsapp)
  const hasPhone = Boolean(commercialConfig.contact.phone)
  const hasEmail = Boolean(commercialConfig.contact.email)
  const hasHours = Boolean(commercialConfig.contact.supportHours)
  const hasContactDetails = hasWhatsApp || hasPhone || hasEmail
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel ||
    commercialConfig.contact.phone ||
    "WhatsApp"
  return (
    <footer className="store-footer">
      <div className="store-footer-main">
        <section className="footer-brand" aria-labelledby="footer-brand-title">
          <Logo onClick={onOpenCatalog} />
          <h2 id="footer-brand-title" className="sr-only">
            {commercialConfig.businessName}
          </h2>
          <p>{commercialConfig.description}</p>
        </section>
        <section
          className="footer-social"
          aria-labelledby="footer-social-title"
        >
          <h2 id="footer-social-title" className="footer-heading">
            Redes sociales
          </h2>
          {socialLinks.length > 0 ? (
            <ul className="footer-social-list">
              {socialLinks.map(([icon, label, href]) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (se abre en una pestaña nueva)`}
                  >
                    <Icon name={icon} size={18} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Sin enlaces publicados
            </p>
          )}
        </section>
        <section
          className="footer-contact"
          aria-labelledby="footer-contact-title"
        >
          <h2 id="footer-contact-title" className="footer-heading">
            Contacto
          </h2>
          <ul className="footer-list">
            {hasWhatsApp && (
              <li>
                <button
                  type="button"
                  className="footer-whatsapp"
                  onClick={() => openWhatsApp()}
                  aria-label={`Contactar por WhatsApp al ${whatsappLabel}`}
                >
                  <Icon name="phone" size={16} />
                  <span>WhatsApp · {whatsappLabel}</span>
                </button>
              </li>
            )}
            {hasPhone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>{commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {hasEmail && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
            {!hasContactDetails && (
              <li className="footer-pending">
                Configuración pendiente · Datos de contacto
              </li>
            )}
          </ul>
        </section>
        <section
          className="footer-support"
          aria-labelledby="footer-support-title"
        >
          <h2 id="footer-support-title" className="footer-heading">
            Atención al cliente
          </h2>
          <ul className="footer-list">
            {hasWhatsApp && (
              <li>
                <button
                  type="button"
                  className="footer-link-btn"
                  onClick={() => openWhatsApp()}
                >
                  <Icon name="phone" size={16} />
                  <span>Canal de atención por WhatsApp</span>
                </button>
              </li>
            )}
            {hasPhone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>Tel. {commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {hasHours ? (
              <li>
                <span className="footer-hours">
                  <Icon name="clock" size={16} />
                  <span>{commercialConfig.contact.supportHours}</span>
                </span>
              </li>
            ) : (
              <li className="footer-pending">
                Configuración pendiente · Horarios de atención
              </li>
            )}
            {hasEmail && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
          </ul>
        </section>
      </div>
      <section className="footer-legal" aria-labelledby="footer-legal-title">
        <h2 id="footer-legal-title" className="footer-heading">
          Información legal
        </h2>
        <ul className="footer-legal-list">
          {commercialConfig.legal.map((item) => {
            if (item.href) {
              return (
                <li key={item.label}>
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                </li>
              )
            }
            if (item.internal === "notices" && onOpenNotices) {
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
            if (item.internal === "contact" && onOpenContact) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className="footer-legal-link"
                    onClick={onOpenContact}
                  >
                    <span>{item.label}</span>
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
        </ul>
      </section>
      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} {commercialConfig.businessName}. Todos
          los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
