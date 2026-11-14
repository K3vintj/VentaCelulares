import type { DeviceCondition, Status } from "@/types/models"
import { getConditionLabel } from "@/utils/products"
import type { ChangeEvent, ReactNode } from "react"
import { Icon } from "./Icon"

export { Icon } from "./Icon"
export { Logo } from "./Logo"
export function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger" | "whatsapp" | "gold"
  icon?: string
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      <span>{children}</span>
      {icon && <Icon name={icon} size={18} />}
    </button>
  )
}

export function StatusBadge({ status }: { status: Status | string }) {
  return (
    <span
      className={`status status-${status.toLowerCase().replace(/ /g, "-")}`}
    >
      <i />
      {status}
    </span>
  )
}

export function Field({
  label,
  placeholder,
  type = "text",
  required = false,
  defaultValue,
  name,
  value,
  onChange,
  error,
  min,
  max,
  step,
  children,
}: {
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  defaultValue?: string
  name?: string
  value?: string | number
  onChange?: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void
  error?: string
  min?: number | string
  max?: number | string
  step?: number | string
  children?: ReactNode
}) {
  return (
    <label className={`field${error ? " field-error" : ""}`}>
      <span>
        {label}
        {required && " *"}
      </span>
      {children || (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
        />
      )}
      {error && <em className="field-error-msg">{error}</em>}
    </label>
  )
}
export function ConditionBadge({ condition }: { condition: DeviceCondition }) {
  const label = getConditionLabel(condition)
  return <span className={`condition-tag condition-${condition}`}>{label}</span>
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="admin-page-title">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}
