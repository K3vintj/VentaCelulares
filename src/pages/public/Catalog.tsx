import { CatalogGridSkeleton } from "@/components/skeletons/CatalogGridSkeleton"
import { CatalogFilters } from "@/components/store/CatalogFilters"
import { ProductCard } from "@/components/store/ProductCard"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Button, Icon } from "@/components/ui"
import type { DeviceCondition, Product } from "@/types/models"
import { getConditionLabel, normalizeCondition } from "@/utils/products"
import { useMemo, useState } from "react"

export function Catalog({
  products,
  onSelect,
  onOpenNotices,
  onOpenContact,
  loading = false,
  loadError = "",
  onRetry,
}: {
  products: Product[]
  onSelect: (p: Product) => void
  onOpenNotices: () => void
  onOpenContact: () => void
  loading?: boolean
  loadError?: string
  onRetry?: () => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Todos")
  const [conditionFilter, setConditionFilter] =
    useState<"Todos" | DeviceCondition>("Todos")
  const [sort, setSort] = useState("Recientes")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilterCount =
    (status !== "Todos" ? 1 : 0) + (conditionFilter !== "Todos" ? 1 : 0)
  const publishedProducts = useMemo(
    () => products.filter((p) => p.isPublished),
    [products],
  )
  const filtered = useMemo(() => {
    const result = publishedProducts.filter(
      (p) =>
        (status === "Todos" || p.status === status) &&
        (conditionFilter === "Todos" ||
          normalizeCondition(p.condition) === conditionFilter) &&
        `${p.name} ${p.storage} ${p.color} ${getConditionLabel(p.condition)}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    if (sort === "Menor precio")
      return [...result].sort((a, b) => a.price - b.price)
    if (sort === "Mayor precio")
      return [...result].sort((a, b) => b.price - a.price)
    return result
  }, [publishedProducts, query, status, conditionFilter, sort])
  const handleClearFilters = () => {
    setStatus("Todos")
    setConditionFilter("Todos")
    setSort("Recientes")
  }
  const availableCount = publishedProducts.filter(
    (p) => p.status === "Disponible",
  ).length
  const hasCatalogError = Boolean(loadError) && !publishedProducts.length
  const isCatalogEmpty =
    !loading && !hasCatalogError && !publishedProducts.length
  const isFilterEmpty =
    !loading && !hasCatalogError && publishedProducts.length > 0 && !filtered.length
  return (
    <main id="main-content" tabIndex={-1} className="catalog page-enter">
      <StoreHeader
        goCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <section className="catalog-hero">
        <div>
          <span className="eyebrow">
            Catálogo ·{" "}
            <span className="availability-count">
              {loading
                ? "Cargando disponibilidad…"
                : `${availableCount} disponibles`}
            </span>
          </span>
          <h1>
            Encuentra el iPhone
            <br />
            <em>perfecto para ti.</em>
          </h1>
        </div>
        <p>
          Modelos seleccionados, información transparente y atención personal en
          cada paso.
        </p>
      </section>
      <section className="catalog-tools">
        <label className="search-box">
          <Icon name="search" />
          <span className="sr-only">Buscar equipos</span>
          <input
            type="search"
            placeholder="Buscar por modelo, color o capacidad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar por modelo, color o capacidad"
            disabled={loading || hasCatalogError || isCatalogEmpty}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => setFiltersOpen(!filtersOpen)}
          aria-expanded={filtersOpen}
          aria-controls="catalog-filter-strip"
          disabled={loading || hasCatalogError || isCatalogEmpty}
        >
          Filtros{" "}
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
          )}
        </Button>
      </section>
      <CatalogFilters
        open={filtersOpen}
        status={status}
        conditionFilter={conditionFilter}
        sort={sort}
        activeFilterCount={activeFilterCount}
        onStatusChange={setStatus}
        onConditionChange={setConditionFilter}
        onSortChange={setSort}
        onClearFilters={handleClearFilters}
      />
      <p className="sr-only filter-results-live" aria-live="polite">
        {loading
          ? "Cargando equipos"
          : `${filtered.length} ${
              filtered.length === 1 ? "equipo encontrado" : "equipos encontrados"
            }`}
      </p>
      {loading ? (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Cargando catálogo</span>
          <CatalogGridSkeleton count={6} />
        </div>
      ) : (
        <section className="product-grid">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={() => onSelect(product)}
            />
          ))}
        </section>
      )}
      {hasCatalogError && (
        <div className="empty-state" role="alert">
          <Icon name="info" size={34} />
          <h3>No se pudo cargar el catálogo</h3>
          <p>
            {loadError ||
              "Revisa la conexión con el servidor e intenta de nuevo."}
          </p>
          {onRetry && (
            <Button onClick={onRetry} aria-label="Reintentar carga del catálogo">
              Reintentar
            </Button>
          )}
        </div>
      )}
      {isCatalogEmpty && (
        <div className="empty-state" role="status">
          <Icon name="grid" size={34} />
          <h3>Por ahora no hay equipos disponibles</h3>
          <p>
            El inventario se actualizará cuando haya unidades publicadas. Vuelve
            pronto o contáctanos por WhatsApp.
          </p>
        </div>
      )}
      {isFilterEmpty && (
        <div className="empty-state" role="status">
          <Icon name="search" size={34} />
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otro modelo o elimina los filtros.</p>
        </div>
      )}
      <StoreFooter
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </main>
  )
}
