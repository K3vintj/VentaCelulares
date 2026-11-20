import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { env } from "../env.js";
import { secureDatabaseUrl } from "../operations/database.js";
import { storage } from "../storage.js";

async function prepare() {
  const action = process.argv[2];
  if (!["--check", "--apply", "--link-admin"].includes(action || "")) throw new Error("Usa --check, --apply o --link-admin");
  if (!process.env.DIRECT_URL || !env.SUPABASE_URL || !storage) throw new Error("Configura la conexión de administración y Supabase");
  const migration = await readFile(new URL("../../../supabase/migrations/202611200001_store_platform.sql", import.meta.url), "utf8");
  const db = new Client({ connectionString: secureDatabaseUrl(process.env.DIRECT_URL), connectionTimeoutMillis: 8000 });
  await db.connect();
  try {
    await db.query("begin");
    await db.query("set local lock_timeout='5s'");
    if (action !== "--link-admin") {
      await db.query(migration);
      const { rows } = await db.query(`
        select has_function_privilege('service_role','public.vc_store_call(text,jsonb,text)','execute') as trusted,
          has_function_privilege('anon','public.vc_store_call(text,jsonb,text)','execute') as anonymous,
          has_function_privilege('authenticated','public.vc_store_call(text,jsonb,text)','execute') as authenticated
      `);
      if (!rows[0].trusted || rows[0].anonymous || rows[0].authenticated) throw new Error("Los permisos de la función no son los esperados");
      await db.query("select public.vc_store_call('public.ready')");
      await db.query(action === "--check" ? "rollback" : "commit");
      console.log(action === "--check" ? "Migración validada y revertida en la base actual" : "Migración aplicada");
      return;
    }
    await db.query("select pg_advisory_xact_lock(820261120)");
    const { rows } = await db.query<{ id: string; email: string; passwordHash: string }>('select id,email,"passwordHash" from public."AdminUser"');
    const admin = rows[0];
    if (rows.length !== 1 || !admin || !admin.passwordHash.startsWith("$argon2id$")) throw new Error("Se esperaba un administrador existente con contraseña Argon2id");
    const { rows: linked } = await db.query('select enabled from public."StoreAdminAuth" where "adminId"=$1', [admin.id]);
    if (linked[0]?.enabled) {
      await db.query("rollback");
      console.log("El administrador ya está vinculado");
      return;
    }
    const { rows: existing } = await db.query<{ id: string; owned: boolean }>(
      "select id,raw_app_meta_data->>'vc_import_admin'=$2 as owned from auth.users where lower(email)=lower($1)", [admin.email, admin.id],
    );
    let authUserId = existing[0]?.id;
    if (authUserId && !existing[0]?.owned) throw new Error("El correo ya existe en Supabase Auth y requiere revisión manual");
    if (!authUserId) {
      const userId = randomUUID();
      const { data, error } = await storage.auth.admin.createUser({
        id: userId, email: admin.email, email_confirm: true,
        password_hash: admin.passwordHash, app_metadata: { vc_import_admin: admin.id },
      });
      if (error || !data.user || data.user.id !== userId) throw new Error("No se pudo importar el acceso del administrador");
      authUserId = data.user.id;
    }
    await db.query('insert into public."StoreAdminAuth"("adminId","authUserId",enabled) values($1,$2,true) on conflict("adminId") do update set "authUserId"=excluded."authUserId",enabled=true', [admin.id, authUserId]);
    await db.query("commit");
    console.log("El administrador existente quedó vinculado con el mismo correo y contraseña");
  } catch (error) {
    await db.query("rollback").catch(() => {});
    throw error;
  } finally { await db.end(); }
}

prepare().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "No se pudo preparar la plataforma");
  process.exitCode = 1;
});
