import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Button, Icon } from "@/components/ui"
import { commercialConfig, getConfiguredSocialLinks, openWhatsApp } from "@/config/commercial"

export function ContactPage({
  onBack,
  onAdmin,
  onOpenNotices,
}: {
  onBack: () => void
  onAdmin: () => void
  onOpenNotices: () => void
}) {
  const socialLinks = getConfiguredSocialLinks()
  const deliveryModes = commercialConfig.policies.deliveryModes
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel || commercialConfig.contact.phone
  return (
    <main className="contact-page page-enter">
      <StoreHeader
        goCatalog={onBack}
        goAdmin={onAdmin}
        goContact={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goNotices={onOpenNotices}
      />
      <section className="contact-hero">
        <span className="eyebrow">Contacto</span>
        <h1>
          Habla con
          <br />
          <em>{commercialConfig.businessName}</em>
        </h1>
        <p>{commercialConfig.description}</p>
      </section>
      <section className="contact-grid">
        <article className="contact-card">
          <h2 className="footer-heading">Canales de atención</h2>
          <ul className="footer-list">
            {commercialConfig.contact.whatsapp && (
              <li>
                <button
                  type="button"
                  className="footer-whatsapp"
                  onClick={() => openWhatsApp()}
                >
                  <Icon name="phone" size={16} />
                  <span>
                    WhatsApp
                    {whatsappLabel ? ` · ${whatsappLabel}` : ""}
                  </span>
                </button>
              </li>
            )}
            {commercialConfig.contact.phone && (
              <li>
                <a href={`tel:${commercialConfig.contact.phone}`}>
                  <Icon name="phone" size={16} />
                  <span>{commercialConfig.contact.phone}</span>
                </a>
              </li>
            )}
            {commercialConfig.contact.email && (
              <li>
                <a href={`mailto:${commercialConfig.contact.email}`}>
                  <Icon name="mail" size={16} />
                  <span>{commercialConfig.contact.email}</span>
                </a>
              </li>
            )}
            {commercialConfig.contact.supportHours ? (
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
            {!commercialConfig.contact.whatsapp &&
              !commercialConfig.contact.phone &&
              !commercialConfig.contact.email && (
                <li className="footer-pending">
                  Configuración pendiente · Datos de contacto
                </li>
              )}
          </ul>
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Redes sociales</h2>
          {socialLinks.length > 0 ? (
            <ul className="footer-social-list">
              {socialLinks.map(([icon, label, href]) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon name={icon} size={18} />
                    <span>{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Sin redes publicadas
            </p>
          )}
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Condiciones clave</h2>
          <ul className="contact-policy-list">
            <li>
              <strong>{commercialConfig.policies.warrantyTitle}</strong>
              <span>{commercialConfig.policies.warrantyText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.unlockedTitle}</strong>
              <span>{commercialConfig.policies.unlockedText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.notRefurbishedTitle}</strong>
              <span>{commercialConfig.policies.notRefurbishedText}</span>
            </li>
            <li>
              <strong>{commercialConfig.policies.noReplacedPartsTitle}</strong>
              <span>{commercialConfig.policies.noReplacedPartsText}</span>
            </li>
          </ul>
          <Button variant="secondary" onClick={onOpenNotices}>
            Ver avisos completos
          </Button>
        </article>
        <article className="contact-card">
          <h2 className="footer-heading">Modalidades de entrega</h2>
          {deliveryModes && deliveryModes.length > 0 ? (
            <ul className="contact-policy-list">
              {deliveryModes.map((mode) => (
                <li key={mode}>
                  <strong>{mode}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="footer-pending">
              Configuración pendiente · Modalidades de entrega
            </p>
          )}
        </article>
      </section>
      <StoreFooter
        onAdmin={onAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onOpenCatalog={onBack}
      />
    </main>
  )
}
