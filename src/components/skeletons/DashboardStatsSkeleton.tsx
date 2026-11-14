import { Skeleton } from "@/components/ui/Skeleton"
import { TableSkeleton } from "@/components/skeletons/TableSkeleton"

/** Dashboard: indicadores, gráficos y tabla de pedidos recientes. */
export const DashboardStatsSkeleton = () => (
  <div className="dashboard-skeleton" aria-hidden="true">
    <div className="stat-grid">
      {Array.from({ length: 4 }, (_, index) => (
        <article className="stat-card" key={`stat-${index}`}>
          <div>
            <Skeleton width="55%" height={10} radius={4} />
            <Skeleton width={18} height={18} radius={6} />
          </div>
          <Skeleton
            width="48%"
            height={28}
            radius={6}
            className="dashboard-skeleton-value"
          />
          <Skeleton width="62%" height={10} radius={4} />
        </article>
      ))}
    </div>
    <div className="analytics-grid">
      <article className="chart-card">
        <div className="card-title">
          <div>
            <Skeleton width={140} height={14} radius={4} />
            <Skeleton
              width={160}
              height={10}
              radius={4}
              className="mt-skeleton"
            />
          </div>
          <Skeleton width={72} height={28} radius={6} />
        </div>
        <Skeleton
          width={120}
          height={24}
          radius={6}
          className="dashboard-skeleton-chart-total"
        />
        <div className="bars bars-skeleton">
          {[34, 48, 43, 67, 58, 88].map((height, index) => (
            <div key={`bar-${index}`}>
              <Skeleton
                width="100%"
                height={`${height}%`}
                radius="4px 4px 0 0"
                className="bar-skeleton-fill"
              />
              <Skeleton width={24} height={8} radius={4} />
            </div>
          ))}
        </div>
      </article>
      <article className="chart-card">
        <div className="card-title">
          <div>
            <Skeleton width={150} height={14} radius={4} />
            <Skeleton
              width={100}
              height={10}
              radius={4}
              className="mt-skeleton"
            />
          </div>
        </div>
        <Skeleton
          circle
          width={130}
          height={130}
          className="dashboard-skeleton-donut"
        />
        <div className="legend legend-skeleton">
          {[0, 1, 2].map((index) => (
            <p key={`legend-${index}`}>
              <Skeleton circle width={6} height={6} />
              <Skeleton width="50%" height={10} radius={4} />
              <Skeleton width={24} height={10} radius={4} />
            </p>
          ))}
        </div>
      </article>
    </div>
    <article className="table-card">
      <div className="card-title">
        <div>
          <Skeleton width={130} height={14} radius={4} />
          <Skeleton
            width={180}
            height={10}
            radius={4}
            className="mt-skeleton"
          />
        </div>
        <Skeleton width={80} height={28} radius={6} />
      </div>
      <TableSkeleton
        columns={7}
        rows={4}
        columnWidths={["12%", "16%", "16%", "14%", "12%", "14%", "8%"]}
        embedded
      />
    </article>
  </div>
)

export default DashboardStatsSkeleton
