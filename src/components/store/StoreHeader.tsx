import { Button, Icon, Logo } from "@/components/ui"
import { commercialConfig, openWhatsApp } from "@/config/commercial"
import { useEffect, useId, useRef, useState } from "react"

const MOBILE_NAV_QUERY = "(max-width: 760px)"

const navItems = [
  {
    id: "catalog",
    label: "Catálogo",
    icon: "phone",
  },
  {
    id: "notices",
    label: "Condiciones",
    icon: "shield",
  },
  {
    id: "contact",
    label: "Contacto",
    icon: "mail",
  },
] as const

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
  const [isMobile, setIsMobile] = useState(false)
  const navId = useId()
  const headerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const actions: Record<(typeof navItems)[number]["id"], () => void> = {
    catalog: goCatalog,
    notices: goNotices || goCatalog,
    contact: goContact || goCatalog,
  }
  const handleNav = (id: (typeof navItems)[number]["id"]) => {
    setOpen(false)
    actions[id]()
  }
  useEffect(() => {
    const media = window.matchMedia(MOBILE_NAV_QUERY)
    const sync = () => {
      setIsMobile(media.matches)
      if (!media.matches) setOpen(false)
    }
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])
  useEffect(() => {
    if (!open || !isMobile) return
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!headerRef.current?.contains(target)) setOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, isMobile])
  return (
    <header ref={headerRef} className="store-header">
      <Logo onClick={goCatalog} />
      <nav
        id={navId}
        className={open ? "store-nav open" : "store-nav"}
        aria-label="Navegación de la tienda"
        aria-hidden={isMobile && !open}
        inert={isMobile && !open ? true : undefined}
      >
        <p className="store-nav-eyebrow">Explora nuestra tienda</p>
        <div className="store-nav-list">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="store-nav-link"
              onClick={() => handleNav(item.id)}
            >
              <span className="store-nav-icon" aria-hidden="true">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="store-nav-copy">
                <span className="store-nav-title">{item.label}</span>
              </span>
              <span className="store-nav-chevron" aria-hidden="true">
                <Icon name="chevron" size={16} />
              </span>
            </button>
          ))}
        </div>
        <div className="store-nav-footer">
          <span className="store-nav-status-dot" aria-hidden="true" />
          <span>Atención personalizada</span>
        </div>
      </nav>
      <div className="header-actions">
        {commercialConfig.contact.whatsapp && (
          <Button variant="whatsapp" onClick={() => openWhatsApp()}>
            WhatsApp
          </Button>
        )}
        <button
          ref={menuButtonRef}
          type="button"
          className={`menu-button${open ? " is-open" : ""}`}
          onClick={() => setOpen((current) => !current)}
          aria-label={
            open ? "Cerrar menú de navegación" : "Abrir menú de navegación"
          }
          aria-expanded={open}
          aria-controls={navId}
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  )
}
