import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { Client } from "pg";
import { env } from "../env.js";
import { secureDatabaseUrl } from "../operations/database.js";
import { encryptArchive } from "../operations/archive.js";
import { verifyBackup } from "../operations/backup.js";

test("a rejected restore closes its stream and removes plaintext and temporary schema", { skip: process.env.VC_INTEGRATION !== "true" || env.NODE_ENV === "production", timeout: 30000 }, async () => {
  const directory = await mkdtemp(join(tmpdir(), "vc-restore-cleanup-"));
  const file = join(directory, "invalid-contract.vcbackup");
  const previousDir = process.env.BACKUP_DIR, previousKey = process.env.BACKUP_ENCRYPTION_KEY;
  const key = randomBytes(32);
  process.env.BACKUP_DIR = directory;
  process.env.BACKUP_ENCRYPTION_KEY = key.toString("hex");
  const client = new Client({ connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL), connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    const schemaNames = async () => (await client.query("SELECT nspname FROM pg_namespace WHERE nspname LIKE 'vc_restore_%' ORDER BY nspname")).rows.map((r) => r.nspname);
    const before = await schemaNames();
    async function* invalid() { yield { kind: "manifest", version: 1, contractHash: "invalid-for-test", bucket: "products" }; }
    await encryptArchive(file, key, invalid());
    await assert.rejects(verifyBackup(file), /contrato original/);
    assert.deepEqual(await schemaNames(), before);
    assert.deepEqual(await readdir(directory), ["invalid-contract.vcbackup"]);
  } finally {
    await client.end();
    if (previousDir === undefined) delete process.env.BACKUP_DIR; else process.env.BACKUP_DIR = previousDir;
    if (previousKey === undefined) delete process.env.BACKUP_ENCRYPTION_KEY; else process.env.BACKUP_ENCRYPTION_KEY = previousKey;
    for (const name of await readdir(directory)) await unlink(join(directory, name));
    await rmdir(directory);
  }
});
