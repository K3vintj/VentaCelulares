import { build } from "../platform/node_modules/esbuild/lib/main.js"
import { mkdir } from "node:fs/promises"
await mkdir("supabase/functions/_shared/generated", { recursive: true })
await build({ entryPoints: ["backend/src/validation.ts"], bundle: true, external: ["zod"], platform: "neutral", format: "esm", target: "es2022", outfile: "supabase/functions/_shared/generated/validation.js" })
await build({ entryPoints: ["backend/src/catalog/references.ts"], bundle: true, platform: "neutral", format: "esm", target: "es2022", outfile: "supabase/functions/_shared/generated/library.js" })
await build({ entryPoints: { instagram: "backend/src/catalog/instagram-provider.ts", tiktok: "backend/src/catalog/tiktok-provider.ts" }, bundle: true, platform: "neutral", format: "esm", target: "es2022", outdir: "supabase/functions/_shared/generated" })
console.log("Prepared shared validation and verified library for Supabase Edge Functions.")
