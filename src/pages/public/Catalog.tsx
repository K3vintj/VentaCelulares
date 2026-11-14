import { ProductCard } from "@/components/store/ProductCard"
import { StoreFooter } from "@/components/store/StoreFooter"
import { StoreHeader } from "@/components/store/StoreHeader"
import { Button, Icon } from "@/components/ui"
import type { DeviceCondition, Product } from "@/types/models"
import { CONDITION_LABELS, DEVICE_CONDITIONS, getConditionLabel, normalizeCondition } from "@/utils/products"
import { useMemo, useState } from "react"

export function Catalog({
  products,
  onSelect,
  goAdmin,
  onOpenNotices,
  onOpenContact,
}: {
  products: Product[]
  onSelect: (p: Product) => void
  goAdmin: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
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
  return (
    <main className="catalog page-enter">
      <StoreHeader
        goCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goAdmin={goAdmin}
        goContact={onOpenContact}
        goNotices={onOpenNotices}
      />
      <section className="catalog-hero">
        <div>
          <span className="eyebrow">
            Catálogo ·{" "}
            <span className="availability-count">
              {
                publishedProducts.filter((p) => p.status === "Disponible")
                  .length
              }{" "}
              disponibles
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
          <input
            placeholder="Buscar por modelo, color o capacidad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filtros{" "}
          {activeFilterCount > 0 && (
            <span className="filter-count">{activeFilterCount}</span>
          )}
        </Button>
        <label className="select-wrap">
          Condición:{" "}
          <select
            value={conditionFilter}
            onChange={(e) =>
              setConditionFilter(
                e.target.value === "Todos"
                  ? "Todos"
                  : normalizeCondition(e.target.value),
              )
            }
            aria-label="Filtrar por condición comercial"
          >
            <option value="Todos">Todas</option>
            {DEVICE_CONDITIONS.map((item) => (
              <option value={item} key={item}>
                {CONDITION_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="select-wrap">
          Ordenar:{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recientes</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
          </select>
        </label>
      </section>
      <section className={filtersOpen ? "filter-strip open" : "filter-strip"}>
        <span className="filter-group-label">Disponibilidad</span>
        {["Todos", "Disponible", "Reservado", "Vendido"].map((item) => (
          <button
            className={[
              status === item ? "active" : "",
              item === "Disponible" ? "filter-available" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item}
            onClick={() => setStatus(item)}
          >
            {item}
          </button>
        ))}
        <span className="filter-group-label">Condición</span>
        <button
          className={conditionFilter === "Todos" ? "active" : ""}
          onClick={() => setConditionFilter("Todos")}
        >
          Todas
        </button>
        {DEVICE_CONDITIONS.map((item) => (
          <button
            className={[
              conditionFilter === item ? "active" : "",
              item === "nuevo" ? "filter-condition-nuevo" : "",
              item === "seminuevo" ? "filter-condition-seminuevo" : "",
              item === "usado" ? "filter-condition-usado" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            key={item}
            onClick={() => setConditionFilter(item)}
          >
            {CONDITION_LABELS[item]}
          </button>
        ))}
        <button type="button" disabled title="Filtro pendiente">
          Modelo <Icon name="chevron" size={15} />
        </button>
        <button type="button" disabled title="Filtro pendiente">
          Capacidad <Icon name="chevron" size={15} />
        </button>
      </section>
      <section className="product-grid">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => onSelect(product)}
          />
        ))}
      </section>
      {!filtered.length && (
        <div className="empty-state">
          <Icon name="search" size={34} />
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otro modelo o elimina los filtros.</p>
        </div>
      )}
      <StoreFooter
        onAdmin={goAdmin}
        onOpenNotices={onOpenNotices}
        onOpenContact={onOpenContact}
        onOpenCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </main>
  )
}
