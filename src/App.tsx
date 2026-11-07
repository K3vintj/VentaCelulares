import { FormEvent, ReactNode, useMemo, useState } from "react"

type PublicView = "welcome" | "notices" | "catalog" | "detail" | "checkout" | "success"
type AdminView = "dashboard" | "products" | "inventory" | "orders" | "sales" | "notices" | "settings"
type Status = "Disponible" | "Reservado" | "Vendido"

type Product = {
  id: string
  name: string
  storage: string
  color: string
  battery: string
  price: number
  status: Status
  condition: string
  image: string
  description: string
}

const photos = [
  "https://images.unsplash.com/photo-1697636979316-cc18d4369e66?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1697636979311-511164585ca9?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1511140973288-19bf21d7e771?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1697636979792-fb057f6cbe8d?auto=format&fit=crop&w=1200&q=88",
  "https://images.unsplash.com/photo-1759588071895-6b5efd5502af?auto=format&fit=crop&w=1200&q=88",
]

const initialProducts: Product[] = [
  {
    id: "VC-001",
    name: "iPhone 15 Pro",
    storage: "256 GB",
    color: "Titanio natural",
    battery: "98%",
    price: 22990,
    status: "Disponible",
    condition: "Seminuevo · Excelente",
    image: photos[0],
    description:
      "Titanio de calidad aeroespacial, cámara Pro y rendimiento extraordinario. Equipo cuidadosamente revisado.",
  },
  {
    id: "VC-002",
    name: "iPhone 14 Pro Max",
    storage: "256 GB",
    color: "Negro espacial",
    battery: "91%",
    price: 19490,
    status: "Disponible",
    condition: "Seminuevo · Muy bueno",
    image: photos[1],
    description:
      "Una pantalla amplia y brillante, sistema de cámaras Pro y batería para todo el día.",
  },
  {
    id: "VC-003",
    name: "iPhone 15",
    storage: "128 GB",
    color: "Negro",
    battery: "100%",
    price: 16990,
    status: "Reservado",
    condition: "Nuevo · Caja abierta",
    image: photos[2],
    description:
      "Dynamic Island, cámara principal de 48 MP y diseño resistente con vidrio tintado.",
  },
  {
    id: "VC-004",
    name: "iPhone 13 Pro",
    storage: "256 GB",
    color: "Grafito",
    battery: "88%",
    price: 13990,
    status: "Disponible",
    condition: "Seminuevo · Bueno",
    image: photos[3],
    description:
      "Pantalla ProMotion, cámara triple y un acabado grafito atemporal.",
  },
  {
    id: "VC-005",
    name: "iPhone 14",
    storage: "128 GB",
    color: "Blanco estelar",
    battery: "94%",
    price: 14490,
    status: "Vendido",
    condition: "Seminuevo · Excelente",
    image: photos[4],
    description:
      "Diseño ligero, gran cámara y funciones de seguridad avanzadas.",
  },
  {
    id: "VC-006",
    name: "iPhone 13",
    storage: "128 GB",
    color: "Medianoche",
    battery: "90%",
    price: 10990,
    status: "Disponible",
    condition: "Seminuevo · Muy bueno",
    image: photos[0],
    description:
      "Potencia, equilibrio y excelente calidad fotográfica para todos los días.",
  },
]

const mxn = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)

const iconPaths: Record<string, ReactNode> = {
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 2.7 8 7 10 4.3-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  phone: (
    <>
      <path d="M7 3h3l1 5-2 1c1 3 3 5 6 6l1-2 5 1v3c0 2-2 4-4 4C9 20 4 15 3 7c0-2 2-4 4-4Z" />
    </>
  ),
  chevron: <path d="m9 6 6 6-6 6" />,
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="m4 7 8-4 8 4-8 4-8-4Z" />
      <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
      <path d="M12 11v10" />
    </>
  ),
  orders: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A8 8 0 0 0 15 6l-.3-2.6h-4L10.4 6A8 8 0 0 0 9 7L6.5 6 4.5 9.5l2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4L9 17a8 8 0 0 0 1.4 1l.3 2.6h4L15 18a8 8 0 0 0 1.5-1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="m4 20 4-1 11-11-3-3L5 16l-1 4Z" />
      <path d="m14 7 3 3" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 14v6h14v-6" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
    </>
  ),
}

function Icon({ name, size = 20 }: { name: string size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {iconPaths[name]}
    </svg>
  )
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo">
      <span className="logo-mark">V</span>
      {!compact && (
        <span>
          Venta<span className="muted">Celulares</span>
        </span>
      )}
    </div>
  )
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
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

