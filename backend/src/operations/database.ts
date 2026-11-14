import { fileURLToPath } from "node:url";
/** All Supabase connections verify both the CA and the pooler hostname. */
export function secureDatabaseUrl(connection: string) {
  const url = new URL(connection);
  if (url.hostname.endsWith(".supabase.com")) {
    url.searchParams.set("sslmode", "verify-full");
    if (!url.searchParams.has("sslrootcert")) url.searchParams.set("sslrootcert", fileURLToPath(new URL("../../certs/supabase-root-2021.crt", import.meta.url)));
  } else if (process.env.NODE_ENV === "production" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}
