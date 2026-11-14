import { StoreFooter } from "@/components/store/StoreFooter"
import { Button } from "@/components/ui"
import { applyBusinessConfig } from "@/config/commercial"
import { AdminLogin } from "@/pages/admin/AdminLogin"
import { AdminShell } from "@/pages/admin/AdminShell"
import { ConfigPage } from "@/pages/admin/ConfigPage"
import { Dashboard } from "@/pages/admin/Dashboard"
import { Inventory } from "@/pages/admin/Inventory"
import { OrdersPage } from "@/pages/admin/OrdersPage"
import { ProductsAdmin } from "@/pages/admin/ProductsAdmin"
import { SalesPage } from "@/pages/admin/SalesPage"
import { Catalog } from "@/pages/public/Catalog"
import { Checkout } from "@/pages/public/Checkout"
import { ContactPage } from "@/pages/public/ContactPage"
import { Detail } from "@/pages/public/Detail"
import { Notices } from "@/pages/public/Notices"
import { Success } from "@/pages/public/Success"
import { Welcome } from "@/pages/public/Welcome"
import { api } from "@/services/api"
import type { Admin, BusinessConfig, OrderConfirmation, Product } from "@/types/models"
import type { AdminView, PublicView } from "@/types/navigation"
import { useCallback, useEffect, useState } from "react"
import { AuditPage } from "@/pages/admin/AuditPage"

