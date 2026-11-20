import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { configSchema, deliverySchema, orderSchema, productSchema, reservationSchema, statusSchema } from "../_shared/generated/validation.js"
import { iphoneModels, resolveReference } from "../_shared/generated/library.js"
import { createInstagramFeed } from "../_shared/generated/instagram.js"
import { createTikTokProfile } from "../_shared/generated/tiktok.js"

const config = {
  url: Deno.env.get("SUPABASE_URL") ?? "",
  serviceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  publicKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
  gateway: Deno.env.get("STORE_GATEWAY_SECRET") ?? "",
  bucket: Deno.env.get("STORE_PHOTO_BUCKET") ?? "products",
}
const authOptions = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
const privateClient = () => createClient(config.url, config.serviceKey, { auth: authOptions })
const authClient = () => createClient(config.url, config.publicKey, { auth: authOptions })
const instagram = createInstagramFeed({
  token: Deno.env.get("INSTAGRAM_ACCESS_TOKEN"),
  username: Deno.env.get("INSTAGRAM_USERNAME") ?? "alexxzino_store",
  version: Deno.env.get("INSTAGRAM_API_VERSION") ?? "v27.0",
})
const tiktok = createTikTokProfile()
const encoder = new TextEncoder()
const sessionCookie = "__Host-vc_auth"
const sessionLifetime = 3600
const cookieFlags = "Path=/; HttpOnly; Secure; SameSite=Lax"
const json = (value: unknown, status = 200, cookie?: string) => Response.json(value, {
  status,
  headers: { "Cache-Control": "no-store", ...(cookie ? { "Set-Cookie": cookie } : {}) },
})
class HttpError extends Error {
  constructor(readonly status: number, message: string) { super(message) }
}
function requireValue(value: unknown, status: number, message: string): asserts value {
  if (!value) throw new HttpError(status, message)
}
async function hash(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
async function validGateway(request: Request) {
  if (config.gateway.length < 32) return false
  const supplied = request.headers.get("X-Store-Gateway") ?? ""
  if (supplied.length > 256) return false
  const [actual, expected] = await Promise.all([hash(supplied), hash(config.gateway)])
  let difference = 0
  for (let index = 0; index < expected.length; index++) difference |= actual.charCodeAt(index) ^ expected.charCodeAt(index)
  return difference === 0
}
async function readBody(request: Request, maximum: number) {
  const size = Number(request.headers.get("Content-Length") ?? 0)
  requireValue(size <= maximum, 413, "El archivo o la solicitud supera el tamaño permitido")
  const reader = request.body?.getReader()
  requireValue(reader, 400, "Falta el contenido de la solicitud")
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > maximum) {
        await reader.cancel()
        throw new HttpError(413, "El archivo o la solicitud supera el tamaño permitido")
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
  return body
}
async function body(request: Request) {
  requireValue(request.headers.get("Content-Type")?.split(";")[0] === "application/json", 415, "Usa formato JSON")
  const raw = await readBody(request, 256 * 1024)
  try { return JSON.parse(new TextDecoder().decode(raw)) }
  catch { throw new HttpError(400, "JSON inválido") }
}

type Row = Record<string, unknown>
function formatProduct(product: Row) {
  const reference = resolveReference(typeof product.referenceVariantId === "string" ? product.referenceVariantId : null)
  const uploaded = Array.isArray(product.photos) ? product.photos : []
  const photos: Row[] = [
    ...(reference ? [{ id: `reference:${reference.id}`, url: reference.url, storageKey: "", sortOrder: -1, kind: "reference" }] : []),
    ...uploaded.map((photo: Row) => ({ ...photo, kind: "unit" })),
  ]
  return { ...product, id: product.sku, dbId: product.id, photos,
    biometric: product.biometric === "FACE_ID" ? "Face ID" : product.biometric === "TOUCH_ID" ? "Touch ID" : "No aplica",
    image: photos[0]?.url ?? "/favicon.svg", imageKind: photos[0]?.kind ?? "unit" }
}
const identifier = z.string().min(1).max(80)
const credentials = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(1).max(256) })
const pagination = {
  page: z.coerce.number().int().min(1).max(100000).default(1),
  from: z.iso.date().optional(), to: z.iso.date().optional(),
}
const validDates = (v: { from?: string; to?: string }) => !v.from || !v.to || v.from <= v.to
const ordersQuery = z.object({ ...pagination, limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(120).default(""), productId: identifier.optional(),
  status: z.enum(["all", "pendiente", "confirmada", "completada", "cancelada", "sold"]).default("all"),
  deliveryStatus: z.enum(["all", "unscheduled", "pendiente", "en_ruta", "entregado", "incidencia"]).default("all"),
}).refine(validDates, "La fecha inicial debe ser anterior a la final")
const auditQuery = z.object({ ...pagination, limit: z.coerce.number().int().min(1).max(100).default(25),
  action: z.string().trim().max(80).optional(), entityType: z.string().trim().max(80).optional(), entityId: z.string().trim().max(100).optional(),
}).refine(validDates, "La fecha inicial debe ser anterior a la final")

