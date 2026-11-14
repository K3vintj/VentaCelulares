import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, unlink, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { encryptArchive, decryptArchive } from "../operations/archive.js";
test("backups authenticate every byte and reject wrong keys and tampering", async () => {
  const directory = await mkdtemp(join(tmpdir(), "vc-archive-"));
  const file = join(directory, "backup.vcbackup"), output = join(directory, "verified.ndjson"), corrupt = join(directory, "corrupt.vcbackup");
  try {
    const key = randomBytes(32);
    async function* rows() { yield { kind: "test", confidential: "private test value" }; }
    await encryptArchive(file, key, rows());
    assert.equal((await readFile(file)).includes(Buffer.from("private test value")), false);
    await decryptArchive(file, output, key);
    assert.equal(JSON.parse(await readFile(output, "utf8")).confidential, "private test value");
    await unlink(output);
    await assert.rejects(decryptArchive(file, output, randomBytes(32)));
    const changed = await readFile(file); changed[changed.length - 20] = changed[changed.length - 20]! ^ 1;
    await writeFile(corrupt, changed);
    await assert.rejects(decryptArchive(corrupt, output, key));
  } finally {
    for (const name of [file, output, corrupt]) await unlink(name).catch(() => {});
    await rmdir(directory);
  }
});
