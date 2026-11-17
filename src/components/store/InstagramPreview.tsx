import { Icon } from "@/components/ui";
import { commercialConfig } from "@/config/commercial";

export function InstagramPreview() {
  let username = "alexxzino_store";
  try {
    const url = new URL(
      commercialConfig.social.instagram ||
        "https://www.instagram.com/alexxzino_store/",
    );
    const handle = url.pathname.split("/").filter(Boolean)[0] || "";
    if (
      ["instagram.com", "www.instagram.com"].includes(url.hostname) &&
      /^[A-Za-z0-9._]{1,30}$/.test(handle)
    )
      username = handle;
  } catch {
    /* Keep the configured business profile as fallback. */
  }
  const profileUrl = `https://www.instagram.com/${username}/`;
  return (
    <article className="contact-card social-preview ig-preview">
      <header className="social-preview-header ig-preview-header">
        <h2 className="footer-heading">Instagram</h2>
        <span
          className="social-preview-brand-icon ig-preview-brand-icon"
          aria-hidden="true"
        >
          <Icon name="instagram" size={18} />
        </span>
      </header>
      <div className="social-preview-profile ig-preview-profile">
        <span
          className="social-preview-avatar ig-preview-avatar ig-preview-avatar-fallback"
          aria-hidden="true"
        >
          <Icon name="instagram" size={20} />
        </span>
        <div className="social-preview-profile-copy ig-preview-profile-copy">
          <p className="social-preview-name ig-preview-name">
            {commercialConfig.businessName}
          </p>
          <p className="social-preview-username ig-preview-username">
            @{username}
          </p>
        </div>
        <a
          className="social-preview-profile-link ig-preview-profile-link"
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver perfil de Instagram (se abre en una pestaña nueva)"
        >
          Ver perfil
        </a>
      </div>
      <div
        className="ig-profile-embed"
        aria-label={`Publicaciones de @${username}`}
      >
        <iframe
          title={`Perfil de Instagram de @${username}`}
          src={`${profileUrl}embed/`}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="ig-profile-frame"
        />
      </div>
      <p className="ig-preview-note">
        Si Instagram no muestra la vista previa en tu navegador, abre el perfil
        para ver las publicaciones.
      </p>
      <a
        className="btn btn-secondary social-preview-cta ig-preview-cta"
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Síguenos en Instagram (se abre en una pestaña nueva)"
      >
        <Icon name="instagram" size={18} />
        <span>Síguenos en Instagram</span>
      </a>
    </article>
  );
}