function StatusBadge({ status }: { status: Status | string }) {
  return (
    <span
      className={`status status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {status}
    </span>
  )
}

function Field({
  label,
  placeholder,
  type = "text",
  required = false,
  defaultValue,
  children,
}: {
  label: string
  placeholder?: string
  type?: string
  required?: boolean
  defaultValue?: string
  children?: ReactNode
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required && " *"}
      </span>
      {children || (
        <input
          type={type}
          placeholder={placeholder}
          required={required}
          defaultValue={defaultValue}
        />
      )}
    </label>
  )
}

function Welcome({
  onNext,
  onSkip,
}: {
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <main className="welcome page-enter">
      <div className="welcome-glow" />
      <header className="welcome-top">
        <Logo />
        <button className="text-link" onClick={onSkip}>
          Ir al catálogo
        </button>
      </header>
      <div className="welcome-copy">
        <span className="eyebrow">Selección premium · México</span>
        <h1>
          Tu próximo iPhone
          <br />
          <em>comienza aquí.</em>
        </h1>
        <p>
          Explora una selección curada de iPhones y encuentra el ideal para ti,
          con información clara en cada detalle.
        </p>
        <Button icon="arrow" onClick={onNext}>
          Siguiente
        </Button>
        <span className="microcopy">Equipos nuevos y seminuevos</span>
      </div>
      <div className="hero-product">
        <div className="hero-orbit" />
        <img src={photos[0]} alt="iPhone en iluminación de estudio" />
        <div className="hero-caption">
          <span>Selección 01</span>
          <strong>Diseño que destaca.</strong>
        </div>
      </div>
    </main>
  )
}

function Notices({
  onContinue,
  onBack,
}: {
  onContinue: () => void
  onBack: () => void
}) {
  const notices = [
    [
      "01",
      "Equipos no reacondicionados",
      "Consulta las condiciones declaradas para cada dispositivo. La procedencia y condición se documentan de forma individual.",
    ],
    [
      "02",
      "Estado físico detallado",
      "Cada ficha muestra características, salud de batería, observaciones y fotografías correspondientes al equipo.",
    ],
    [
      "03",
      "Compra con información clara",
      "Revisa especificaciones, accesorios incluidos y las condiciones de garantía antes de enviar tu solicitud.",
    ],
  ]
  return (
    <main className="notices page-enter">
      <div className="ambient ambient-one" />
      <nav className="simple-nav">
        <button className="icon-button" onClick={onBack}>
          <Icon name="arrow" />
          <span>Volver</span>
        </button>
        <Logo />
      </nav>
      <section className="notices-inner">
        <div className="section-heading">
          <span className="eyebrow">Antes de continuar</span>
          <h1>
            Transparencia en
            <br />
            <em>cada detalle.</em>
          </h1>
          <p>
            Conoce las condiciones de nuestros equipos antes de explorar el
            catálogo.
          </p>
        </div>
        <div className="notice-list">
          {notices.map(([n, title, text]) => (
            <article className="notice-item" key={n}>
              <span className="notice-num">{n}</span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              <Icon name="check" size={20} />
            </article>
          ))}
          <div className="notice-disclaimer">
            <Icon name="info" size={18} />
            <p>
              La información se presenta por equipo y está sujeta a validación
              del negocio. Las fotografías pueden variar según disponibilidad.
            </p>
          </div>
          <Button onClick={onContinue} icon="arrow" className="wide-mobile">
            Explorar iPhones
          </Button>
        </div>
      </section>
    </main>
  )
}

function StoreHeader({
  goCatalog,
  goAdmin,
}: {
  goCatalog: () => void
  goAdmin: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <header className="store-header">
      <Logo />
      <nav className={open ? "store-nav open" : "store-nav"}>
        <button onClick={goCatalog}>Catálogo</button>
        <button onClick={goCatalog}>Cómo comprar</button>
        <button onClick={goAdmin}>Administración</button>
      </nav>
      <div className="header-actions">
        <Button
          variant="secondary"
          onClick={() => window.open("https://wa.me/5215500000000", "_blank")}
        >
          WhatsApp
        </Button>
        <button className="menu-button" onClick={() => setOpen(!open)}>
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>
    </header>
  )
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  return (
    <article className="product-card">
      <button className="product-image" onClick={onOpen}>
        <img src={product.image} alt={product.name} />
        <StatusBadge status={product.status} />
        <span className="view-circle">
          <Icon name="arrow" />
        </span>
      </button>
      <div className="product-info">
        <div>
          <p>{product.condition}</p>
          <h3>{product.name}</h3>
        </div>
        <strong>{mxn(product.price)}</strong>
        <div className="product-meta">
          <span>{product.storage}</span>
          <span>{product.color}</span>
          <span>Batería {product.battery}</span>
        </div>
        <Button variant="secondary" icon="chevron" onClick={onOpen}>
          Ver detalles
        </Button>
      </div>
    </article>
  )
}

function Catalog({
  products,
  onSelect,
  goAdmin,
}: {
  products: Product[]
  onSelect: (p: Product) => void
  goAdmin: () => void
}) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("Todos")
  const [sort, setSort] = useState("Recientes")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const filtered = useMemo(() => {
    const result = products.filter(
      (p) =>
        (status === "Todos" || p.status === status) &&
        `${p.name} ${p.storage} ${p.color}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    if (sort === "Menor precio")
      return [...result].sort((a, b) => a.price - b.price)
    if (sort === "Mayor precio")
      return [...result].sort((a, b) => b.price - a.price)
    return result
  }, [products, query, status, sort])
  return (
    <main className="catalog page-enter">
      <StoreHeader
        goCatalog={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        goAdmin={goAdmin}
      />
      <section className="catalog-hero">
        <div>
          <span className="eyebrow">
            Catálogo ·{" "}
            {products.filter((p) => p.status === "Disponible").length}{" "}
            disponibles
          </span>
          <h1>
            Encuentra el iPhone
            <br />
            <em>perfecto para ti.</em>
          </h1>
        </div>
        <p>
          Modelos seleccionados, información transparente y atención personal en
          cada paso.
        </p>
      </section>
      <section className="catalog-tools">
        <label className="search-box">
          <Icon name="search" />
          <input
            placeholder="Buscar por modelo, color o capacidad"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <Button
          variant="secondary"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          Filtros <span className="filter-count">1</span>
        </Button>
        <label className="select-wrap">
          Ordenar:{" "}
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option>Recientes</option>
            <option>Menor precio</option>
            <option>Mayor precio</option>
          </select>
        </label>
      </section>
      <section className={filtersOpen ? "filter-strip open" : "filter-strip"}>
        {["Todos", "Disponible", "Reservado", "Vendido"].map((item) => (
          <button
            className={status === item ? "active" : ""}
            key={item}
            onClick={() => setStatus(item)}
          >
            {item}
          </button>
        ))}
        <button>
          Modelo <Icon name="chevron" size={15} />
        </button>
        <button>
          Capacidad <Icon name="chevron" size={15} />
        </button>
        <button>
          Condición <Icon name="chevron" size={15} />
        </button>
      </section>
      <section className="product-grid">
        {filtered.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => onSelect(product)}
          />
        ))}
      </section>
      {!filtered.length && (
        <div className="empty-state">
          <Icon name="search" size={34} />
          <h3>No encontramos coincidencias</h3>
          <p>Prueba con otro modelo o elimina los filtros.</p>
        </div>
      )}
      <footer className="store-footer">
        <Logo />
        <p>Una forma más clara de elegir tu próximo iPhone.</p>
        <button onClick={goAdmin}>Acceso administrativo</button>
      </footer>
    </main>
  )
}

