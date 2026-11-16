/** Contrato público para el feed de Instagram servido por el backend. */

export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | "REELS"

export type InstagramProfile = {
  username: string
  name: string
  profilePictureUrl?: string | null
  biography?: string | null
  profileUrl: string
}

export type InstagramPost = {
  id: string
  mediaType: InstagramMediaType
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  permalink: string
  caption?: string | null
  timestamp?: string | null
}

export type InstagramFeedResponse = {
  configured: boolean
  profile: InstagramProfile | null
  posts: InstagramPost[]
}
