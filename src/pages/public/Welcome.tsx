import { Icon, Logo } from "@/components/ui"
import { welcomeImage } from "@/config/media"
import { useRef } from "react"

export function Welcome({
  onNext,
  onSkip,
  embedded = false,
}: {
  onNext: () => void
  onSkip: () => void
  embedded?: boolean
  enabled?: boolean
}) {
  const rootRef = useRef<HTMLElement>(null)
  const Root = embedded ? "section" : "main"
  return (
    <Root
      ref={rootRef}
      id={embedded ? undefined : "main-content"}
      className={`welcome${embedded ? " welcome--embedded" : " page-enter"}`}
      aria-label={embedded ? "Bienvenida" : undefined}
    >
      <div className="welcome-glow" aria-hidden="true" />
      <header className="welcome-top">
        <Logo onClick={onSkip} />
      </header>
      <div className="welcome-copy welcome-copy--enter">
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
        <button
          type="button"
          className="welcome-scroll"
          onClick={onNext}
          aria-label="Desliza hacia abajo para continuar"
        >
          <span className="welcome-scroll-label">Desliza</span>
          <span className="welcome-scroll-cue" aria-hidden="true">
            <span className="welcome-scroll-line" />
            <Icon name="chevron" size={16} />
          </span>
        </button>
        <span className="microcopy">Equipos nuevos y seminuevos</span>
      </div>
      <div className="hero-product">
        <div className="hero-orbit" aria-hidden="true" />
        <img
          src={welcomeImage}
          alt="iPhone en iluminación de estudio"
          width={1200}
          height={800}
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </Root>
  )
}
