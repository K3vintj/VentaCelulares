import { secureDatabaseUrl } from "../operations/database.js";
import "../env.js"
import { Client } from "pg"
import { storage } from "../storage.js"
import { env } from "../env.js"
const client = new Client({
  connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL),
  connectionTimeoutMillis: 10000,
})
async function main() {
  await client.connect()
  const { rows: tables } = await client.query(
    `SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind='r' AND c.relname IN ('AdminUser','AdminSession','Product','ProductPhoto','Order','Sale','Delivery','BusinessConfig','AuditLog') ORDER BY c.relname`,
  )
  const { rows: grants } = await client.query(
    `SELECT table_name, grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated','PUBLIC') AND table_name IN ('AdminUser','AdminSession','Product','ProductPhoto','Order','Sale','Delivery','BusinessConfig','AuditLog') ORDER BY table_name,grantee,privilege_type`,
  )
  const { rows: policies } = await client.query(
    `SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE schemaname='public'`,
  )
  const { rows: triggers } = await client.query(
    `SELECT evtname, evtenabled FROM pg_event_trigger WHERE evtname='ensure_rls'`,
  )
  const { rows: counts } = await client.query(
    `SELECT (SELECT count(*)::int FROM "AdminUser") AS admins, (SELECT count(*)::int FROM "BusinessConfig" WHERE id='default') AS config, (SELECT count(*)::int FROM (SELECT "productId" FROM "Sale" GROUP BY "productId" HAVING count(*)>1) s) AS duplicate_sales`,
  )
  const { rows: relations } = await client.query(
    `SELECT conrelid::regclass::text AS table_name, conname FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace ORDER BY 1,2`,
  )
  const { rows: role } = await client.query(
    `SELECT current_user AS role, rolbypassrls, rolsuper FROM pg_roles WHERE rolname=current_user`,
  )
  console.log(
    JSON.stringify(
      {
        tables,
        grants,
        policies,
        triggers,
        counts: counts[0],
        relations,
        databaseRole: role[0],
      },
      null,
      2,
    ),
  )
  if (storage) {
    const { data, error } = await storage.storage.getBucket(
      env.SUPABASE_STORAGE_BUCKET,
    )
    console.log(
      JSON.stringify({
        storage: error
          ? { available: false, message: error.message }
          : {
              available: true,
              name: data.name,
              public: data.public,
              fileSizeLimit: data.file_size_limit,
              allowedMimeTypes: data.allowed_mime_types,
            },
      }),
    )
  }
}
main()
  .catch(() => {
    console.error(
      "Verificación fallida: revisa conexión y permisos (sin mostrar credenciales).",
    )
    process.exitCode = 1
  })
  .finally(() => client.end())
