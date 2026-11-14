import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { db } from "../prisma/db.js";
import { changeAdminEmail } from "../operations/admin-email.js";
async function main() {
  const email = z.email().trim().toLowerCase().parse(process.argv[2]);
  const users = await db.orm.public.AdminUser.select("id").all();
  if (users.length !== 1) throw new Error("Se esperaba una única cuenta administrativa");
  const result = await changeAdminEmail(users[0]!.id, email);
  const file = fileURLToPath(new URL("../../.env", import.meta.url));
  const source = await readFile(file, "utf8");
  const setting = `ADMIN_EMAIL=${JSON.stringify(email)}`;
  await writeFile(file, /^ADMIN_EMAIL=.*$/m.test(source) ? source.replace(/^ADMIN_EMAIL=.*$/m, setting) : source.trimEnd() + "\n" + setting + "\n", { mode: 0o600 });
  console.log(JSON.stringify({ ...result, passwordPreserved: true, privateSeedConfigUpdated: true }));
}
main().catch(() => { console.error("No se pudo completar el cambio controlado de correo. Revisa la conexión y la cuenta existente."); process.exitCode = 1; }).finally(() => db.close());
