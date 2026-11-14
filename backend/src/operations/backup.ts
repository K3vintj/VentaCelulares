import { Client } from "pg";
import { createReadStream } from "node:fs";
import { readFile, mkdir, unlink } from "node:fs/promises";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../env.js";
import { storage } from "../storage.js";
import { backupDirectory, decryptArchive, digest, encryptArchive, readKey } from "./archive.js";
import { secureDatabaseUrl } from "./database.js";

export const tables = ["AdminUser", "Product", "ProductPhoto", "Order", "Sale", "Delivery", "BusinessConfig", "AuditLog", "AdminSession"] as const;
export const identifier = (name: string) => '"' + name.replaceAll('"', '""') + '"';
type Row = Record<string, unknown>;
interface Manifest { kind: "manifest"; version: number; createdAt: string; contractHash: string; bucket: string; }
interface TableRecord { kind: "table"; name: string; columns: string[]; count: number; }
interface DataRecord { kind: "row"; table: string; data: Row; }
interface AssetRecord { kind: "asset"; key: string; mime: string; sha256: string; base64: string; photoIds: string[]; }
type RecordEntry = Manifest | TableRecord | DataRecord | AssetRecord;
const maxImageBytes = 5 * 1024 * 1024;
const directClient = () => new Client({ connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL), connectionTimeoutMillis: 10000 });
async function* bucketKeys(prefix = ""): AsyncGenerator<string> {
  if (!storage) throw new Error("Storage no configurado");
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await storage.storage.from(env.SUPABASE_STORAGE_BUCKET).list(prefix, { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error("No se pudo listar Storage");
    for (const item of data) {
      const key = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) yield key; else yield* bucketKeys(key);
    }
    if (data.length < 100) break;
  }
}
async function externalPhoto(url: string) {
  const parsed = new URL(url);
  const allowed = ["images.unsplash.com", ...(process.env.BACKUP_EXTERNAL_HOSTS || "").split(",").filter(Boolean)];
  if (parsed.protocol !== "https:" || !allowed.includes(parsed.hostname) || parsed.username || parsed.password) throw new Error("Una foto externa requiere un host permitido para respaldarla");
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30000) });
  if (!response.ok || !response.body) throw new Error("No se pudo descargar una foto externa");
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > maxImageBytes) { await response.body.cancel().catch(() => {}); throw new Error("Una foto supera el máximo del respaldo"); }
    chunks.push(Buffer.from(chunk));
  }
  const mime = response.headers.get("content-type")?.split(";")[0] || "";
  if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) throw new Error("Formato de fotografía externa no permitido");
  return { bytes: Buffer.concat(chunks), mime };
}
export async function createBackup(destination?: string) {
  if (!storage) throw new Error("Storage no configurado");
  const key = await readKey();
  const client = directClient();
  const counts: Record<string, number> = {}; let assets = 0;
  await client.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const photos = (await client.query<{ id: string; storageKey: string; url: string }>('SELECT id,"storageKey",url FROM public."ProductPhoto"')).rows;
    async function* records(): AsyncGenerator<RecordEntry> {
      yield { kind: "manifest", version: 1, createdAt: new Date().toISOString(), contractHash: digest(await readFile(new URL("../prisma/contract.json", import.meta.url))), bucket: env.SUPABASE_STORAGE_BUCKET };
      for (const table of tables) {
        const columns = (await client.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table])).rows.map((r) => r.column_name);
        const count = table === "AdminSession" ? 0 : Number((await client.query(`SELECT count(*)::int AS count FROM public.${identifier(table)}`)).rows[0].count);
        counts[table] = count;
        yield { kind: "table", name: table, columns, count };
        if (table === "AdminSession") continue; // Never resurrect active sessions during recovery.
        await client.query(`DECLARE vc_snapshot NO SCROLL CURSOR FOR SELECT * FROM public.${identifier(table)}`);
        while (true) {
          const { rows } = await client.query("FETCH 100 FROM vc_snapshot");
          for (const data of rows) yield { kind: "row", table, data };
          if (rows.length < 100) break;
        }
        await client.query("CLOSE vc_snapshot");
      }
      const copied = new Set<string>();
      for await (const path of bucketKeys()) {
        const { data, error } = await storage!.storage.from(env.SUPABASE_STORAGE_BUCKET).download(path);
        if (error || !data || data.size > maxImageBytes) throw new Error("No se pudo respaldar un objeto de Storage");
        const bytes = Buffer.from(await data.arrayBuffer());
        yield { kind: "asset", key: path, mime: data.type || "application/octet-stream", sha256: digest(bytes), base64: bytes.toString("base64"), photoIds: photos.filter((p) => p.storageKey === path).map((p) => p.id) };
        copied.add(path); assets++;
      }
      for (const photo of photos) {
        if (copied.has(photo.storageKey)) continue;
        const { bytes, mime } = await externalPhoto(photo.url);
        yield { kind: "asset", key: photo.storageKey, mime, sha256: digest(bytes), base64: bytes.toString("base64"), photoIds: [photo.id] };
        copied.add(photo.storageKey); assets++;
      }
    }
    const file = resolve(destination || `${backupDirectory()}/vc-${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}.vcbackup`);
    const result = await encryptArchive(file, key, records());
    await client.query("COMMIT");
    return { ...result, tables: counts, assets, sessionsExcluded: true };
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
  finally { await client.end(); }
}
async function* entries(file: string): AsyncGenerator<RecordEntry> {
  const input = createReadStream(file);
  const lines = createInterface({ input, crlfDelay: Infinity });
  try { for await (const line of lines) if (line) yield JSON.parse(line) as RecordEntry; }
  finally {
    lines.close(); input.destroy();
    if (!input.closed) await new Promise<void>((resolve) => input.once("close", () => resolve()));
  }
}
export async function verifyBackup(source: string, keepRecoveredCopy = false) {
  if (!storage) throw new Error("Storage no configurado");
  const schema = "vc_restore_" + randomUUID().replaceAll("-", "");
  const bucket = "vc-restore-" + randomUUID().slice(0, 12);
  const plaintext = resolve(backupDirectory(), `${schema}.ndjson`);
  await mkdir(backupDirectory(), { recursive: true, mode: 0o700 });
  const client = directClient();
  let connected = false, schemaCreated = false, bucketCreated = false, succeeded = false;
  const counts: Record<string, number> = {}; let assets = 0;
  try {
    // Complete GCM authentication before opening any database transaction.
    await decryptArchive(resolve(source), plaintext, await readKey());
    await client.connect(); connected = true;
    await client.query(`CREATE SCHEMA ${identifier(schema)}`); schemaCreated = true;
    for (const table of tables) await client.query(`CREATE TABLE ${identifier(schema)}.${identifier(table)} (LIKE public.${identifier(table)} INCLUDING ALL)`);
    await client.query("BEGIN");
    let manifest = false;
    const expected: Record<string, number> = {};
    const types = new Map<string, Map<string, string>>();
    for (const table of tables) {
      const { rows } = await client.query("SELECT column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position", [table]);
      types.set(table, new Map(rows.map((r) => [r.column_name, r.data_type])));
    }
    for await (const record of entries(plaintext)) {
      if (record.kind === "manifest") {
        if (manifest || record.version !== 1 || record.contractHash !== digest(await readFile(new URL("../prisma/contract.json", import.meta.url)))) throw new Error("El respaldo requiere la versión de contrato original");
        manifest = true;
      } else if (!manifest) throw new Error("Falta el manifiesto");
      else if (record.kind === "table") {
        const columns = types.get(record.name);
        if (!columns || Object.hasOwn(expected, record.name) || JSON.stringify([...columns.keys()]) !== JSON.stringify(record.columns)) throw new Error("Las columnas del respaldo no coinciden");
        expected[record.name] = record.count; counts[record.name] = 0;
      } else if (record.kind === "row") {
        const fields = types.get(record.table);
        if (!fields || !Object.hasOwn(expected, record.table) || record.table === "AdminSession") throw new Error("Tabla de respaldo no permitida");
        const columns = [...fields.keys()];
        const values = columns.map((column) => fields.get(column)?.startsWith("json") ? JSON.stringify(record.data[column]) : record.data[column]);
        await client.query(`INSERT INTO ${identifier(schema)}.${identifier(record.table)} (${columns.map(identifier).join(",")}) VALUES (${columns.map((_, i) => "$" + (i + 1)).join(",")})`, values);
        counts[record.table] = (counts[record.table] || 0) + 1;
      } else if (record.kind === "asset") {
        const bytes = Buffer.from(record.base64, "base64");
        if (digest(bytes) !== record.sha256 || bytes.length > maxImageBytes) throw new Error("Fotografía de respaldo inválida");
        if (!bucketCreated) {
          const { error } = await storage.storage.createBucket(bucket, { public: false, fileSizeLimit: maxImageBytes });
          if (error) throw new Error("No se pudo crear el bucket privado de restauración");
          bucketCreated = true;
        }
        const target = storage.storage.from(bucket);
        const { error: uploadError } = await target.upload(record.key, bytes, { contentType: record.mime });
        if (uploadError) throw new Error("Falló la restauración de una fotografía");
        const { data, error: downloadError } = await target.download(record.key);
        if (downloadError || !data || digest(Buffer.from(await data.arrayBuffer())) !== record.sha256) throw new Error("La foto restaurada no coincide con el respaldo");
        for (const photoId of record.photoIds) {
          const found = await client.query(`SELECT id FROM ${identifier(schema)}."ProductPhoto" WHERE id=$1`, [photoId]);
          if (found.rowCount !== 1) throw new Error("La fotografía no corresponde con los datos restaurados");
        }
        assets++;
      } else throw new Error("Registro de respaldo desconocido");
    }
    if (!manifest || tables.some((table) => expected[table] === undefined || expected[table] !== counts[table])) throw new Error("El conteo restaurado no coincide");
    const foreignKeys = (await client.query(`SELECT c.conname, t.relname AS table_name, pg_get_constraintdef(c.oid) AS definition FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE c.contype='f' AND n.nspname='public' AND t.relname=ANY($1::text[])`, [tables])).rows;
    for (const fk of foreignKeys) {
      const definition = fk.definition.replace(/REFERENCES (?:(?:public|"public")\.)?("[^"]+"|[A-Za-z_][A-Za-z0-9_]*)/, (_match: string, table: string) => {
        const name = table.replaceAll('"', '');
        if (!tables.includes(name as typeof tables[number])) throw new Error("Referencia fuera de la aplicación");
        return `REFERENCES ${identifier(schema)}.${identifier(name)}`;
      });
      await client.query(`ALTER TABLE ${identifier(schema)}.${identifier(fk.table_name)} ADD CONSTRAINT ${identifier(fk.conname)} ${definition}`);
    }
    await client.query("COMMIT");
    succeeded = true;
    return { verified: true, tables: counts, assets, foreignKeys: foreignKeys.length, sessionsExcluded: true, ...(keepRecoveredCopy ? { recoveredSchema: schema, recoveredPrivateBucket: bucketCreated ? bucket : null, activeApplicationUnchanged: true } : {}) };
  } catch (error) { if (connected) await client.query("ROLLBACK").catch(() => {}); throw error; }
  finally {
    const cleanupErrors: string[] = [];
    // Remove the decrypted file even when a remote cleanup step fails.
    try { await unlink(plaintext); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") cleanupErrors.push("archivo temporal descifrado"); }
    if (schemaCreated && !(succeeded && keepRecoveredCopy)) {
      try { await client.query(`DROP SCHEMA ${identifier(schema)} CASCADE`); }
      catch { cleanupErrors.push(`esquema temporal ${schema}`); }
    }
    if (connected) { try { await client.end(); } catch { cleanupErrors.push("conexión de restauración"); } }
    if (bucketCreated && !(succeeded && keepRecoveredCopy)) {
      let removed = false;
      for (let attempt = 0; attempt < 6 && !removed; attempt++) {
        try {
          await storage.storage.emptyBucket(bucket);
          const deleted = await storage.storage.deleteBucket(bucket);
          removed = !deleted.error || String(deleted.error.statusCode) === "404";
        } catch { /* Retry only this isolated, generated bucket. */ }
        if (!removed) await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
      if (!removed) cleanupErrors.push(`bucket temporal ${bucket}`);
    }
    if (cleanupErrors.length) throw new Error(`Debe completarse la limpieza de: ${cleanupErrors.join(", ")}`);
  }
}
