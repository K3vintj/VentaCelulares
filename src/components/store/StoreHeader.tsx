import { Button, Icon, Logo } from "@/components/ui"
import { commercialConfig, openWhatsApp } from "@/config/commercial"
import { useId, useState } from "react"

export function StoreHeader({
  goCatalog,
  goContact,
  goNotices,
}: {
  goCatalog: () => void
  goContact?: () => void
  goNotices?: () => void
}) {
  const [open, setOpen] = useState(false)
  const navId = useId()
  const handleNav = (action: () => void) => {
    setOpen(false)
    action()
  }
  return (
    <header className="store-header">
      <Logo onClick={goCatalog} />
      <nav
        id={navId}
        className={open ? "store-nav open" : "store-nav"}
        aria-label="Navegación de la tienda"
      >
        <button type="button" onClick={() => handleNav(goCatalog)}>
          Catálogo
        </button>
        <button type="button" onClick={() => handleNav(goNotices || goCatalog)}>
          Condiciones
        </button>
        <button type="button" onClick={() => handleNav(goContact || goCatalog)}>
          Contacto
        </button>
      </nav>
      <div className="header-actions">
        {commercialConfig.contact.whatsapp && (
          <Button variant="whatsapp" onClick={() => openWhatsApp()}>
            WhatsApp
          </Button>
        )}
        <button
          type="button"
          className="menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
          aria-expanded={open}
          aria-controls={navId}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  )
}
