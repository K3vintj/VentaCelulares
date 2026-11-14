import { Button, ConditionBadge, Icon, StatusBadge } from "@/components/ui"
import type { Product } from "@/types/models"
import { mxn } from "@/utils/format"
import { normalizeCondition } from "@/utils/products"

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  const condition = normalizeCondition(product.condition)
  const statusClass =
    product.status === "Disponible"
      ? "is-available"
      : product.status === "Reservado"
        ? "is-reserved"
        : product.status === "Vendido"
          ? "is-sold"
          : ""
  return (
    <article className={`product-card ${statusClass}`.trim()}>
      <button
        className="product-image"
        onClick={onOpen}
        aria-label={`Ver detalles de ${product.name}`}
        type="button"
      >
        <img src={product.image} alt="" />
        <StatusBadge status={product.status} />
        <ConditionBadge condition={condition} />
        <span className="view-circle" aria-hidden="true">
          <Icon name="arrow" />
        </span>
      </button>
      <div className="product-info">
        <div>
          {product.conditionNote && (
            <p className="condition-grade">{product.conditionNote}</p>
          )}
          <h3>{product.name}</h3>
        </div>
        <strong className="product-price">{mxn(product.price)}</strong>
        <div className="product-meta">
          <span>{product.storage}</span>
          <span>{product.color}</span>
          <span>Batería {product.battery}</span>
        </div>
        <Button
          variant="secondary"
          icon="chevron"
          onClick={onOpen}
          className="product-details-btn"
        >
          Ver detalles
        </Button>
      </div>
    </article>
  )
}