export default function App() {
  const adminLocation = () =>
    window.location.hash === "#admin" || window.location.pathname === "/admin"
  const [view, setView] = useState<PublicView | "admin-login" | "admin">(() =>
    adminLocation() ? "admin-login" : "welcome",
  )
  const [adminView, setAdminView] = useState<AdminView>("dashboard")
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const [selected, setSelected] = useState<Product | null>(null)
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [configRevision, setConfigRevision] = useState(0)
  const [noticesReturnView, setNoticesReturnView] =
    useState<PublicView>("welcome")
  const applyConfig = useCallback((config: BusinessConfig) => {
    applyBusinessConfig(config)
    setConfigRevision((n) => n + 1)
  }, [])
  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await api.products(Boolean(admin))
      if (admin) setAdminProducts(result.products)
      else setProducts(result.products)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el catálogo")
    } finally {
      setLoading(false)
    }
  }, [admin])
  useEffect(() => {
    void refresh()
  }, [refresh])
  useEffect(() => {
    let live = true
    api
      .me()
      .then(({ admin }) => {
        if (live) {
          setAdmin(admin)
          if (adminLocation()) setView("admin")
        }
      })
      .catch(() => {})
      .finally(() => {
        if (live) setCheckingSession(false)
      })
    api
      .config()
      .then(({ config }) => {
        if (live) applyConfig(config)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [applyConfig])
  useEffect(() => {
    const open = () => setView(admin ? "admin" : "admin-login")
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "a") {
        event.preventDefault()
        open()
      }
    }
    const hash = () => {
      if (adminLocation()) open()
    }
    const expired = () => {
      setAdmin(null)
      setAdminProducts([])
      setView("admin-login")
    }
    window.addEventListener("keydown", key)
    window.addEventListener("hashchange", hash)
    window.addEventListener("vc:unauthorized", expired)
    return () => {
      window.removeEventListener("keydown", key)
      window.removeEventListener("hashchange", hash)
      window.removeEventListener("vc:unauthorized", expired)
    }
  }, [admin])
  const goCatalog = () => {
    setView("catalog")
    window.scrollTo(0, 0)
    if (admin)
      api
        .products()
        .then(({ products }) => setProducts(products))
        .catch(() => setError("No se pudo actualizar el catálogo"))
  }
  const openProduct = (product: Product) => {
    setSelected(product)
    setView("detail")
    window.scrollTo(0, 0)
  }
  const openNotices = () => {
    if (view !== "admin" && view !== "admin-login" && view !== "notices")
      setNoticesReturnView(view)
    setView("notices")
    window.scrollTo(0, 0)
  }
  const openContact = () => {
    setView("contact")
    window.scrollTo(0, 0)
  }
  const openAdmin = () => setView(admin ? "admin" : "admin-login")
  const logout = async () => {
    try {
      await api.logout()
      setAdmin(null)
      setAdminProducts([])
      setView("catalog")
      history.replaceState(null, "", "/")
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cerrar la sesión")
    }
  }
  const loadState = (
    <div className="data-state" role={error ? "alert" : "status"}>
      {loading ? "Cargando equipos…" : error}
      {error && <Button onClick={() => void refresh()}>Reintentar</Button>}
    </div>
  )
  if (view === "welcome")
    return (
      <Welcome
        onNext={() => {
          setNoticesReturnView("welcome")
          setView("notices")
        }}
        onSkip={goCatalog}
      />
    )
  if (view === "notices")
    return (
      <Notices
        key={configRevision}
        onContinue={goCatalog}
        onBack={() => setView(noticesReturnView)}
      />
    )
  if (view === "contact")
    return (
      <ContactPage
        onBack={goCatalog}
        onAdmin={openAdmin}
        onOpenNotices={openNotices}
      />
    )
  if (view === "admin-login")
    return checkingSession ? (
      <main className="data-state" role="status">
        Verificando sesión…
      </main>
    ) : (
      <AdminLogin
        onLogin={(a) => {
          setAdmin(a)
          setView("admin")
        }}
        onBack={goCatalog}
      />
    )
  if (view === "admin" && admin)
    return (
      <AdminShell
        admin={admin}
        active={adminView}
        setActive={(v) => {
          setAdminView(v)
          setError("")
        }}
        onLogout={() => void logout()}
      >
        {error && loadState}
        {adminView === "dashboard" && <Dashboard />}
        {adminView === "audit" && <AuditPage />}
        {adminView === "products" && (
          <>
            {loading && loadState}
            <ProductsAdmin products={adminProducts} refresh={refresh} />
          </>
        )}
        {adminView === "inventory" &&
          (loading ? (
            loadState
          ) : (
            <Inventory
              products={adminProducts}
              setProducts={setAdminProducts}
            />
          ))}
        {adminView === "orders" && <OrdersPage onChanged={refresh} />}
        {adminView === "sales" && (
          <SalesPage products={adminProducts} onChanged={refresh} />
        )}
        {(adminView === "settings" || adminView === "notices") && (
          <ConfigPage
            key={adminView}
            notices={adminView === "notices"}
            onChanged={applyConfig}
          />
        )}
      </AdminShell>
    )
  if (view === "detail" && selected)
    return (
      <Detail
        key={selected.id}
        product={selected}
        products={products}
        onBack={goCatalog}
        onBuy={() => setView("checkout")}
        onSelect={openProduct}
        goAdmin={openAdmin}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  if (view === "checkout" && selected)
    return (
      <Checkout
        product={selected}
        onBack={() => setView("detail")}
        onComplete={(data) => {
          setConfirmation(data)
          setView("success")
        }}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
        onOpenCatalog={goCatalog}
        footer={
          <StoreFooter
            onOpenCatalog={goCatalog}
            onOpenNotices={openNotices}
            onOpenContact={openContact}
          />
        }
      />
    )
  if (view === "success" && confirmation)
    return (
      <Success
        footer={
          <StoreFooter
            onOpenCatalog={goCatalog}
            onOpenNotices={openNotices}
            onOpenContact={openContact}
          />
        }
        confirmation={confirmation}
        onCatalog={goCatalog}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    )
  return (
    <>
      {(loading || error) && loadState}
      <Catalog
        products={products}
        onSelect={openProduct}
        goAdmin={openAdmin}
        onOpenNotices={openNotices}
        onOpenContact={openContact}
      />
    </>
  )
}
