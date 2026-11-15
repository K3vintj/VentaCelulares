import { legalContent } from "@/config/legal"
import type { LegalDocument } from "@/config/legal"
import { LegalLink } from "./LegalLink"

export function LegalArticle({ document, titleId, compact = false, onResetNotice }: {
  document: LegalDocument
  titleId: string
  compact?: boolean
  onResetNotice: () => void
}) {
  const content = legalContent[document]
  return (
    <article className={`legal-article${compact ? " legal-article-compact" : ""}`}>
      <header className="legal-hero">
        <span className="eyebrow">{content.title}</span>
        <h1 id={titleId}>{content.lead}<br /><em>{content.accent}</em></h1>
        <p>{content.description}</p>
        <div className="legal-meta"><span>Versión informativa</span><span>Actualizado el {legalContent.updatedLabel}</span></div>
      </header>
      <div className="legal-layout">
        <nav className="legal-index" aria-label={`Contenido: ${content.title}`}>
          <span className="eyebrow">En esta página</span>
          {content.sections.map((section, index) => (
            <a key={section.id} href={`#${titleId}-${section.id}`} onClick={(event) => {
              event.preventDefault()
              const target = window.document.getElementById(`${titleId}-${section.id}`)
              target?.scrollIntoView({ behavior: "instant", block: "start" })
              target?.focus({ preventScroll: true })
            }}><span>{String(index + 1).padStart(2, "0")}</span>{section.title}</a>
          ))}
        </nav>
        <div className="legal-sections">
          {content.sections.map((section, index) => (
            <section className="legal-section" key={section.id} id={`${titleId}-${section.id}`} tabIndex={-1}>
              <span className="legal-section-number">{String(index + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {document === "cookies" && index === 0 && (
                <div className="legal-table-wrap">
                  <table className="legal-table">
                    <caption>Almacenamiento utilizado por la aplicación</caption>
                    <thead><tr><th scope="col">Nombre</th><th scope="col">Uso</th><th scope="col">Duración</th></tr></thead>
                    <tbody>
                      <tr><th scope="row"><code>vc_session</code><small>Cookie propia · necesaria</small></th><td>Mantener la sesión del administrador. HttpOnly, SameSite=Lax y Secure en el sitio HTTPS.</td><td>Hasta 12 horas; se revoca al cerrar sesión o cambiar la contraseña.</td></tr>
                      <tr><th scope="row"><code>vc_cookie_notice_v1</code><small>Almacenamiento local · preferencia</small></th><td>Recordar que cerraste el aviso informativo, solo en este navegador.</td><td>180 días desde que pulsas «Entendido».</td></tr>
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
          {document === "cookies" && (
            <button type="button" className="btn btn-secondary" onClick={onResetNotice}>Volver a mostrar el aviso de cookies</button>
          )}
          <div className="legal-related">
            <span>También puedes consultar</span>
            <LegalLink document={document === "privacy" ? "cookies" : "privacy"} />
          </div>
        </div>
      </div>
    </article>
  )
}
