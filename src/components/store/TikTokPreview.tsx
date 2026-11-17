import { Icon } from "@/components/ui"
import { commercialConfig } from "@/config/commercial"

const parseTikTokUsername = (value: string | null) => {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    if (host !== "tiktok.com" && host !== "vm.tiktok.com") return null
    const handle = url.pathname.split("/").filter(Boolean)[0] || ""
    const normalized = handle.startsWith("@") ? handle.slice(1) : handle
    if (!/^[A-Za-z0-9._]{1,24}$/.test(normalized)) return null
    return normalized
  } catch {
    return null
  }
}

export function TikTokPreview() {
  const configuredUrl = commercialConfig.social.tiktok
  const username = parseTikTokUsername(configuredUrl)
  const isConfigured = Boolean(configuredUrl && username)
  const profileUrl = isConfigured
    ? `https://www.tiktok.com/@${username}/`
    : null

  return (
    <article className="contact-card social-preview tt-preview">
      <header className="social-preview-header">
        <h2 className="footer-heading">TikTok</h2>
        <span className="social-preview-brand-icon" aria-hidden="true">
          <Icon name="tiktok" size={18} />
        </span>
      </header>
      <div className="social-preview-profile">
        <span
          className="social-preview-avatar social-preview-avatar-fallback"
          aria-hidden="true"
        >
          <Icon name="tiktok" size={20} />
        </span>
        <div className="social-preview-profile-copy">
          <p className="social-preview-name">{commercialConfig.businessName}</p>
          <p className="social-preview-username">
            {isConfigured ? `@${username}` : "Perfil pendiente de configurar"}
          </p>
        </div>
        {profileUrl ? (
          <a
            className="social-preview-profile-link"
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver perfil de TikTok (se abre en una pestaña nueva)"
          >
            Ver perfil
          </a>
        ) : (
          <span className="social-preview-status-badge" aria-label="Estado pendiente">
            Pendiente
          </span>
        )}
      </div>
      <div
        className={`social-preview-stage${isConfigured ? "" : " is-pending"}`}
        aria-label={
          isConfigured
            ? `Vista previa de TikTok de @${username}`
            : "Vista previa de TikTok pendiente"
        }
      >
        {isConfigured ? (
          <div className="social-preview-stage-ready">
            <Icon name="tiktok" size={28} />
            <p>
              Abre el perfil de TikTok para ver el contenido actualizado de la
              cuenta.
            </p>
          </div>
        ) : (
          <div className="social-preview-stage-pending">
            <Icon name="tiktok" size={28} />
            <p className="social-preview-stage-title">Próximamente</p>
            <p>
              El panel está listo. Cuando se configure el perfil oficial de
              TikTok, aquí se mostrará el acceso directo.
            </p>
          </div>
        )}
      </div>
      {profileUrl ? (
        <a
          className="btn btn-secondary social-preview-cta"
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Síguenos en TikTok (se abre en una pestaña nueva)"
        >
          <Icon name="tiktok" size={18} />
          <span>Síguenos en TikTok</span>
        </a>
      ) : (
        <button
          type="button"
          className="btn btn-secondary social-preview-cta"
          disabled
          aria-disabled="true"
        >
          <Icon name="tiktok" size={18} />
          <span>Síguenos en TikTok</span>
        </button>
      )}
    </article>
  )
}
