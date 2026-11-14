import { Button, Icon, Logo } from "@/components/ui"
import { commercialConfig, openWhatsApp } from "@/config/commercial"
import { useState } from "react"

export function StoreHeader({
  goCatalog,
  goAdmin,
  goContact,
  goNotices,
}: {
  goCatalog: () => void
  goAdmin: () => void
  goContact?: () => void
  goNotices?: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <header className="store-header">
      <Logo onClick={goCatalog} />
      <nav className={open ? "store-nav open" : "store-nav"}>
        <button onClick={goCatalog}>Catálogo</button>
        <button onClick={goNotices || goCatalog}>Condiciones</button>
        <button onClick={goContact || goCatalog}>Contacto</button>
      </nav>
      <div className="header-actions">
        {commercialConfig.contact.whatsapp && (
          <Button variant="whatsapp" onClick={() => openWhatsApp()}>
            WhatsApp
          </Button>
        )}
        <button className="menu-button" onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  )
}
