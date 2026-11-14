import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { appendFile, mkdir, open, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGzip, createGunzip } from "node:zlib";

export const digest = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
export const backupDirectory = () => resolve(process.env.BACKUP_DIR || fileURLToPath(new URL("../../../.backups/", import.meta.url)));
export const keyPath = () => resolve(process.env.BACKUP_KEY_FILE || `${backupDirectory()}/key.hex`);
export async function readKey() {
  const value = process.env.BACKUP_ENCRYPTION_KEY || (await readFile(keyPath(), "utf8")).trim();
  if (!/^[a-f\d]{64}$/i.test(value)) throw new Error("La clave de respaldo debe contener 64 caracteres hexadecimales");
  return Buffer.from(value, "hex");
}
export async function initializeKey() {
  await mkdir(dirname(keyPath()), { recursive: true, mode: 0o700 });
  await writeFile(keyPath(), randomBytes(32).toString("hex") + "\n", { flag: "wx", mode: 0o600 });
  console.log("Clave de respaldo creada en el archivo privado configurado. No se muestra ni se sube a Git.");
}
export async function encryptArchive(destination: string, key: Buffer, records: AsyncIterable<unknown>) {
  const temporary = destination + ".partial";
  const iv = randomBytes(12);
  const header = Buffer.from(JSON.stringify({ format: "VCB1", algorithm: "aes-256-gcm", iv: iv.toString("hex"), keyId: digest(key).slice(0, 16) }) + "\n");
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(header);
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  // Never truncate an existing backup or leave a successful-looking partial file.
  await writeFile(temporary, header, { flag: "wx", mode: 0o600 });
  try {
    async function* lines() { for await (const record of records) yield JSON.stringify(record) + "\n"; }
    await pipeline(Readable.from(lines()), createGzip(), cipher, createWriteStream(temporary, { flags: "a", mode: 0o600 }));
    await appendFile(temporary, cipher.getAuthTag());
    const { copyFile, constants } = await import("node:fs/promises");
    await copyFile(temporary, destination, constants.COPYFILE_EXCL);
  } finally { await unlink(temporary).catch(() => {}); }
  return { file: destination, bytes: (await stat(destination)).size, sha256: digest(await readFile(destination)), keyId: digest(key).slice(0, 16) };
}
export async function decryptArchive(source: string, plaintext: string, key: Buffer) {
  const handle = await open(source, "r");
  try {
    const size = (await handle.stat()).size;
    const prefix = Buffer.alloc(1024);
    await handle.read(prefix, 0, prefix.length, 0);
    const newline = prefix.indexOf(10);
    if (newline < 0 || size < newline + 18) throw new Error("Respaldo inválido");
    const headerBytes = prefix.subarray(0, newline + 1);
    const header = JSON.parse(headerBytes.toString());
    if (header.format !== "VCB1" || header.algorithm !== "aes-256-gcm" || !/^[a-f\d]{24}$/.test(header.iv)) throw new Error("Formato de respaldo no soportado");
    const tag = Buffer.alloc(16);
    await handle.read(tag, 0, 16, size - 16);
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(header.iv, "hex"));
    decipher.setAAD(headerBytes); decipher.setAuthTag(tag);
    try {
      await pipeline(createReadStream(source, { start: newline + 1, end: size - 17 }), decipher, createGunzip(), createWriteStream(plaintext, { flags: "wx", mode: 0o600 }));
    } catch {
      await unlink(plaintext).catch(() => {});
      throw new Error("El respaldo no se pudo autenticar: clave incorrecta o archivo dañado");
    }
  } finally { await handle.close(); }
}