function Detail({
  product,
  products,
  onBack,
  onBuy,
  onSelect,
  goAdmin,
}: {
  product: Product
  products: Product[]
  onBack: () => void
  onBuy: () => void
  onSelect: (p: Product) => void
  goAdmin: () => void
}) {
  const [photo, setPhoto] = useState(0)
  const productPhotos = [
    product.image,
    photos[(photos.indexOf(product.image) + 1) % photos.length],
    photos[(photos.indexOf(product.image) + 2) % photos.length],
  ]
  const specs = [
    ["Capacidad", product.storage],
    ["Color", product.color],
    ["Salud de batería", product.battery],
    ["Estado físico", product.condition],
    ["Pantalla", "Original · Sin detalles"],
    ["SIM / eSIM", "Compatible"],
    ["Operador", "Liberado"],
    ["Accesorios", "Cable USB-C"],
    ["Garantía", "30 días con el negocio"],
  ]
  return (
    <main className="detail page-enter">
      <StoreHeader goCatalog={onBack} goAdmin={goAdmin} />
      <div className="breadcrumb">
        <button onClick={onBack}>Catálogo</button>
        <Icon name="chevron" size={14} />
        <span>{product.name}</span>
      </div>
      <section className="detail-layout">
        <div className="gallery">
          <div className="main-photo">
            <img
              key={photo}
              src={productPhotos[photo]}
              alt={`${product.name}, vista ${photo + 1}`}
            />
            <span>Fotografía del equipo</span>
          </div>
          <div className="thumbnails">
            {productPhotos.map((img, i) => (
              <button
                key={img}
                className={photo === i ? "active" : ""}
                onClick={() => setPhoto(i)}
              >
                <img src={img} alt="Vista del producto" />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <div className="detail-title">
            <StatusBadge status={product.status} />
            <span className="sku">{product.id}</span>
            <h1>{product.name}</h1>
            <p>{product.condition}</p>
            <strong>
              {mxn(product.price)} <small>MXN</small>
            </strong>
          </div>
          <p className="detail-description">{product.description}</p>
          <div className="spec-grid">
            {specs.map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="detail-actions">
            <Button onClick={onBuy} disabled={product.status !== "Disponible"}>
              {product.status === "Disponible"
                ? "Comprar ahora"
                : "No disponible"}
            </Button>
            <Button
              variant="secondary"
              icon="phone"
              onClick={() =>
                window.open(
                  `https://wa.me/5215500000000?text=${encodeURIComponent(`Hola, me interesa el ${product.name} (${product.id}).`)}`,
                  "_blank",
                )
              }
            >
              Consultar por WhatsApp
            </Button>
          </div>
          <div className="request-note">
            <Icon name="info" size={18} />
            <p>
              Enviar una solicitud no procesa un pago ni garantiza una reserva.
              Confirmaremos la disponibilidad contigo.
            </p>
          </div>
        </div>
      </section>
      <section className="related">
        <div className="related-heading">
          <div>
            <span className="eyebrow">También podrían gustarte</span>
            <h2>Otros equipos seleccionados</h2>
          </div>
          <Button variant="ghost" icon="arrow" onClick={onBack}>
            Ver catálogo
          </Button>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => p.id !== product.id)
            .slice(0, 3)
            .map((p) => (
              <ProductCard product={p} key={p.id} onOpen={() => onSelect(p)} />
            ))}
        </div>
      </section>
    </main>
  )
}

function Checkout({
  product,
  onBack,
  onComplete,
}: {
  product: Product
  onBack: () => void
  onComplete: (name: string) => void
}) {
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    onComplete(String(data.get("name")))
  }
  return (
    <main className="checkout page-enter">
      <nav className="simple-nav">
        <button className="icon-button" onClick={onBack}>
          <Icon name="arrow" />
          <span>Volver</span>
        </button>
        <Logo />
      </nav>
      <section className="checkout-layout">
        <div className="checkout-intro">
          <span className="eyebrow">Solicitud de compra</span>
          <h1>Estás a un paso.</h1>
          <p>
            Déjanos tus datos para confirmar la disponibilidad y coordinar
            contigo los siguientes pasos.
          </p>
          <div className="mini-product">
            <img src={product.image} alt={product.name} />
            <div>
              <span>{product.id}</span>
              <h3>{product.name}</h3>
              <p>
                {product.storage} · {product.color}
              </p>
              <strong>{mxn(product.price)}</strong>
            </div>
          </div>
          <div className="secure-note">
            <Icon name="shield" />
            <p>Tus datos se usarán únicamente para atender esta solicitud.</p>
          </div>
        </div>
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-heading">
            <span>01</span>
            <div>
              <h2>Datos de contacto</h2>
              <p>Campos marcados con * son obligatorios.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field label="Nombre completo" placeholder="Tu nombre" required>
              <input name="name" placeholder="Tu nombre" required />
            </Field>
            <Field
              label="Número de teléfono"
              placeholder="55 0000 0000"
              type="tel"
              required
            />
            <Field
              label="Correo electrónico"
              placeholder="nombre@correo.com"
              type="email"
            />
            <Field label="Método de entrega" required>
              <select required>
                <option>Seleccionar una opción</option>
                <option>Entrega en punto acordado</option>
                <option>Envío nacional</option>
              </select>
            </Field>
          </div>
          <Field label="Comentarios adicionales">
            <textarea placeholder="¿Hay algo más que debamos saber?" rows={4} />
          </Field>
          <label className="check-row">
            <input type="checkbox" required />
            <span>
              Confirmo que mis datos son correctos y entiendo que esta solicitud
              está sujeta a confirmación.
            </span>
          </label>
          <Button type="submit" icon="arrow" className="wide">
            Enviar solicitud
          </Button>
        </form>
      </section>
    </main>
  )
}

function Success({
  product,
  name,
  onCatalog,
}: {
  product: Product
  name: string
  onCatalog: () => void
}) {
  return (
    <main className="success page-enter">
      <Logo />
      <div className="success-card">
        <span className="success-icon">
          <Icon name="check" size={30} />
        </span>
        <span className="eyebrow">Solicitud enviada</span>
        <h1>Gracias, {name || "hemos recibido tus datos"}.</h1>
        <p>
          Verificaremos disponibilidad y condiciones de entrega. Nos pondremos
          en contacto contigo a la brevedad.
        </p>
        <div className="folio">
          <span>Folio de referencia</span>
          <strong>VC-2025-0184</strong>
        </div>
        <div className="confirmation-product">
          <div>
            <span>Producto</span>
            <strong>
              {product.name} · {product.storage}
            </strong>
          </div>
          <div>
            <span>Precio de referencia</span>
            <strong>{mxn(product.price)}</strong>
          </div>
          <div>
            <span>Estado</span>
            <StatusBadge status="Pendiente de confirmación" />
          </div>
        </div>
        <div className="request-note">
          <Icon name="info" />
          <p>
            Esta solicitud no representa un pago ni una reserva garantizada.
          </p>
        </div>
        <div className="success-actions">
          <Button onClick={onCatalog}>Volver al catálogo</Button>
          <Button variant="secondary" icon="phone">
            Contactar por WhatsApp
          </Button>
        </div>
      </div>
    </main>
  )
}

function AdminLogin({
  onLogin,
  onBack,
}: {
  onLogin: () => void
  onBack: () => void
}) {
  const [show, setShow] = useState(false)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onLogin()
  }
  return (
    <main className="admin-login page-enter">
      <div className="login-brand">
        <Logo />
        <button className="text-link" onClick={onBack}>
          Volver a la tienda
        </button>
      </div>
      <section className="login-card">
        <span className="eyebrow">Acceso privado</span>
        <h1>Bienvenido de nuevo.</h1>
        <p>Ingresa tus datos para administrar VentaCelulares.</p>
        <form onSubmit={submit}>
          <Field
            label="Correo electrónico"
            type="email"
            placeholder="admin@ventacelulares.mx"
            required
          />
          <Field label="Contraseña" required>
            <div className="password-field">
              <input
                type={show ? "text" : "password"}
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShow(!show)}>
                <Icon name="eye" />
              </button>
            </div>
          </Field>
          <div className="login-helper">
            <label>
              <input type="checkbox" /> Recordarme
            </label>
            <button type="button">¿Olvidaste tu contraseña?</button>
          </div>
          <Button type="submit" className="wide">
            Iniciar sesión
          </Button>
        </form>
        <span className="demo-note">
          Prototipo demostrativo · Puedes ingresar con cualquier dato
        </span>
      </section>
    </main>
  )
}