async function handle(request: Request) {
  requireValue(await validGateway(request), 401, "Acceso no autorizado")
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/(?:functions\/v1\/)?store-api(?=\/)/, "").replace(/\/$/, "")
  const method = request.method === "HEAD" ? "GET" : request.method
  const query = Object.fromEntries(url.searchParams)
  const route = `${method} ${path}`
  if (route === "GET /api/health") return json({ ok: true, service: "ventacelulares-api" })
  const db = privateClient()
  let actor: string | null = null
  async function rpc(operation: string, args: Row = {}) {
    const { data, error } = await db.rpc("vc_store_call", { operation, a: args, actor })
    if (error) {
      if (error.code === "23505" || error.code === "23503") throw new HttpError(409, "Los datos cambiaron. Actualiza e intenta nuevamente")
      if (error.code === "P0001" && /^(400|401|403|404|409|503)$/.test(error.details ?? "")) {
        throw new HttpError(Number(error.details), error.message)
      }
      console.error("store database", error.code)
      throw new HttpError(503, "No pudimos completar la operación. Intenta nuevamente")
    }
    return data
  }
  async function enforceLimit(name: string, limit: number) {
    const ip = request.headers.get("X-Store-Client-IP") ?? "unknown"
    const key = `${name}:${await hash(`${config.gateway}:${ip}`)}`
    const { data, error } = await db.rpc("vc_store_rate", { p_key: key, p_limit: limit, p_seconds: 900 })
    requireValue(!error, 503, "El servicio está ocupado. Intenta nuevamente")
    requireValue(data, 429, "Demasiados intentos. Espera unos minutos")
  }
  const token = request.headers.get("Cookie")?.split(";").map((piece) => piece.trim())
    .find((piece) => piece.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1)
  const clearCookie = `${sessionCookie}=; Max-Age=0; ${cookieFlags}`
  if (route === "POST /api/auth/login") {
    await enforceLimit("login", 10)
    const input = credentials.parse(await body(request))
    const { data, error } = await authClient().auth.signInWithPassword(input)
    requireValue(!error && data.user && data.session, 401, "Credenciales incorrectas")
    const access = data.session.access_token
    const result = await rpc("auth.open", { userId: data.user.id, sessionHash: await hash(`edge:${access}`) })
    return json(result, 200, `${sessionCookie}=${access}; Max-Age=${Math.min(sessionLifetime, data.session.expires_in)}; ${cookieFlags}`)
  }
  if (route === "POST /api/auth/logout" && !token) return json({ ok: true }, 200, clearCookie)
  if (path.startsWith("/api/admin/") || path.startsWith("/api/auth/")) {
    requireValue(token && token.length <= 3800 && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(token), 401, "Inicia sesión para continuar")
    const { data, error } = await authClient().auth.getUser(token)
    requireValue(!error && data.user, 401, "Sesión inválida o expirada")
    const sessionHash = await hash(`edge:${token}`)
    const result = await rpc("auth.me", { userId: data.user.id, sessionHash })
    actor = result.admin.id
    if (route === "GET /api/auth/me") return json(result)
    if (route === "POST /api/auth/logout") return json(await rpc("admin.auth.close", { sessionHash }), 200, clearCookie)
    if (route === "POST /api/auth/password") {
      await enforceLimit("password", 5)
      const input = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(14).max(256) }).parse(await body(request))
      requireValue(input.currentPassword !== input.newPassword, 400, "Elige una contraseña distinta de la actual")
      const client = authClient()
      // Sign in once to obtain the SDK session required by updateUser.
      const verification = await client.auth.signInWithPassword({ email: result.admin.email, password: input.currentPassword })
      requireValue(!verification.error && verification.data.user?.id === data.user.id, 400, "La contraseña actual es incorrecta")
      const changed = await client.auth.updateUser({ password: input.newPassword, current_password: input.currentPassword })
      requireValue(!changed.error, 400, "No se pudo cambiar la contraseña")
      const response = await rpc("admin.auth.password")
      await client.auth.signOut({ scope: "global" })
      return json(response, 200, clearCookie)
    }
  }
  switch (route) {
    case "GET /api/health/ready": return json(await rpc("public.ready"))
    case "GET /api/config": return json(await rpc("public.config"))
    case "GET /api/product-library": return json({ models: iphoneModels.map((model: Row) => ({ ...model, available: true })) })
    case "GET /api/instagram/feed": {
      const feed = await instagram()
      requireValue(feed, 503, "Visita nuestro perfil de Instagram")
      return json(feed)
    }
    case "GET /api/tiktok/profile": {
      const profile = await tiktok()
      requireValue(profile, 503, "Visita nuestro perfil de TikTok")
      return json({ profile })
    }
    case "GET /api/products":
    case "GET /api/admin/products": {
      const admin = path.includes("/admin/")
      const args = z.object({ page: pagination.page, limit: z.coerce.number().int().min(1).max(500).default(500), q: z.string().max(120).default("") }).parse(query)
      const result = await rpc(admin ? "admin.products" : "public.products", args)
      return json({ ...result, products: result.products.map(formatProduct) })
    }
    case "POST /api/orders": {
      await enforceLimit("order", 20)
      const input = orderSchema.parse(await body(request))
      const requestKey = z.uuid().parse(request.headers.get("Idempotency-Key"))
      const { config: business } = await rpc("public.config")
      requireValue(/^\d{10,15}$/.test(business.whatsapp), 503, "El contacto del negocio no está configurado")
      const { order } = await rpc("public.order.create", { ...input, requestKey })
      const { id, folio, customerName, productNameSnapshot, priceSnapshot, deliveryMode, status } = order
      const message = `Hola, envié la solicitud ${folio}. Equipo: ${productNameSnapshot}. Precio de referencia: $${priceSnapshot.toLocaleString("es-MX")} MXN. Entrega: ${deliveryMode === "envio" ? "envío" : "local"}. Entiendo que la solicitud no reserva ni paga el equipo.`
      return json({ order: { id, folio, customerName, productNameSnapshot, priceSnapshot, deliveryMode, status }, whatsappUrl: `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}` }, 201)
    }
    case "POST /api/admin/reservations": {
      const input = reservationSchema.parse(await body(request))
      return json(await rpc("admin.reserve", { ...input, requestKey: z.uuid().parse(request.headers.get("Idempotency-Key")) }), 201)
    }
    case "POST /api/admin/products": {
      const product = productSchema.parse(await body(request))
      requireValue(!product.isPublished || product.referenceVariantId, 400, "Selecciona una imagen de biblioteca antes de publicar")
      const result = await rpc("admin.product.create", { product })
      return json({ product: formatProduct(result.product) }, 201)
    }
    case "GET /api/admin/orders": return json(await rpc("admin.orders", ordersQuery.parse(query)))
    case "GET /api/admin/sales": return json(await rpc("admin.sales"))
    case "GET /api/admin/dashboard": return json(await rpc("admin.dashboard"))
    case "GET /api/admin/audit": return json(await rpc("admin.audit", auditQuery.parse(query)))
    case "PUT /api/admin/config": return json(await rpc("admin.config", configSchema.parse(await body(request))))
    case "POST /api/admin/sales": {
      const sale = z.object({ productId: identifier, orderId: identifier.optional(), finalPrice: z.number().int().min(1).max(10_000_000), paymentMethod: z.enum(["Efectivo", "Transferencia"]) }).parse(await body(request))
      return json(await rpc("admin.sale.create", sale), 201)
    }
  }
  const publicProduct = path.match(/^\/api\/products\/([^/]+)$/)
  if (publicProduct && method === "GET") {
    const result = await rpc("public.product", { id: identifier.parse(decodeURIComponent(publicProduct[1])) })
    return json({ product: formatProduct(result.product) })
  }
  const orderMatch = path.match(/^\/api\/admin\/orders\/([^/]+)(\/delivery)?$/)
  if (orderMatch) {
    const id = identifier.parse(decodeURIComponent(orderMatch[1]))
    if (orderMatch[2] && method === "PUT") return json(await rpc("admin.delivery", { id, delivery: deliverySchema.parse(await body(request)) }))
    if (!orderMatch[2] && method === "PATCH") {
      const { status } = z.object({ status: z.enum(["pendiente", "confirmada", "completada", "cancelada"]) }).parse(await body(request))
      return json(await rpc("admin.order.status", { id, status }))
    }
  }
  const productMatch = path.match(/^\/api\/admin\/products\/([^/]+)(?:\/(status|photos)(?:\/([^/]+))?)?$/)
  if (productMatch) {
    const id = identifier.parse(decodeURIComponent(productMatch[1]))
    const section = productMatch[2]
    const photoId = productMatch[3]
    if (!section && method === "PUT") {
      const input = await body(request)
      if (input && typeof input === "object" && !("referenceVariantId" in input)) {
        input.referenceVariantId = (await rpc("admin.product", { id })).product.referenceVariantId
      }
      const result = await rpc("admin.product.update", { id, product: productSchema.parse(input) })
      return json({ product: formatProduct(result.product) })
    }
    if (!section && method === "DELETE") return json(await rpc("admin.product.archive", { id }))
    if (section === "status" && !photoId && method === "PATCH") {
      const input = z.object({ status: statusSchema, expectedStatus: statusSchema }).parse(await body(request))
      const result = await rpc("admin.product.release", { id, ...input })
      return json({ product: formatProduct(result.product) })
    }
    if (section === "photos") {
      const bucket = db.storage.from(config.bucket)
      if (!photoId && method === "POST") {
        const mime = request.headers.get("Content-Type")?.split(";")[0]
        const bytes = await readBody(request, 5 * 1024 * 1024)
        const ascii = new TextDecoder()
        const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        const png = [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)
        const webp = ascii.decode(bytes.subarray(0, 4)) === "RIFF" && ascii.decode(bytes.subarray(8, 12)) === "WEBP"
        requireValue(bytes.length > 12 && ((mime === "image/jpeg" && jpeg) || (mime === "image/png" && png) || (mime === "image/webp" && webp)), 400, "El contenido no corresponde a una imagen admitida")
        const { product } = await rpc("admin.product", { id })
        const key = `${product.id}/${crypto.randomUUID()}.${png ? "png" : webp ? "webp" : "jpg"}`
        const uploaded = await bucket.upload(key, bytes, { contentType: mime, upsert: false })
        requireValue(!uploaded.error, 502, "No se pudo subir la imagen. Verifica Storage")
        try { return json(await rpc("admin.photo.add", { id, url: bucket.getPublicUrl(key).data.publicUrl, storageKey: key }), 201) }
        catch (error) {
          // Only remove after the database explicitly rejects the insert.
          if (error instanceof HttpError && [400, 404, 409].includes(error.status)) await bucket.remove([key])
          throw error
        }
      }
      if (!photoId && method === "PUT") {
        const { photoIds } = z.object({ photoIds: z.array(identifier).min(1).max(12) }).parse(await body(request))
        return json(await rpc("admin.photo.reorder", { id, photoIds }))
      }
      if (photoId && method === "DELETE") {
        const result = await rpc("admin.photo.remove", { id, photoId: identifier.parse(decodeURIComponent(photoId)) })
        const removed = await bucket.remove([result.storageKey])
        if (removed.error) console.error("store photo cleanup requires retry")
        return json({ ok: true })
      }
    }
  }
  throw new HttpError(404, "Ruta no encontrada")
}

Deno.serve(async (request) => {
  try {
    const result = await handle(request)
    return request.method === "HEAD" ? new Response(null, result) : result
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status)
    if (error instanceof z.ZodError) return json({
      error: "Revisa los campos de la solicitud", fields: z.flattenError(error).fieldErrors,
    }, 400)
    if (error instanceof URIError) return json({ error: "Ruta inválida" }, 400)
    console.error("store unhandled", error instanceof Error ? error.name : typeof error)
    return json({ error: "No pudimos completar la operación" }, 500)
  }
})
