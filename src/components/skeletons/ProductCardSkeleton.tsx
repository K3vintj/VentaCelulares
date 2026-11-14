import { Skeleton } from "@/components/ui/Skeleton"

/** Imita ProductCard: foto, modelo, meta, precio y botón. */
export const ProductCardSkeleton = () => (
  <article className="product-card product-card-skeleton" aria-hidden="true">
    <div className="product-image product-image-skeleton">
      <Skeleton className="ui-skeleton-fill" radius={11} />
      <Skeleton
        className="product-skeleton-badge"
        width={72}
        height={22}
        radius={20}
      />
      <Skeleton
        className="product-skeleton-condition"
        width={64}
        height={22}
        radius={20}
      />
    </div>
    <div className="product-info">
      <div>
        <Skeleton width="42%" height={10} radius={4} className="mb-skeleton" />
        <Skeleton width="78%" height={18} radius={6} />
      </div>
      <Skeleton width={88} height={16} radius={6} />
      <div className="product-meta product-meta-skeleton">
        <Skeleton width={56} height={24} radius={6} />
        <Skeleton width={64} height={24} radius={6} />
        <Skeleton width={72} height={24} radius={6} />
      </div>
      <Skeleton width="100%" height={40} radius={10} />
    </div>
  </article>
)

export default ProductCardSkeleton