const adminNav: { id: AdminView label: string icon: string }[] = [
  { id: "dashboard", label: "Resumen", icon: "grid" },
  { id: "products", label: "Productos", icon: "box" },
  { id: "inventory", label: "Inventario", icon: "chart" },
  { id: "orders", label: "Pedidos", icon: "orders" },
  { id: "sales", label: "Ventas", icon: "chart" },
  { id: "notices", label: "Avisos", icon: "info" },
  { id: "settings", label: "Configuración", icon: "settings" },
]

function AdminShell({
  active,
  setActive,
  onLogout,
  children,
}: {
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
              {item.id === "orders" && <b>4</b>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-profile">
            <span>AM</span>
            <div>
              <strong>Andrea M.</strong>
              <small>Administradora</small>
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
            <Icon name="search" />
            <input placeholder="Buscar en el panel..." />
            <kbd>⌘ K</kbd>
          </div>
          <div className="admin-date">
            <span>Datos demostrativos</span>
            <strong>Actualizado hoy</strong>
          </div>
          <span className="avatar">AM</span>
        </header>
        {children}
      </section>
    </main>
  )
}

function PageTitle({
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

function Dashboard() {
  const stats = [
    ["Ventas registradas", "28", "+12% vs. mes anterior"],
    ["Ingresos del mes", "$384,720", "+8.4% vs. mes anterior"],
    ["iPhones disponibles", "16", "de 24 unidades"],
    ["Pedidos pendientes", "4", "Requieren atención"],
  ]
  const orders = [
    [
      "#VC-0184",
      "Mariana López",
      "iPhone 15 Pro",
      "Hoy, 10:24",
      "$22,990",
      "Pendiente",
    ],
    [
      "#VC-0183",
      "Daniel Torres",
      "iPhone 14 Pro Max",
      "Ayer, 18:40",
      "$19,490",
      "Confirmado",
    ],
    [
      "#VC-0182",
      "Sofía Reyes",
      "iPhone 13",
      "Ayer, 12:15",
      "$10,990",
      "Completado",
    ],
    [
      "#VC-0181",
      "Carlos Vega",
      "iPhone 15",
      "14 may, 16:02",
      "$16,990",
      "Cancelado",
    ],
  ]
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Vista general"
        title="Panel de administración"
        description="Gestiona tu catálogo, inventario y ventas desde un solo lugar."
        action={<Button icon="plus">Agregar producto</Button>}
      />
      <div className="stat-grid">
        {stats.map((s, i) => (
          <article className="stat-card" key={s[0]}>
            <div>
              <span>{s[0]}</span>
              <Icon name={["chart", "chart", "box", "orders"][i]} />
            </div>
            <strong>{s[1]}</strong>
            <p className={i === 3 ? "attention" : ""}>{s[2]}</p>
          </article>
        ))}
      </div>
      <div className="analytics-grid">
        <article className="chart-card sales-chart">
          <div className="card-title">
            <div>
              <h3>Evolución de ventas</h3>
              <p>Ingresos de los últimos 6 meses</p>
            </div>
            <select>
              <option>6 meses</option>
            </select>
          </div>
          <div className="chart-total">
            <strong>$384,720</strong>
            <span>+8.4%</span>
          </div>
          <div className="bars">
            {[34, 48, 43, 67, 58, 88].map((h, i) => (
              <div key={i}>
                <i style={{ height: `${h}%` }} />
                <span>{["Dic", "Ene", "Feb", "Mar", "Abr", "May"][i]}</span>
              </div>
            ))}
          </div>
        </article>
        <article className="chart-card inventory-chart">
          <div className="card-title">
            <div>
              <h3>Estado del inventario</h3>
              <p>24 unidades totales</p>
            </div>
          </div>
          <div className="donut">
            <div>
              <strong>24</strong>
              <span>Equipos</span>
            </div>
          </div>
          <div className="legend">
            <p>
              <i className="available" />
              Disponibles <strong>16</strong>
            </p>
            <p>
              <i className="reserved" />
              Reservados <strong>5</strong>
            </p>
            <p>
              <i className="sold" />
              Vendidos <strong>3</strong>
            </p>
          </div>
        </article>
      </div>
      <article className="table-card">
        <div className="card-title">
          <div>
            <h3>Pedidos recientes</h3>
            <p>Solicitudes más recientes · Datos demostrativos</p>
          </div>
          <Button variant="ghost" icon="arrow">
            Ver todos
          </Button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Folio",
                  "Cliente",
                  "Producto",
                  "Fecha",
                  "Importe",
                  "Estado",
                  "",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={cell}>
                      {i === 5 ? <StatusBadge status={cell} /> : cell}
                    </td>
                  ))}
                  <td>
                    <button className="row-action">•••</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}

