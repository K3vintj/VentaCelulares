import { Skeleton } from "@/components/ui/Skeleton"

type TableSkeletonProps = {
  columns?: number
  rows?: number
  columnWidths?: string[]
  /** Si true, no envuelve en table-card (útil dentro del dashboard). */
  embedded?: boolean
  headers?: string[]
  showProductCell?: boolean
}

/** Tabla admin: encabezados y filas con columnas configurables. */
export const TableSkeleton = ({
  columns = 6,
  rows = 5,
  columnWidths,
  embedded = false,
  headers,
  showProductCell = false,
}: TableSkeletonProps) => {
  const colCount = headers?.length ?? columns
  const widths =
    columnWidths ??
    Array.from({ length: colCount }, () => `${Math.floor(100 / colCount)}%`)

  const table = (
    <div className="table-scroll" aria-hidden="true">
      <table className="table-skeleton">
        <thead>
          <tr>
            {Array.from({ length: colCount }, (_, index) => (
              <th key={`th-${index}`} style={{ width: widths[index] }}>
                {headers?.[index] ? (
                  <span className="sr-only">{headers[index]}</span>
                ) : null}
                <Skeleton
                  width={headers?.[index] ? "70%" : "55%"}
                  height={8}
                  radius={4}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {Array.from({ length: colCount }, (_, colIndex) => (
                <td key={`cell-${rowIndex}-${colIndex}`}>
                  {showProductCell && colIndex === 0 ? (
                    <div className="table-product table-product-skeleton">
                      <Skeleton width={42} height={42} radius={7} />
                      <div>
                        <Skeleton width={120} height={10} radius={4} />
                        <Skeleton
                          width={80}
                          height={8}
                          radius={4}
                          className="mt-skeleton"
                        />
                      </div>
                    </div>
                  ) : (
                    <Skeleton
                      width={colIndex === colCount - 1 ? "40%" : "72%"}
                      height={10}
                      radius={4}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (embedded) return table

  return (
    <article className="table-card table-card-skeleton" aria-hidden="true">
      {table}
    </article>
  )
}

export default TableSkeleton
