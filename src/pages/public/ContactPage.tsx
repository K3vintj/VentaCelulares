import { DeliveryModesCard } from "@/components/store/DeliveryModesCard"
import { InstagramPreview } from "@/components/store/InstagramPreview"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Button, Icon } from "@/components/ui"
import { commercialConfig, openWhatsApp } from "@/config/commercial"

export function ContactPage({
  onBack,
  onOpenNotices,
}: {
  onBack: () => void
  onOpenNotices: () => void
}) {
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel || commercialConfig.contact.phone
  return (
    <main id="main-content" tabIndex={-1} className="contact-page page-enter">
      <StoreHeader
        goCatalog={onBack}
        goContact={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goNotices={onOpenNotices}
      />
      <div className="contact-page-body">
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
        <div className="contact-column">
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
        </div>
        <div className="contact-column">
          <InstagramPreview />
          <DeliveryModesCard />
        </div>
      </section>
      </div>
      <StoreFooter
        variant="minimal"
        onOpenNotices={onOpenNotices}
        onOpenCatalog={onBack}
      />
    </main>
  )
}
