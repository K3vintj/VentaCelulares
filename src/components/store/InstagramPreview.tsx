import { Icon } from "@/components/ui"
import { Skeleton } from "@/components/ui/Skeleton"
import { commercialConfig } from "@/config/commercial"
import { ApiError, api } from "@/services/api"
import type {
  InstagramFeedResponse,
  InstagramMediaType,
  InstagramPost,
  InstagramProfile,
} from "@/types/instagram"
import { useCallback, useEffect, useRef, useState } from "react"

type PreviewStatus =
  | "loading"
  | "success"
  | "empty"
  | "error"
  | "not_configured"

type PreviewState = {
  status: PreviewStatus
  profile: InstagramProfile | null
  posts: InstagramPost[]
  message: string
}

const mediaBadge = (type: InstagramMediaType) => {
  if (type === "VIDEO" || type === "REELS") return "Reel"
  if (type === "CAROUSEL_ALBUM") return "Álbum"
  return null
}

const postImageSrc = (post: InstagramPost) =>
  post.thumbnailUrl || post.mediaUrl || ""

const InstagramSkeleton = () => (
  <div className="ig-preview-skeleton" aria-hidden="true">
    <div className="ig-preview-profile">
      <Skeleton circle width={48} height={48} />
      <div className="ig-preview-profile-copy">
        <Skeleton width="42%" height={12} radius={4} />
        <Skeleton width="58%" height={10} radius={4} />
      </div>
    </div>
    <div className="ig-preview-grid">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton
          key={`ig-skel-${index}`}
          className="ig-preview-thumb-skel"
          radius={10}
        />
      ))}
    </div>
  </div>
)

const ProfileBlock = ({
  profile,
  profileUrl,
}: {
  profile: InstagramProfile | null
  profileUrl: string
}) => {
  const displayName = profile?.name || commercialConfig.businessName
  const username = profile?.username
    ? `@${profile.username.replace(/^@/, "")}`
    : usernameFromUrl(profileUrl)
  return (
    <div className="ig-preview-profile">
      {profile?.profilePictureUrl ? (
        <img
          className="ig-preview-avatar"
          src={profile.profilePictureUrl}
          alt={`Foto de perfil de ${displayName}`}
          width={48}
          height={48}
          loading="lazy"
        />
      ) : (
        <span className="ig-preview-avatar ig-preview-avatar-fallback" aria-hidden="true">
          <Icon name="instagram" size={20} />
        </span>
      )}
      <div className="ig-preview-profile-copy">
        <p className="ig-preview-name">{displayName}</p>
        <p className="ig-preview-username">{username}</p>
        {profile?.biography ? (
          <p className="ig-preview-bio">{profile.biography}</p>
        ) : null}
      </div>
      <a
        className="ig-preview-profile-link"
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Ver perfil de Instagram (se abre en una pestaña nueva)"
      >
        Ver perfil
      </a>
    </div>
  )
}

const PostsGrid = ({ posts }: { posts: InstagramPost[] }) => (
  <div className="ig-preview-posts">
    <h3 className="ig-preview-subtitle">Últimas publicaciones</h3>
    <ul className="ig-preview-grid">
      {posts.slice(0, 3).map((post) => {
        const src = postImageSrc(post)
        const badge = mediaBadge(post.mediaType)
        const label =
          post.caption?.trim() ||
          `Publicación de Instagram${badge ? `, ${badge}` : ""}`
        return (
          <li key={post.id}>
            <a
              className="ig-preview-thumb"
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${label} (se abre en una pestaña nueva)`}
            >
              {src ? (
                <img src={src} alt="" loading="lazy" />
              ) : (
                <span className="ig-preview-thumb-empty" aria-hidden="true">
                  <Icon name="instagram" size={18} />
                </span>
              )}
              {badge && (
                <span className="ig-preview-badge">
                  <span className="sr-only">Tipo de contenido: </span>
                  {badge}
                </span>
              )}
            </a>
          </li>
        )
      })}
    </ul>
  </div>
)

const usernameFromUrl = (url: string) => {
  try {
    const path = new URL(url).pathname.replace(/\//g, "")
    return path ? `@${path}` : "@alexxzino_store"
  } catch {
    return "@alexxzino_store"
  }
}

export function InstagramPreview() {
  const generation = useRef(0)
  const fallbackProfileUrl =
    commercialConfig.social.instagram || "https://www.instagram.com/"
  const [state, setState] = useState<PreviewState>({
    status: "loading",
    profile: null,
    posts: [],
    message: "",
  })
  const loadFeed = useCallback(async () => {
    const current = ++generation.current
    setState((prev) => ({ ...prev, status: "loading", message: "" }))
    try {
      const feed: InstagramFeedResponse = await api.instagramFeed()
      if (current !== generation.current) return
      if (!feed.configured || !feed.profile) {
        setState({
          status: "not_configured",
          profile: null,
          posts: [],
          message: "",
        })
        return
      }
      const posts = Array.isArray(feed.posts) ? feed.posts : []
      setState({
        status: posts.length > 0 ? "success" : "empty",
        profile: feed.profile,
        posts,
        message: "",
      })
    } catch (error) {
      if (current !== generation.current) return
      const status = error instanceof ApiError ? error.status : 0
      if (status === 404 || status === 501 || status === 503) {
        setState({
          status: "not_configured",
          profile: null,
          posts: [],
          message: "",
        })
        return
      }
      setState({
        status: "error",
        profile: null,
        posts: [],
        message:
          error instanceof Error
            ? error.message
            : "No se pudo cargar Instagram",
      })
    }
  }, [])
  useEffect(() => {
    void loadFeed()
    return () => {
      generation.current += 1
    }
  }, [loadFeed])
  const profileUrl = state.profile?.profileUrl || fallbackProfileUrl
  return (
    <article className="contact-card ig-preview" aria-busy={state.status === "loading"}>
      <header className="ig-preview-header">
        <h2 className="footer-heading">Redes sociales</h2>
        <span className="ig-preview-brand-icon" aria-hidden="true">
          <Icon name="instagram" size={18} />
        </span>
      </header>
      {state.status === "loading" && (
        <>
          <span className="sr-only">Cargando Instagram</span>
          <InstagramSkeleton />
        </>
      )}
      {state.status === "not_configured" && (
        <div className="ig-preview-fallback">
          <ProfileBlock profile={null} profileUrl={profileUrl} />
          <p className="ig-preview-note">
            Las publicaciones se mostrarán cuando el backend conecte Instagram.
          </p>
        </div>
      )}
      {state.status === "error" && (
        <div className="ig-preview-fallback" role="status">
          <ProfileBlock profile={null} profileUrl={profileUrl} />
          <p className="ig-preview-note">
            {state.message || "No se pudo cargar el feed de Instagram."}
          </p>
        </div>
      )}
      {(state.status === "success" || state.status === "empty") && (
        <>
          <ProfileBlock profile={state.profile} profileUrl={profileUrl} />
          {state.status === "success" ? (
            <PostsGrid posts={state.posts} />
          ) : (
            <p className="ig-preview-note">
              Todavía no hay publicaciones recientes para mostrar.
            </p>
          )}
        </>
      )}
      <a
        className="btn btn-secondary ig-preview-cta"
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Síguenos en Instagram (se abre en una pestaña nueva)"
      >
        <Icon name="instagram" size={18} />
        <span>Síguenos en Instagram</span>
      </a>
    </article>
  )
}
