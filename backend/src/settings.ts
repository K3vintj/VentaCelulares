import { isIP } from "node:net";
import { z } from "zod";

export function readSettings(source: NodeJS.ProcessEnv) {
  const values = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    FRONTEND_URL: z.string().default(source.RENDER === "true" && source.RENDER_EXTERNAL_URL ? source.RENDER_EXTERNAL_URL : "http://localhost:8443"),
    COOKIE_SECURE: z.enum(["true", "false"]).default("false"),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default("products"),
    SERVE_FRONTEND: z.enum(["true", "false"]).default("false"),
    TRUST_PROXY: z.string().default("false"),
    LOG_REQUESTS: z.enum(["true", "false"]).optional(),
  }).parse(source);
  const origins = values.FRONTEND_URL.split(",").map((value) => {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) throw new Error("FRONTEND_URL debe contener orígenes, sin rutas ni credenciales");
    if (values.NODE_ENV === "production" && (url.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("Producción requiere un dominio HTTPS en FRONTEND_URL");
    return url.origin;
  });
  const proxy = values.TRUST_PROXY === "false" ? false : values.TRUST_PROXY.split(",").map((value) => value.trim());
  if (proxy && !proxy.every((value) => {
    if (["loopback", "linklocal", "uniquelocal"].includes(value)) return true;
    const [address, bits] = value.split("/");
    const family = isIP(address || "");
    return family !== 0 && (bits === undefined || (/^\d+$/.test(bits) && Number(bits) <= (family === 4 ? 32 : 128)));
  })) throw new Error("TRUST_PROXY debe ser false, una IP, una red CIDR o loopback");
  if (values.NODE_ENV === "production") {
    if (values.COOKIE_SECURE !== "true") throw new Error("COOKIE_SECURE debe ser true en producción");
    if (!values.SUPABASE_URL || !values.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Falta la configuración de Storage en producción");
    if (source.SEED_DEMO === "true") throw new Error("No se permite SEED_DEMO en producción");
  } else {
    origins.push("http://localhost:8443", "http://127.0.0.1:8443");
  }
  return { ...values, origins: [...new Set(origins)], proxy, logRequests: values.LOG_REQUESTS ? values.LOG_REQUESTS === "true" : values.NODE_ENV === "production" };
}
