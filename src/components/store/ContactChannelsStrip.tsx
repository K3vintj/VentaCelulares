import { Icon } from "@/components/ui"
import { commercialConfig, openWhatsApp } from "@/config/commercial"

export function ContactChannelsStrip() {
  const whatsappLabel =
    commercialConfig.contact.whatsappLabel || commercialConfig.contact.phone
  const hasWhatsApp = Boolean(commercialConfig.contact.whatsapp)
  const supportHours = commercialConfig.contact.supportHours

  return (
    <section
      className="contact-strip contact-strip--channels"
      aria-labelledby="contact-channels-title"
    >
      <h2 id="contact-channels-title" className="footer-heading">
        Canales de atención
      </h2>
      <div className="contact-strip-row">
        {hasWhatsApp ? (
          <button
            type="button"
            className="footer-whatsapp"
            onClick={() => openWhatsApp()}
            aria-label={
              whatsappLabel
                ? `Contactar por WhatsApp al ${whatsappLabel}`
                : "Contactar por WhatsApp"
            }
          >
            <Icon name="phone" size={16} />
            <span>
              WhatsApp
              {whatsappLabel ? ` · ${whatsappLabel}` : ""}
            </span>
          </button>
        ) : (
          <span className="footer-pending">
            Configuración pendiente · WhatsApp
          </span>
        )}
        {supportHours ? (
          <p className="contact-strip-hours">
            <Icon name="clock" size={16} />
            <span>{supportHours}</span>
          </p>
        ) : (
          <p className="contact-strip-hours is-pending">
            <Icon name="clock" size={16} />
            <span>Horario de atención · Pendiente</span>
          </p>
        )}
      </div>
    </section>
  )
}
