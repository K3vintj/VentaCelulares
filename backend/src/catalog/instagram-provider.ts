type Settings = { token?: string; username: string; version: string };
type Profile = {
  username: string;
  name: string;
  profileUrl: string;
  profilePictureUrl?: string;
};
type Post = {
  id: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  permalink: string;
  caption: string;
  timestamp?: string;
};
type Feed = { configured: boolean; profile: Profile | null; posts: Post[] };
const empty: Feed = { configured: false, profile: null, posts: [] };
const mediaUrl = (value: unknown) => {
  if (typeof value !== "string" || value.length > 4096) return undefined;
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      ["cdninstagram.com", "fbcdn.net"].some(
        (host) => u.hostname === host || u.hostname.endsWith(`.${host}`),
      )
      ? u.href
      : undefined;
  } catch {
    return undefined;
  }
};
export function createInstagramFeed(
  settings: Settings,
  request: typeof fetch = fetch,
  now = Date.now,
) {
  let cache: Feed | null = null,
    expires = 0,
    pending: Promise<Feed | null> | null = null;
  const read = async (): Promise<Feed | null> => {
    const signal = AbortSignal.timeout(8000);
    async function graph(path: string, fields: string) {
      const url = new URL(
        `https://graph.instagram.com/${settings.version}/${path}`,
      );
      url.searchParams.set("fields", fields);
      url.searchParams.set("limit", "3");
      const result = await request(url, {
        headers: { Authorization: `Bearer ${settings.token}` },
        signal,
        redirect: "error",
      });
      if (!result.ok) throw new Error("Instagram unavailable");
      const body = await result.text();
      if (body.length > 1_000_000)
        throw new Error("Instagram response too large");
      return JSON.parse(body);
    }
    try {
      const raw = await graph(
        "me",
        "user_id,username,name,profile_picture_url",
      );
      const profile = Array.isArray(raw.data) ? raw.data[0] : raw;
      if (
        !profile ||
        profile.username?.toLowerCase() !== settings.username.toLowerCase() ||
        !/^\d+$/.test(String(profile.user_id || profile.id))
      )
        throw new Error("Unexpected Instagram profile");
      const response = await graph(
        `${profile.user_id || profile.id}/media`,
        "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp",
      );
      if (!Array.isArray(response.data))
        throw new Error("Unexpected media response");
      const posts: Post[] = response.data
        .slice(0, 3)
        .flatMap((item: Record<string, unknown>) => {
          const image = mediaUrl(
            item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url,
          );
          if (
            !image ||
            typeof item.id !== "string" ||
            !["IMAGE", "VIDEO", "CAROUSEL_ALBUM"].includes(
              String(item.media_type),
            ) ||
            typeof item.permalink !== "string" ||
            !/^https:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?(?:\?.*)?$/.test(
              item.permalink,
            )
          )
            return [];
          return [
            {
              id: item.id,
              mediaType: String(item.media_type),
              mediaUrl: image,
              thumbnailUrl: image,
              permalink: item.permalink,
              caption:
                typeof item.caption === "string"
                  ? item.caption.slice(0, 2200)
                  : "",
              ...(typeof item.timestamp === "string"
                ? { timestamp: item.timestamp }
                : {}),
            },
          ];
        });
      return {
        configured: true,
        profile: {
          username: profile.username,
          name:
            typeof profile.name === "string"
              ? profile.name.slice(0, 150)
              : profile.username,
          profileUrl: `https://www.instagram.com/${settings.username}/`,
          profilePictureUrl: mediaUrl(profile.profile_picture_url),
        },
        posts,
      };
    } catch {
      return null;
    }
  };
  return async (): Promise<Feed | null> => {
    if (!settings.token) return empty;
    if (now() < expires) return cache;
    if (!pending)
      pending = read()
        .then((result) => {
          cache = result;
          expires = now() + (result ? 300_000 : 30_000);
          return result;
        })
        .finally(() => {
          pending = null;
        });
    return pending;
  };
}
