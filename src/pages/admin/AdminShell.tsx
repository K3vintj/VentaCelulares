import { Icon, Logo } from "@/components/ui"
import { commercialConfig } from "@/config/commercial"
import type { Admin } from "@/types/models"
import type { AdminView } from "@/types/navigation"
import type { ReactNode } from "react"
import { useState } from "react"

const adminNav: { id: AdminView; label: string; icon: string }[] = [
  { id: "dashboard", label: "Resumen", icon: "grid" },
  { id: "products", label: "Productos", icon: "box" },
  { id: "inventory", label: "Inventario", icon: "chart" },
  { id: "orders", label: "Pedidos", icon: "orders" },
  { id: "sales", label: "Ventas", icon: "chart" },
  { id: "notices", label: "Avisos", icon: "info" },
  { id: "settings", label: "Configuración", icon: "settings" },
  { id: "audit", label: "Bitácora", icon: "orders" },
]

export function AdminShell({
  active,
  setActive,
  onLogout,
  children,
  admin,
}: {
  admin: Admin
  active: AdminView
  setActive: (v: AdminView) => void
  onLogout: () => void
  children: ReactNode
}) {
  const [mobileNav, setMobileNav] = useState(false)
  return (
    <main className="admin-shell">
      <aside className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="sidebar-top">
          <Logo />
          <button className="menu-button" onClick={() => setMobileNav(false)}>
            <Icon name="close" />
          </button>
        </div>
        <div className="workspace-label">
          <span>Espacio de trabajo</span>
          <strong>
            VentaCelulares <i>PRO</i>
          </strong>
        </div>
        <nav>
          {adminNav.map((item) => (
            <button
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => {
                setActive(item.id)
                setMobileNav(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span>{admin.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <strong>{admin.name}</strong>
              <small>{admin.email}</small>
            </div>
          </div>
          <button onClick={onLogout}>
            <Icon name="logout" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <button className="menu-button" onClick={() => setMobileNav(true)}>
            <Icon name="menu" />
          </button>
          <div className="admin-search">
            <span>{commercialConfig.businessName}</span>
          </div>
          <div className="admin-date">
            <span>Datos del servidor</span>
            <strong>Actualizado hoy</strong>
          </div>
          <span className="avatar">{admin.name.slice(0, 2).toUpperCase()}</span>
        </header>
        {children}
      </section>
    </main>
  )
}
