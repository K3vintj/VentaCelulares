import { Icon } from "@/components/ui"
import type { DeviceCondition } from "@/types/models"
import { CONDITION_LABELS, DEVICE_CONDITIONS } from "@/utils/products"
import { useEffect, useId, useRef, useState } from "react"

type FilterGroupId = "status" | "condition" | "sort"

type FilterOption = {
  value: string
  label: string
}

const statusOptions: FilterOption[] = [
  { value: "Todos", label: "Todos" },
  { value: "Disponible", label: "Disponible" },
  { value: "Reservado", label: "Reservado" },
  { value: "Vendido", label: "Vendido" },
]

const conditionOptions: FilterOption[] = [
  { value: "Todos", label: "Todas" },
  ...DEVICE_CONDITIONS.map((item) => ({
    value: item,
    label: CONDITION_LABELS[item],
  })),
]

const sortOptions: FilterOption[] = [
  { value: "Recientes", label: "Recientes" },
  { value: "Menor precio", label: "Menor precio" },
  { value: "Mayor precio", label: "Mayor precio" },
]

type CatalogFiltersProps = {
  open: boolean
  status: string
  conditionFilter: "Todos" | DeviceCondition
  sort: string
  activeFilterCount: number
  onStatusChange: (value: string) => void
  onConditionChange: (value: "Todos" | DeviceCondition) => void
  onSortChange: (value: string) => void
  onClearFilters: () => void
}

export function CatalogFilters({
  open,
  status,
  conditionFilter,
  sort,
  activeFilterCount,
  onStatusChange,
  onConditionChange,
  onSortChange,
  onClearFilters,
}: CatalogFiltersProps) {
  const [expanded, setExpanded] = useState<FilterGroupId | null>(null)
  const stripRef = useRef<HTMLElement>(null)
  const conditionLabel =
    conditionFilter === "Todos"
      ? "Todas"
      : CONDITION_LABELS[conditionFilter]
  const isSortCustom = sort !== "Recientes"
  const handleToggle = (id: FilterGroupId) => {
    setExpanded((current) => (current === id ? null : id))
  }
  const handleSelect = (id: FilterGroupId, value: string) => {
    if (id === "status") onStatusChange(value)
    if (id === "condition")
      onConditionChange(
        value === "Todos" ? "Todos" : (value as DeviceCondition),
      )
    if (id === "sort") onSortChange(value)
    setExpanded(null)
  }
  useEffect(() => {
    if (!open) setExpanded(null)
  }, [open])
  useEffect(() => {
    if (!expanded || !open) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!stripRef.current?.contains(target)) setExpanded(null)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(null)
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [expanded, open])
  return (
    <section
      ref={stripRef}
      id="catalog-filter-strip"
      className={`filter-strip${open ? " open" : ""}`}
      aria-label="Filtros del catálogo"
      hidden={!open}
    >
      <FilterControl
        id="status"
        label="Disponibilidad"
        valueLabel={status}
        isDefault={status === "Todos"}
        isExpanded={expanded === "status"}
        options={statusOptions}
        selectedValue={status}
        onToggle={() => handleToggle("status")}
        onSelect={(value) => handleSelect("status", value)}
      />
      <FilterControl
        id="condition"
        label="Condición"
        valueLabel={conditionLabel}
        isDefault={conditionFilter === "Todos"}
        isExpanded={expanded === "condition"}
        options={conditionOptions}
        selectedValue={
          conditionFilter === "Todos" ? "Todos" : conditionFilter
        }
        onToggle={() => handleToggle("condition")}
        onSelect={(value) => handleSelect("condition", value)}
      />
      <FilterControl
        id="sort"
        label="Ordenar"
        valueLabel={sort}
        isDefault={!isSortCustom}
        isExpanded={expanded === "sort"}
        options={sortOptions}
        selectedValue={sort}
        onToggle={() => handleToggle("sort")}
        onSelect={(value) => handleSelect("sort", value)}
      />
      {(activeFilterCount > 0 || isSortCustom) && (
        <div className="filter-strip-actions">
          {activeFilterCount > 0 && (
            <span className="filter-active-meta" aria-live="polite">
              {activeFilterCount}{" "}
              {activeFilterCount === 1
                ? "filtro activo"
                : "filtros activos"}
            </span>
          )}
          {isSortCustom && activeFilterCount === 0 && (
            <span className="filter-active-meta">Orden personalizado</span>
          )}
          <button
            type="button"
            className="filter-clear"
            onClick={() => {
              onClearFilters()
              setExpanded(null)
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </section>
  )
}

function FilterControl({
  id,
  label,
  valueLabel,
  isDefault,
  isExpanded,
  options,
  selectedValue,
  onToggle,
  onSelect,
}: {
  id: FilterGroupId
  label: string
  valueLabel: string
  isDefault: boolean
  isExpanded: boolean
  options: FilterOption[]
  selectedValue: string
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  const menuId = useId()
  return (
    <div
      className={[
        "filter-control",
        isDefault ? "is-default" : "is-active",
        isExpanded ? "is-expanded" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="filter-control-trigger"
        aria-expanded={isExpanded}
        aria-controls={menuId}
        aria-label={`${label}: ${valueLabel}`}
        onClick={onToggle}
      >
        <span className="filter-control-label">{label}</span>
        <span className="filter-control-divider" aria-hidden="true" />
        <span className="filter-control-value">{valueLabel}</span>
        {!isDefault && (
          <span className="filter-control-dot" aria-hidden="true" />
        )}
        <Icon name="chevron" size={14} />
      </button>
      {isExpanded && (
        <div
          id={menuId}
          className="filter-control-menu"
          role="listbox"
          aria-label={`Opciones de ${label}`}
        >
          {options.map((option) => {
            const isSelected = option.value === selectedValue
            return (
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`filter-control-option${isSelected ? " is-selected" : ""}`}
                key={`${id}-${option.value}`}
                onClick={() => onSelect(option.value)}
              >
                <span>{option.label}</span>
                {isSelected && <Icon name="check" size={16} />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
