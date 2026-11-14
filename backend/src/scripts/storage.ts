import { storage } from "../storage.js"
import { env } from "../env.js"
if (!storage) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY")
const options = {
  public: true,
  fileSizeLimit: 5 * 1024 * 1024,
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
}
async function main() {
  const { data: buckets, error } = await storage!.storage.listBuckets()
  if (error) throw error
  const exists = buckets.some((b) => b.name === env.SUPABASE_STORAGE_BUCKET)
  const result = exists
    ? await storage!.storage.updateBucket(env.SUPABASE_STORAGE_BUCKET, options)
    : await storage!.storage.createBucket(env.SUPABASE_STORAGE_BUCKET, options)
  if (result.error) throw result.error
  console.log(
    `Bucket ${env.SUPABASE_STORAGE_BUCKET} preparado: lectura pública, JPEG/PNG/WebP, máximo 5 MB. Escritura exclusiva mediante API.`,
  )
}
main().catch(() => {
  console.error("No se pudo preparar Storage. Revisa credenciales y permisos.")
  process.exitCode = 1
})
