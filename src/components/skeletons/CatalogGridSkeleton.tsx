import { ProductCardSkeleton } from "@/components/skeletons/ProductCardSkeleton"

type CatalogGridSkeletonProps = {
  count?: number
}

/** Grilla de catálogo con tarjetas skeleton de dimensiones equivalentes. */
export const CatalogGridSkeleton = ({
  count = 6,
}: CatalogGridSkeletonProps) => (
  <section
    className="product-grid catalog-grid-skeleton"
    aria-hidden="true"
  >
    {Array.from({ length: count }, (_, index) => (
      <ProductCardSkeleton key={`catalog-skeleton-${index}`} />
    ))}
  </section>
)

export default CatalogGridSkeleton
