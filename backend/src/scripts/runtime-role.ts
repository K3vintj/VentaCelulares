import "../env.js";
import { randomBytes, pbkdf2Sync, createHmac, createHash } from "node:crypto";
import { Client } from "pg";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { TLSSocket } from "node:tls";
import { env } from "../env.js";
import { secureDatabaseUrl } from "../operations/database.js";
import { backupDirectory } from "../operations/archive.js";

const role = "vc_runtime";
const tables = ["AdminUser", "AdminSession", "Product", "ProductPhoto", "Order", "Sale", "Delivery", "BusinessConfig", "AuditLog"];
const credentialFile = resolve(backupDirectory(), "runtime-credentials.json");
function verifier(password: string) {
  const salt = randomBytes(16), iterations = 4096;
  const salted = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const clientKey = createHmac("sha256", salted).update("Client Key").digest();
  const stored = createHash("sha256").update(clientKey).digest("base64");
  const server = createHmac("sha256", salted).update("Server Key").digest("base64");
  return `SCRAM-SHA-256$${iterations}:${salt.toString("base64")}$${stored}:${server}`;
}
async function main() {
  const client = new Client({ connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL), connectionTimeoutMillis: 10000 });
  await client.connect();
  try {
    const existing = (await client.query("SELECT rolbypassrls,rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=$1", [role])).rows[0];
    let connection: string;
    if (existing) {
      if (existing.rolbypassrls || existing.rolsuper || existing.rolcreatedb || existing.rolcreaterole) throw new Error("El rol existente tiene privilegios inesperados");
      connection = JSON.parse(await readFile(credentialFile, "utf8")).connection;
    } else {
      const password = randomBytes(36).toString("base64url");
      const url = new URL(env.DATABASE_URL);
      const previous = decodeURIComponent(url.username);
      url.username = url.hostname.endsWith(".pooler.supabase.com") ? `${role}.${previous.slice(previous.indexOf(".") + 1)}` : role;
      url.password = password;
      url.searchParams.set("sslmode", "verify-full");
      connection = url.toString();
      await mkdir(backupDirectory(), { recursive: true, mode: 0o700 });
      await writeFile(credentialFile, JSON.stringify({ role, connection }) + "\n", { flag: "wx", mode: 0o600 });
      // Only a SCRAM verifier, never the plaintext password, is sent in SQL DDL/logs.
      await client.query(`CREATE ROLE ${role} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD '${verifier(password)}'`);
    }
    await client.query("BEGIN");
    try {
      await client.query(`GRANT CONNECT ON DATABASE ${'"' + (await client.query("SELECT current_database() AS name")).rows[0].name.replaceAll('"','""') + '"'} TO ${role}`);
      await client.query(`GRANT USAGE ON SCHEMA public, prisma_contract TO ${role}`);
      await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA prisma_contract TO ${role}`);
      for (const table of tables) {
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON public."${table}" TO ${role}`);
        await client.query(`DROP POLICY IF EXISTS vc_runtime_access ON public."${table}"`);
        await client.query(`CREATE POLICY vc_runtime_access ON public."${table}" FOR ALL TO ${role} USING (true) WITH CHECK (true)`);
      }
      await client.query(`ALTER ROLE ${role} SET statement_timeout = '15s'`);
      await client.query(`ALTER ROLE ${role} SET lock_timeout = '5s'`);
      await client.query(`ALTER ROLE ${role} SET idle_in_transaction_session_timeout = '30s'`);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK"); throw error; }
    const runtime = new Client({ connectionString: secureDatabaseUrl(connection), connectionTimeoutMillis: 10000 });
    try {
      await runtime.connect();
      const { rows } = await runtime.query("SELECT current_user AS role, has_schema_privilege(current_user,'public','CREATE') AS can_create, has_table_privilege(current_user,(SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='auth' AND c.relname='users'),'SELECT') AS can_read_auth");
      if (rows[0].role !== role || rows[0].can_create || rows[0].can_read_auth) throw new Error("El rol no está correctamente limitado");
      await runtime.query('SELECT id FROM public."Product" LIMIT 1');
      if (!(runtime.connection.stream instanceof TLSSocket) || !runtime.connection.stream.authorized) throw new Error("TLS no verificado");
      const path = fileURLToPath(new URL("../../.env", import.meta.url));
      const source = await readFile(path, "utf8");
      if (!/^DATABASE_URL=/m.test(source)) throw new Error("No se encontró DATABASE_URL en .env");
      await writeFile(path, source.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${JSON.stringify(connection)}`), { mode: 0o600 });
      console.log(JSON.stringify({ runtimeRole: role, bypassRls: false, canCreateSchemaObjects: false, canReadAuthUsers: false, tlsVerified: true, localEnvironmentUpdated: true }));
    } finally { await runtime.end(); }
  } finally { await client.end(); }
}
main().catch(() => { console.error("No se completó la configuración del rol de ejecución. La conexión local solo cambia después de verificarla."); process.exitCode = 1; });
