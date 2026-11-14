import { Brand, FooterLinks } from "@/components/store/FlowLayout"
import type { OrderConfirmation } from "@/types/models"
import { mxn as money } from "@/utils/format"
import type { ReactNode } from "react"

export function Success({
  confirmation,
  onCatalog,
  onOpenNotices,
  onOpenContact,
  footer,
}: {
  confirmation: OrderConfirmation
  onCatalog: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
  footer?: ReactNode
}) {
  const { order, whatsappUrl } = confirmation
  return (
    <main className="success page-enter">
      <Brand onClick={onCatalog} />
      <div className="success-card">
        <span className="success-icon">✓</span>
        <span className="eyebrow">Solicitud guardada</span>
        <h1>Gracias, {order.customerName}.</h1>
        <p>
          Confirmaremos contigo la disponibilidad y las condiciones de entrega.
        </p>
        <div className="folio">
          <span>Tu folio</span>
          <strong>{order.folio}</strong>
        </div>
        <div className="confirmation-product">
          <div>
            <span>Producto</span>
            <strong>{order.productNameSnapshot}</strong>
          </div>
          <div>
            <span>Precio de referencia</span>
            <strong>{money(order.priceSnapshot)}</strong>
          </div>
          <div>
            <span>Entrega</span>
            <strong>
              {order.deliveryMode === "envio" ? "Envío" : "Local"}
            </strong>
          </div>
        </div>
        <div className="request-note">
          <p>La solicitud no representa un pago ni una reserva garantizada.</p>
        </div>
        <div className="success-actions">
          <button className="btn btn-gold" onClick={onCatalog}>
            Volver al catálogo
          </button>
          <a
            className="btn btn-whatsapp"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Continuar por WhatsApp
          </a>
        </div>
      </div>
      <FooterLinks
        footer={footer}
        onOpenCatalog={onCatalog}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
      />
    </main>
  )
}
