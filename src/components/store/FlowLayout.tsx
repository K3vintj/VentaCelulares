import { commercialConfig } from "@/config/commercial"
import type { ReactNode } from "react"

export function Brand({ onClick }: { onClick: () => void }) {
  return (
    <button className="logo logo-button" type="button" onClick={onClick}>
      <img className="logo-img" src={commercialConfig.logoSrc} alt="" />
      <span className="logo-text">{commercialConfig.businessName}</span>
    </button>
  )
}
export type Navigation = {
  onOpenCatalog: () => void
  onOpenNotices: () => void
  onOpenContact: () => void
  footer?: ReactNode
}
export function FooterLinks(props: Navigation) {
  if (props.footer) return <>{props.footer}</>
  return (
    <footer className="flow-links">
      <button onClick={props.onOpenCatalog}>Catálogo</button>
      <button onClick={props.onOpenNotices}>Condiciones y privacidad</button>
      <button onClick={props.onOpenContact}>Contacto</button>
    </footer>
  )
}
