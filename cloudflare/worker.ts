interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  STORE_API_URL: string
  STORE_GATEWAY_SECRET: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request)
    const fail = (status: number, error: string) => Response.json({ error }, {
      status, headers: { "Cache-Control": "no-store" },
    })
    const method = request.method
    if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      return fail(405, "Método no permitido")
    }
    if (!["GET", "HEAD"].includes(method) && (
      request.headers.get("Origin") !== url.origin ||
      request.headers.get("X-Requested-With") !== "VentaCelulares"
    )) return fail(403, "Origen no permitido")
    try {
      const upstream = new URL(env.STORE_API_URL)
      if (upstream.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(upstream.hostname) ||
        upstream.port || upstream.username || upstream.password || upstream.pathname !== "/functions/v1/store-api" ||
        !env.STORE_GATEWAY_SECRET || env.STORE_GATEWAY_SECRET.length < 32) {
        return fail(503, "La conexión con la tienda no está configurada")
      }
      upstream.pathname += url.pathname
      upstream.search = url.search
      const headers = new Headers()
      for (const name of ["Content-Type", "Idempotency-Key"]) {
        const value = request.headers.get(name)
        if (value) headers.set(name, value)
      }
      const session = request.headers.get("Cookie")?.split(";").map((part) => part.trim())
        .find((part) => part.startsWith("__Host-vc_auth="))
      if (session) headers.set("Cookie", session)
      headers.set("X-Store-Gateway", env.STORE_GATEWAY_SECRET)
      headers.set("X-Store-Client-IP", request.headers.get("CF-Connecting-IP") || "unknown")
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 18_000)
      let result: Response
      try {
        result = await fetch(upstream.href, {
          method, headers, ...(request.body ? { body: request.body } : {}),
          redirect: "manual", signal: controller.signal,
        })
      } finally { clearTimeout(timeout) }
      if (result.status >= 300 && result.status < 400) {
        return fail(502, "El servidor de la tienda respondió con una redirección inesperada")
      }
      const outgoing = new Headers(result.headers)
      outgoing.delete("Access-Control-Allow-Origin")
      outgoing.set("X-Content-Type-Options", "nosniff")
      return new Response(result.body, { status: result.status, headers: outgoing })
    } catch (error) {
      console.error("store gateway", error instanceof Error ? error.name : "unknown")
      return fail(502, "No se pudo conectar con la tienda")
    }
  },
}
