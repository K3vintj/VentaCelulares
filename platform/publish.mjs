import { spawnSync } from "node:child_process"
import { randomBytes } from "node:crypto"
import { mkdtempSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { parseEnv } from "node:util"

const root = fileURLToPath(new URL("../", import.meta.url))
const variables = parseEnv(readFileSync(join(root, "backend", ".env"), "utf8"))
const projectUrl = new URL(variables.SUPABASE_URL)
const project = /^([a-z0-9]+)\.supabase\.co$/.exec(projectUrl.hostname)?.[1]
if (!project || projectUrl.protocol !== "https:" || projectUrl.origin !== projectUrl.href.slice(0, -1)) {
  throw new Error("SUPABASE_URL debe ser el origen HTTPS del proyecto")
}
const edgeUrl = `${projectUrl.origin}/functions/v1/store-api`
const launcher = process.platform === "win32" ? "npx.cmd" : "npx"
const temp = mkdtempSync(join(tmpdir(), "vc-publish-"))
const cloudflareSecrets = join(temp, "cloudflare.json")
const supabaseSecrets = join(temp, "supabase.env")
const localGateway = join(root, "platform", ".env.gateway")
const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options })
  if (result.error || result.status !== 0) throw new Error(`Falló el paso ${args.slice(0, 3).join(" ")}`)
}
try {
  const cli = ["--yes", "supabase@3.2.0"]
  const supabase = (...args) => run(launcher, [...cli, ...args], { shell: process.platform === "win32" })
  supabase("projects", "list")
  run(process.execPath, ["scripts/check-product-library.mjs"])
  run(process.execPath, ["node_modules/vite/bin/vite.js", "build"])
  run(process.execPath, ["scripts/prepare-edge.mjs"])
  try {
    writeFileSync(localGateway, randomBytes(32).toString("hex"), { mode: 0o600, flag: "wx" })
  } catch (error) { if (error.code !== "EEXIST") throw error }
  const gateway = readFileSync(localGateway, "utf8").trim()
  if (!/^[a-f0-9]{64}$/.test(gateway)) throw new Error("El secreto local del despliegue es inválido")
  writeFileSync(cloudflareSecrets, JSON.stringify({ STORE_GATEWAY_SECRET: gateway }), { mode: 0o600 })
  const bucket = variables.SUPABASE_STORAGE_BUCKET || "products"
  if (!/^[\w-]+$/.test(bucket)) throw new Error("Nombre de bucket inválido")
  writeFileSync(supabaseSecrets, `STORE_GATEWAY_SECRET=${gateway}\nSTORE_PHOTO_BUCKET=${bucket}\n`, { mode: 0o600 })
  supabase("secrets", "set", `--remote=${project}`, "--env-file", supabaseSecrets, "--yes")
  supabase("functions", "deploy", "store-api", `--remote=${project}`, "--use-api", "--no-verify-jwt", "--yes")
  for (const route of ["health/ready", "products", "product-library"]) {
    const response = await fetch(`${edgeUrl}/api/${route}`, {
      headers: { "X-Store-Gateway": gateway }, signal: AbortSignal.timeout(15_000),
    })
    if (!response.ok) throw new Error(`Falló la verificación de ${route} (HTTP ${response.status})`)
    await response.body?.cancel()
  }
  const unauthorized = await fetch(`${edgeUrl}/api/admin/products`, {
    headers: { "X-Store-Gateway": gateway }, signal: AbortSignal.timeout(15_000),
  })
  if (unauthorized.status !== 401) throw new Error("La protección del acceso administrativo no respondió 401")
  await unauthorized.body?.cancel()
  run(process.execPath, ["platform/node_modules/wrangler/bin/wrangler.js", "deploy",
    "--config", "platform/wrangler.jsonc", "--secrets-file", cloudflareSecrets,
    "--var", `STORE_API_URL:${edgeUrl}`,
  ])
} finally {
  for (const file of [cloudflareSecrets, supabaseSecrets]) {
    try { unlinkSync(file) } catch (error) { if (error.code !== "ENOENT") throw error }
  }
  rmdirSync(temp)
}
