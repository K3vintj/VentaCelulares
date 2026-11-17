import { ContactChannelsStrip } from "@/components/store/ContactChannelsStrip"
import { ContactLegalStrip } from "@/components/store/ContactLegalStrip"
import { DeliveryModesCard } from "@/components/store/DeliveryModesCard"
import { InstagramPreview } from "@/components/store/InstagramPreview"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { TikTokPreview } from "@/components/store/TikTokPreview"
import { commercialConfig } from "@/config/commercial"

export function ContactPage({
  onBack,
  onOpenNotices,
}: {
  onBack: () => void
  onOpenNotices: () => void
}) {
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
        <section
          className="contact-grid contact-bento"
          aria-label="Redes, entrega y atención"
        >
          <InstagramPreview />
          <TikTokPreview />
          <DeliveryModesCard />
          <ContactChannelsStrip />
          <ContactLegalStrip onOpenNotices={onOpenNotices} />
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
