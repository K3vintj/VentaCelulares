import { Skeleton } from "@/components/ui/Skeleton"

type FormSkeletonProps = {
  fields?: number
  dualColumn?: boolean
  showUpload?: boolean
}

/** Formulario de edición: campos y acciones mientras cargan datos existentes. */
export const FormSkeleton = ({
  fields = 8,
  dualColumn = true,
  showUpload = true,
}: FormSkeletonProps) => (
  <div className="form-skeleton" aria-hidden="true">
    <div className="form-heading form-heading-skeleton">
      <Skeleton circle width={34} height={34} />
      <div>
        <Skeleton width={160} height={16} radius={6} />
        <Skeleton
          width={220}
          height={10}
          radius={4}
          className="mt-skeleton"
        />
      </div>
    </div>
    {showUpload && (
      <div className="upload-box upload-box-skeleton">
        <Skeleton width={48} height={48} radius={10} />
        <Skeleton width={140} height={10} radius={4} />
        <Skeleton width={100} height={8} radius={4} />
      </div>
    )}
    <div
      className={`form-grid form-grid-skeleton${dualColumn ? "" : " form-grid-single"}`}
    >
      {Array.from({ length: fields }, (_, index) => (
        <div className="field field-skeleton" key={`field-${index}`}>
          <Skeleton width="38%" height={9} radius={4} />
          <Skeleton width="100%" height={46} radius={9} />
        </div>
      ))}
    </div>
    <div className="product-form-actions">
      <Skeleton width={100} height={44} radius={10} />
      <Skeleton width={140} height={44} radius={10} />
    </div>
  </div>
)

export default FormSkeleton
