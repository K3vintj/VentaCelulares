// Only the store's public account is queried; callers cannot supply a URL.
export const TIKTOK_USERNAME = "alexxzinostore";
const profileUrl = `https://www.tiktok.com/@${TIKTOK_USERNAME}`;
type Profile = { username: string; name: string; profileUrl: string; embedUrl: string };

export function createTikTokProfile(request: typeof fetch = fetch, now = Date.now) {
  let cached: Profile | null = null;
  let expires = 0;
  let pending: Promise<Profile | null> | null = null;
  const read = async (): Promise<Profile | null> => {
    try {
      const url = new URL("https://www.tiktok.com/oembed");
      url.searchParams.set("url", profileUrl);
      const response = await request(url, {
        signal: AbortSignal.timeout(8000), redirect: "error",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const text = await response.text();
      if (text.length > 100_000) return null;
      const raw = JSON.parse(text);
      if (raw.type !== "rich" || raw.provider_name !== "TikTok" ||
        typeof raw.author_url !== "string" || raw.author_url.replace(/\/$/, "") !== profileUrl ||
        typeof raw.author_name !== "string") return null;
      // Never execute or return the upstream HTML/script. The URL below is the
      // creator iframe used by TikTok's official embed loader.
      return {
        username: TIKTOK_USERNAME, name: raw.author_name.slice(0, 150), profileUrl,
        embedUrl: `https://www.tiktok.com/embed/@${TIKTOK_USERNAME}`,
      };
    } catch { return null; }
  };
  return async () => {
    if (now() < expires) return cached;
    if (!pending) pending = read().then((result) => {
      cached = result;
      expires = now() + (result ? 300_000 : 30_000);
      return result;
    }).finally(() => { pending = null; });
    return pending;
  };
}