function ProductsAdmin({
  products,
  setProducts,
}: {
  products: Product[]
  setProducts: (p: Product[]) => void
}) {
  const [modal, setModal] = useState(false)
  const [toast, setToast] = useState("")
  const remove = (id: string) => {
    if (confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      setProducts(products.filter((p) => p.id !== id))
      setToast("Producto eliminado")
    }
  }
  const create = (e: FormEvent) => {
    e.preventDefault()
    setProducts([
      {
        ...initialProducts[0],
        id: `VC-00${products.length + 1}`,
        name: "iPhone 15 Plus",
        price: 17990,
      },
      ...products,
    ])
    setModal(false)
    setToast("Producto publicado correctamente")
    setTimeout(() => setToast(""), 2600)
  }
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Catálogo"
        title="Productos"
        description={`${products.length} equipos registrados · ${products.filter((p) => p.status === "Disponible").length} publicados`}
        action={
          <Button icon="plus" onClick={() => setModal(true)}>
            Agregar producto
          </Button>
        }
      />
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input placeholder="Buscar producto..." />
        </label>
        <Button variant="secondary">Filtrar</Button>
        <Button variant="secondary">Exportar</Button>
      </div>
      <article className="table-card">
        <div className="table-scroll">
          <table className="product-table">
            <thead>
              <tr>
                {[
                  "Producto",
                  "Capacidad",
                  "Condición",
                  "Precio",
                  "Disponibilidad",
                  "Publicación",
                  "Acciones",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.image} />
                      <div>
                        <strong>{p.name}</strong>
                        <span>
                          {p.id} · {p.color}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{p.storage}</td>
                  <td>{p.condition.split(" · ")[1]}</td>
                  <td>
                    <strong>{mxn(p.price)}</strong>
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>14 may 2025</td>
                  <td>
                    <div className="table-actions">
                      <button title="Editar" onClick={() => setModal(true)}>
                        <Icon name="edit" size={17} />
                      </button>
                      <button title="Eliminar" onClick={() => remove(p.id)}>
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      {modal && (
        <div className="modal-backdrop" onMouseDown={() => setModal(false)}>
          <div
            className="product-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header>
              <div>
                <span className="eyebrow">Nuevo registro</span>
                <h2>Agregar producto</h2>
                <p>Registra una unidad con sus características particulares.</p>
              </div>
              <button className="modal-close" onClick={() => setModal(false)}>
                <Icon name="close" />
              </button>
            </header>
            <form onSubmit={create}>
              <h3>Información general</h3>
              <div className="form-grid">
                <Field
                  label="Modelo"
                  placeholder="Ej. iPhone 15 Pro"
                  required
                />
                <Field label="Almacenamiento" required>
                  <select>
                    <option>128 GB</option>
                    <option>256 GB</option>
                    <option>512 GB</option>
                  </select>
                </Field>
                <Field
                  label="Color"
                  placeholder="Ej. Titanio natural"
                  required
                />
                <Field label="Condición" required>
                  <select>
                    <option>Seminuevo · Excelente</option>
                    <option>Nuevo · Caja abierta</option>
                    <option>Seminuevo · Bueno</option>
                  </select>
                </Field>
              </div>
              <h3>Información comercial</h3>
              <div className="form-grid">
                <Field
                  label="Precio (MXN)"
                  type="number"
                  placeholder="0.00"
                  required
                />
                <Field label="Disponibilidad">
                  <select>
                    <option>Disponible</option>
                    <option>Reservado</option>
                    <option>Vendido</option>
                  </select>
                </Field>
                <Field label="Salud de batería" placeholder="Ej. 96%" />
                <Field
                  label="Código interno"
                  defaultValue={`VC-00${products.length + 1}`}
                />
              </div>
              <div className="upload-box">
                <Icon name="upload" />
                <strong>Arrastra las fotografías aquí</strong>
                <span>JPG o PNG · Máximo 8 MB</span>
              </div>
              <footer>
                <Button variant="secondary" onClick={() => setModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Publicar producto</Button>
              </footer>
            </form>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast">
          <Icon name="check" />
          {toast}
        </div>
      )}
    </div>
  )
}

function Inventory({
  products,
  setProducts,
}: {
  products: Product[]
  setProducts: (p: Product[]) => void
}) {
  const update = (id: string, status: Status) =>
    setProducts(products.map((p) => (p.id === id ? { ...p, status } : p)))
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow="Control de unidades"
        title="Inventario"
        description="Actualiza la disponibilidad. Los cambios se reflejan en el catálogo público."
      />
      <div className="stat-grid compact">
        {[
          ["Total de unidades", products.length],
          [
            "Disponibles",
            products.filter((p) => p.status === "Disponible").length,
          ],
          [
            "Reservadas",
            products.filter((p) => p.status === "Reservado").length,
          ],
          ["Vendidas", products.filter((p) => p.status === "Vendido").length],
        ].map((x) => (
          <article className="stat-card" key={x[0]}>
            <span>{x[0]}</span>
            <strong>{x[1]}</strong>
          </article>
        ))}
      </div>
      <article className="table-card">
        <div className="card-title">
          <div>
            <h3>Unidades registradas</h3>
            <p>Actualización rápida de estado</p>
          </div>
          <label className="search-box">
            <Icon name="search" />
            <input placeholder="Buscar unidad..." />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Código</th>
                <th>Batería</th>
                <th>Estado actual</th>
                <th>Actualizar estado</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.image} />
                      <strong>
                        {p.name} · {p.storage}
                      </strong>
                    </div>
                  </td>
                  <td>{p.id}</td>
                  <td>{p.battery}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>
                    <select
                      value={p.status}
                      onChange={(e) => update(p.id, e.target.value as Status)}
                    >
                      <option>Disponible</option>
                      <option>Reservado</option>
                      <option>Vendido</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}

