import { Button, Icon, Logo } from "@/components/ui"
import { commercialConfig, getWarrantyLabel } from "@/config/commercial"

export function Notices({
  onContinue,
  onBack,
}: {
  onContinue: () => void
  onBack: () => void
}) {
  const warrantyLink = commercialConfig.policies.warrantyTermsHref
  const notices = commercialConfig.notices.items
  const featured = notices.find((item) => item.featured)
  const rest = notices.filter((item) => !item.featured)
  return (
    <main className="notices page-enter">
      <div className="ambient ambient-one" />
      <nav className="simple-nav">
        <button className="icon-button" onClick={onBack}>
          <Icon name="arrow" />
          <span>Volver</span>
        </button>
        <Logo onClick={onContinue} />
      </nav>
      <section className="notices-inner">
        <div className="section-heading">
          <span className="eyebrow">{commercialConfig.notices.eyebrow}</span>
          <h1>
            {commercialConfig.notices.titleLead}
            <br />
            <em>{commercialConfig.notices.titleAccent}</em>
          </h1>
          <p>{commercialConfig.notices.subtitle}</p>
        </div>
        <div className="notice-list">
          {featured && (
            <article className="notice-card notice-featured">
              <div
                className="notice-icon notice-icon-positive"
                aria-hidden="true"
              >
                <Icon name={featured.icon} size={22} />
              </div>
              <div>
                <span className="notice-badge">Destacado</span>
                <h3>{featured.title}</h3>
                <p>{featured.text}</p>
              </div>
            </article>
          )}
          <div className="notice-grid">
            {rest.map((item) => (
              <article
                className={`notice-card${
                  item.positive ? " notice-positive" : ""
                }`}
                key={item.id}
              >
                <div
                  className={`notice-icon${
                    item.positive ? " notice-icon-positive" : ""
                  }`}
                  aria-hidden="true"
                >
                  <Icon name={item.icon} size={18} />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
          <div className="notice-disclaimer">
            <Icon name="info" size={18} />
            <p>
              {commercialConfig.notices.disclaimer} Garantía vigente:{" "}
              {getWarrantyLabel(commercialConfig.policies.warrantyDays)}.
            </p>
          </div>
          {warrantyLink ? (
            <a
              className="notice-guarantee-link"
              href={warrantyLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Condiciones completas de garantía
              <Icon name="arrow" size={16} />
            </a>
          ) : (
            <p className="notice-guarantee-pending">
              Condiciones completas de garantía · Espacio reservado para enlace
              verificado
            </p>
          )}
          <Button
            variant="gold"
            onClick={onContinue}
            icon="arrow"
            className="wide-mobile"
          >
            Explorar iPhones
          </Button>
        </div>
      </section>
    </main>
  )
}
