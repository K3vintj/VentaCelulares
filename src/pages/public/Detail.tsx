import { ProductCard } from "@/components/store/ProductCard"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Button, ConditionBadge, Icon, StatusBadge } from "@/components/ui"
import { commercialConfig, getProductWarrantyText, openWhatsApp } from "@/config/commercial"
import type { Product } from "@/types/models"
import { mxn } from "@/utils/format"
import { getConditionLabel, normalizeCondition } from "@/utils/products"
import { useState } from "react"

export function Detail({
  product,
  products,
  onBack,
  onBuy,
  onSelect,
  goAdmin,
  onOpenNotices,
  onOpenContact,
}: {
  product: Product
  products: Product[]
  onBack: () => void
  onBuy: () => void
  onSelect: (p: Product) => void
  goAdmin: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
}) {
  const [photo, setPhoto] = useState(0)
  const productPhotos = product.photos?.length
    ? product.photos.map((p) => p.url)
    : [product.image]
  const condition = normalizeCondition(product.condition)
  const conditionDisplay = product.conditionNote
    ? `${getConditionLabel(condition)} · ${product.conditionNote}`
    : getConditionLabel(condition)
  const batteryLabel = product.techInfoVerified
    ? product.battery
    : `${product.battery} · No verificada`
  const specs = [
    ["Capacidad", product.storage],
    ["Color", product.color],
    ["Salud de batería", batteryLabel],
    ["Condición comercial", conditionDisplay],
    ["Estado físico", product.physicalCondition || "No indicado"],
    [
      "Estado de pantalla",
      product.techInfoVerified
        ? product.screenCondition || "No indicado"
        : `${product.screenCondition || "No indicado"} · No verificado`,
    ],
    [
      "Cámaras",
      product.techInfoVerified
        ? product.cameraStatus || "No indicado"
        : `${product.cameraStatus || "No indicado"} · No verificado`,
    ],
    ["Face ID / Touch ID", product.biometric],
    ["Liberación", product.unlockStatus || "No indicado"],
    ["Reparaciones / piezas", product.repairHistory || "No indicado"],
    ["Accesorios", product.accessories || "No indicado"],
    ["Garantía comercial", getProductWarrantyText(product.warrantyDays)],
    ["Liberación (política)", commercialConfig.policies.unlockedText],
  ]
  return (
    <main className="detail page-enter">
      <StoreHeader
        goCatalog={onBack}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <div className="breadcrumb">
        <button onClick={onBack}>Catálogo</button>
        <Icon name="chevron" size={14} />
        <span>{product.name}</span>
      </div>
      <section className="detail-layout">
        <div className="gallery">
          <div className="main-photo">
            <img
              key={photo}
              src={productPhotos[photo]}
              alt={`${product.name}, vista ${photo + 1}`}
            />
            <span>Fotografía del equipo</span>
          </div>
          <div className="thumbnails">
            {productPhotos.map((img, i) => (
              <button
                key={img}
                className={photo === i ? "active" : ""}
                onClick={() => setPhoto(i)}
              >
                <img src={img} alt="Vista del producto" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-title">
            <div className="detail-badges">
              <StatusBadge status={product.status} />
              <ConditionBadge condition={condition} />
            </div>
            <span className="sku">{product.id}</span>
            <h1>{product.name}</h1>
            <p>{conditionDisplay}</p>
            <strong>
              {mxn(product.price)} <small>MXN</small>
            </strong>
          </div>
          <p className="detail-description">{product.description}</p>
          {!product.techInfoVerified && (
            <div className="request-note detail-unverified">
              <Icon name="info" size={18} />
              <p>
                Parte de la información técnica de este equipo está marcada como
                no verificada.
              </p>
            </div>
          )}
          {product.observations && (
            <p className="detail-observations">
              <span>Observaciones</span>
              {product.observations}
            </p>
          )}
          <div className="spec-grid">
            {specs.map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <Button
              variant="gold"
              onClick={onBuy}
              disabled={product.status !== "Disponible"}
            >
              {product.status === "Disponible"
                ? "Comprar ahora"
                : "No disponible"}
            </Button>
            {commercialConfig.contact.whatsapp && (
              <Button
                variant="whatsapp"
                icon="phone"
                onClick={() =>
                  openWhatsApp(
                    `Hola, me interesa el ${product.name} (${product.id}).`,
                  )
                }
              >
                Consultar por WhatsApp
              </Button>
            )}
          </div>
          <div className="request-note">
            <Icon name="info" size={18} />
            <p>
              Enviar una solicitud no procesa un pago ni garantiza una reserva.
              Confirmaremos la disponibilidad contigo.
            </p>
          </div>
        </div>
      </section>
      <section className="related">
        <div className="related-heading">
          <div>
            <span className="eyebrow">También podrían gustarte</span>
            <h2>Otros equipos seleccionados</h2>
          </div>
          <Button variant="ghost" icon="arrow" onClick={onBack}>
            Ver catálogo
          </Button>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.isPublished && p.id !== product.id)
            .slice(0, 3)
            .map((p) => (
              <ProductCard product={p} key={p.id} onOpen={() => onSelect(p)} />
            ))}
        </div>
      </section>
      <StoreFooter
        onAdmin={goAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={onBack}
      />
    </main>
  )
}