function GenericAdminPage({
  type,
}: {
  type: "orders" | "sales" | "notices" | "settings"
}) {
  if (type === "settings" || type === "notices")
    return (
      <div className="admin-content page-enter">
        <PageTitle
          eyebrow={type === "settings" ? "Preferencias" : "Contenido editable"}
          title={
            type === "settings" ? "Configuración general" : "Avisos comerciales"
          }
          description={
            type === "settings"
              ? "Administra la información pública y los datos de contacto."
              : "Actualiza los mensajes informativos que ven tus clientes."
          }
          action={<Button>Guardar cambios</Button>}
        />
        <form className="settings-card">
          <div className="settings-section">
            <div>
              <h3>
                {type === "settings"
                  ? "Identidad del negocio"
                  : "Contenido de avisos"}
              </h3>
              <p>
                {type === "settings"
                  ? "Información principal visible para tus clientes."
                  : "Comunica condiciones de forma clara y responsable."}
              </p>
            </div>
            <div className="settings-fields">
              {type === "settings" ? (
                <>
                  <Field
                    label="Nombre del negocio"
                    defaultValue="VentaCelulares"
                  />
                  <Field
                    label="Número de WhatsApp"
                    defaultValue="+52 55 0000 0000"
                  />
                  <Field
                    label="Correo de contacto"
                    defaultValue="hola@ventacelulares.mx"
                  />
                  <Field
                    label="Horario de atención"
                    defaultValue="Lun–Sáb · 10:00 a 19:00"
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Encabezado"
                    defaultValue="Transparencia en cada detalle."
                  />
                  <Field
                    label="Aviso 1"
                    defaultValue="Equipos no reacondicionados"
                  />
                  <Field
                    label="Aviso 2"
                    defaultValue="Estado físico detallado"
                  />
                  <Field
                    label="Aviso 3"
                    defaultValue="Compra con información clara"
                  />
                </>
              )}
            </div>
          </div>
          <div className="settings-section">
            <div>
              <h3>Información comercial</h3>
              <p>Textos que acompañan el proceso de compra.</p>
            </div>
            <div className="settings-fields full">
              <Field label="Condiciones de garantía">
                <textarea
                  rows={5}
                  defaultValue="La garantía y sus condiciones se especifican de forma individual para cada equipo."
                />
              </Field>
              <Field label="Información sobre entregas">
                <textarea
                  rows={5}
                  defaultValue="Las opciones de entrega se confirman directamente con cada cliente."
                />
              </Field>
            </div>
          </div>
          <footer>
            <Button variant="secondary">Cancelar</Button>
            <Button>Guardar cambios</Button>
          </footer>
        </form>
      </div>
    )
  const isSales = type === "sales"
  const rows = isSales
    ? [
        [
          "18 may 2025",
          "iPhone 15 Pro",
          "Laura Medina",
          "$22,490",
          "Transferencia",
          "#VC-0176",
        ],
        [
          "16 may 2025",
          "iPhone 13",
          "Sofía Reyes",
          "$10,990",
          "Efectivo",
          "#VC-0171",
        ],
        [
          "12 may 2025",
          "iPhone 14 Pro",
          "Manuel Ruiz",
          "$17,800",
          "Transferencia",
          "#VC-0168",
        ],
      ]
    : [
        [
          "#VC-0184",
          "Mariana López",
          "iPhone 15 Pro",
          "Hoy, 10:24",
          "$22,990",
          "Pendiente",
        ],
        [
          "#VC-0183",
          "Daniel Torres",
          "iPhone 14 Pro Max",
          "Ayer, 18:40",
          "$19,490",
          "Confirmado",
        ],
        [
          "#VC-0182",
          "Sofía Reyes",
          "iPhone 13",
          "Ayer, 12:15",
          "$10,990",
          "Completado",
        ],
      ]
  return (
    <div className="admin-content page-enter">
      <PageTitle
        eyebrow={isSales ? "Historial comercial" : "Solicitudes"}
        title={isSales ? "Ventas" : "Pedidos"}
        description={
          isSales
            ? "Consulta las ventas completadas y el resumen de ingresos."
            : "Da seguimiento a cada solicitud y actualiza su estado."
        }
        action={
          isSales ? (
            <Button variant="secondary">Exportar reporte</Button>
          ) : undefined
        }
      />
      {isSales && (
        <div className="stat-grid compact">
          <article className="stat-card">
            <span>Ingresos este mes</span>
            <strong>$384,720</strong>
            <p>28 ventas registradas</p>
          </article>
          <article className="stat-card">
            <span>Ticket promedio</span>
            <strong>$13,740</strong>
            <p>+4.2% este mes</p>
          </article>
        </div>
      )}
      <div className="admin-toolbar">
        <label className="search-box">
          <Icon name="search" />
          <input placeholder={`Buscar ${isSales ? "venta" : "pedido"}...`} />
        </label>
        <Button variant="secondary">Filtrar por fecha</Button>
        <Button variant="secondary">Estado</Button>
      </div>
      <article className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {(isSales
                  ? [
                      "Fecha",
                      "Producto",
                      "Cliente",
                      "Precio de venta",
                      "Método de pago",
                      "Folio",
                    ]
                  : [
                      "Folio",
                      "Cliente",
                      "Producto",
                      "Fecha",
                      "Importe",
                      "Estado",
                    ]
                ).map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {r.map((x, j) => (
                    <td key={x}>
                      {!isSales && j === 5 ? <StatusBadge status={x} /> : x}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState<PublicView | "admin-login" | "admin">(
    "welcome",
  )
  const [adminView, setAdminView] = useState<AdminView>("dashboard")
  const [products, setProducts] = useState(initialProducts)
  const [selected, setSelected] = useState(initialProducts[0])
  const [customerName, setCustomerName] = useState("")
  const openProduct = (p: Product) => {
    setSelected(p)
    setView("detail")
    window.scrollTo(0, 0)
  }
  if (view === "welcome")
    return (
      <Welcome
        onNext={() => setView("notices")}
        onSkip={() => setView("catalog")}
      />
    )
  if (view === "notices")
    return (
      <Notices
        onContinue={() => setView("catalog")}
        onBack={() => setView("welcome")}
      />
    )
  if (view === "catalog")
    return (
      <Catalog
        products={products}
        onSelect={openProduct}
        goAdmin={() => setView("admin-login")}
      />
    )
  if (view === "detail")
    return (
      <Detail
        product={selected}
        products={products}
        onBack={() => setView("catalog")}
        onBuy={() => setView("checkout")}
        onSelect={openProduct}
        goAdmin={() => setView("admin-login")}
      />
    )
  if (view === "checkout")
    return (
      <Checkout
        product={selected}
        onBack={() => setView("detail")}
        onComplete={(name) => {
          setCustomerName(name)
          setView("success")
        }}
      />
    )
  if (view === "success")
    return (
      <Success
        product={selected}
        name={customerName}
        onCatalog={() => setView("catalog")}
      />
    )
  if (view === "admin-login")
    return (
      <AdminLogin
        onLogin={() => setView("admin")}
        onBack={() => setView("catalog")}
      />
    )
  return (
    <AdminShell
      active={adminView}
      setActive={setAdminView}
      onLogout={() => setView("catalog")}
    >
      {adminView === "dashboard" && <Dashboard />}
      {adminView === "products" && (
        <ProductsAdmin products={products} setProducts={setProducts} />
      )}
      {adminView === "inventory" && (
        <Inventory products={products} setProducts={setProducts} />
      )}
      {(adminView === "orders" ||
        adminView === "sales" ||
        adminView === "notices" ||
        adminView === "settings") && <GenericAdminPage type={adminView} />}
    </AdminShell>
  )
}
