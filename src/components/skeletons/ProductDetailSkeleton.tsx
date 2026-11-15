import { Skeleton } from "@/components/ui/Skeleton"

/** Detalle: galería, miniaturas, título, precio, specs y acciones. */
export const ProductDetailSkeleton = () => (
  <div className="detail-skeleton" aria-hidden="true">
    <div className="breadcrumb breadcrumb-skeleton">
      <Skeleton width={64} height={10} radius={4} />
      <Skeleton width={12} height={10} radius={4} />
      <Skeleton width={120} height={10} radius={4} />
    </div>
    <section className="detail-layout">
      <div className="gallery">
        <div className="main-photo main-photo-skeleton">
          <Skeleton className="ui-skeleton-fill" radius={16} />
        </div>
        <div className="thumbnails">
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={`thumb-${index}`}
              width={84}
              height={84}
              radius={10}
            />
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <div className="detail-title">
          <div className="detail-badges">
            <Skeleton width={88} height={24} radius={20} />
            <Skeleton width={72} height={24} radius={20} />
          </div>
          <Skeleton
            width={56}
            height={10}
            radius={4}
            className="detail-skeleton-sku"
          />
          <Skeleton
            width="70%"
            height={42}
            radius={8}
            className="detail-skeleton-title"
          />
          <Skeleton width="40%" height={12} radius={4} />
          <Skeleton
            width={160}
            height={28}
            radius={6}
            className="detail-skeleton-price"
          />
        </div>
        <div className="detail-description detail-description-skeleton">
          <Skeleton width="100%" height={12} radius={4} />
          <Skeleton width="92%" height={12} radius={4} />
          <Skeleton width="78%" height={12} radius={4} />
        </div>
        <div className="spec-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={`spec-${index}`}>
              <Skeleton width="45%" height={9} radius={4} />
              <Skeleton width="70%" height={12} radius={4} />
            </div>
          ))}
        </div>
        <div className="detail-actions">
          <Skeleton width="100%" height={44} radius={10} />
          <Skeleton width="100%" height={44} radius={10} />
        </div>
      </div>
    </section>
  </div>
)

export default ProductDetailSkeleton
