import { Skeleton } from "@/components/ui/Skeleton"

/** Skeleton de configuración / datos comerciales. */
export const CommercialConfigSkeleton = () => (
  <div className="settings-card commercial-config-skeleton" aria-hidden="true">
    {[0, 1].map((section) => (
      <div className="settings-section" key={`settings-section-${section}`}>
        <div>
          <Skeleton width="55%" height={14} radius={4} />
          <Skeleton
            width="80%"
            height={10}
            radius={4}
            className="mt-skeleton"
          />
          <Skeleton
            width="70%"
            height={10}
            radius={4}
            className="mt-skeleton"
          />
        </div>
        <div className="settings-fields">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="field field-skeleton" key={`cfg-${section}-${index}`}>
              <Skeleton width="40%" height={9} radius={4} />
              <Skeleton width="100%" height={46} radius={9} />
            </div>
          ))}
        </div>
      </div>
    ))}
    <footer>
      <Skeleton width={100} height={44} radius={10} />
      <Skeleton width={140} height={44} radius={10} />
    </footer>
  </div>
)

export default CommercialConfigSkeleton
