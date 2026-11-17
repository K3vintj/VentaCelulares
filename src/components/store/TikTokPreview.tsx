import { Icon } from "@/components/ui"
import { commercialConfig } from "@/config/commercial"
import { request } from "@/services/api"
import { useEffect, useState } from "react"

const parseTikTokUsername = (value: string | null) => {
  if (!value) return null
  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, "")
    if (url.protocol !== "https:" || url.username || url.password || url.port || host !== "tiktok.com") return null
    const handle = url.pathname.split("/").filter(Boolean)[0] || ""
    if (!handle.startsWith("@")) return null
    const normalized = handle.slice(1)
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
  const [name, setName] = useState(commercialConfig.businessName)
  useEffect(() => {
    if (!username) return
    const controller = new AbortController()
    request<{ profile: { username: string; name: string } }>("/tiktok/profile", { signal: controller.signal })
      .then(({ profile }) => {
        if (!controller.signal.aborted && profile.username === username && typeof profile.name === "string")
          setName(profile.name)
      })
      .catch(() => { /* The official iframe and profile link remain available. */ })
    return () => controller.abort()
  }, [username])

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
          <p className="social-preview-name">{name}</p>
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
        className={`social-preview-stage${isConfigured ? " tt-profile-embed" : " is-pending"}`}
        aria-label={
          isConfigured
            ? `Vista previa de TikTok de @${username}`
            : "Vista previa de TikTok pendiente"
        }
      >
        {isConfigured ? (
          <iframe
            className="tt-profile-frame"
            title={`Perfil de TikTok de @${username}`}
            src={`https://www.tiktok.com/embed/@${username}`}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          />
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
      {isConfigured && (
        <p className="ig-preview-note">
          Si TikTok no muestra la vista previa en tu navegador, abre el perfil
          para ver las publicaciones.
        </p>
      )}
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
