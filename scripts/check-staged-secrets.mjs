import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dotenv = require("../backend/node_modules/dotenv");
const secrets = [];
if (existsSync("backend/.env")) {
  const env = dotenv.parse(readFileSync("backend/.env"));
  for (const name of ["DATABASE_URL", "DIRECT_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "ADMIN_INITIAL_PASSWORD"]) {
    if (env[name]?.length >= 12) secrets.push([name, env[name]]);
    if (name.endsWith("_URL") && env[name]) {
      try { const password = decodeURIComponent(new URL(env[name]).password); if (password.length >= 12) secrets.push([name + " password", password]); } catch {}
    }
  }
}
if (existsSync(".backups/key.hex")) secrets.push(["backup encryption key", readFileSync(".backups/key.hex", "utf8").trim()]);
const result = spawnSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"], { encoding: "utf8" });
if (result.status !== 0) throw new Error("No se pudo revisar el índice de Git");
const files = result.stdout.split("\0").filter(Boolean);
const problems = [];
for (const file of files) {
  if (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".example")) problems.push({ file, reason: "private environment file" });
  if (/\.backups\/|\.vcbackup$|\.(?:dump|key|pem)$/.test(file)) problems.push({ file, reason: "private backup/key" });
  const body = spawnSync("git", ["show", ":" + file], { maxBuffer: 20 * 1024 * 1024 }).stdout;
  for (const [name, value] of secrets) if (value && body.includes(Buffer.from(value))) problems.push({ file, reason: name });
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(body.toString())) problems.push({ file, reason: "private key material" });
}
if (problems.length) { console.error(JSON.stringify({ blocked: problems }, null, 2)); process.exitCode = 1; }
else console.log(`Revisados ${files.length} archivos en el índice: sin credenciales locales, respaldos ni claves privadas.`);
