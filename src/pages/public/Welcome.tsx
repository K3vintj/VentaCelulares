import { Button, Logo } from "@/components/ui"
import { welcomeImage } from "@/config/media"

export function Welcome({
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
        <Logo onClick={onSkip} />
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
        <Button variant="gold" icon="arrow" onClick={onNext}>
          Siguiente
        </Button>
        <span className="microcopy">Equipos nuevos y seminuevos</span>
      </div>
      <div className="hero-product">
        <div className="hero-orbit" />
        <img src={welcomeImage} alt="iPhone en iluminación de estudio" />
        <div className="hero-caption">
          <span>Selección 01</span>
          <strong>Diseño que destaca.</strong>
        </div>
      </div>
    </main>
  )
}
