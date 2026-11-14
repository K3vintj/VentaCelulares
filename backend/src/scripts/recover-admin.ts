import { recoverAdmin } from "../operations/admin-recovery.js";
import { db } from "../prisma/db.js";
async function main() {
  if (process.argv[2] !== "--stdin" || process.stdin.isTTY) throw new Error("Usa el procedimiento de recuperación con entrada privada por stdin");
  let value = "";
  for await (const chunk of process.stdin) {
    value += chunk.toString();
    if (value.length > 4096) throw new Error("Entrada demasiado grande");
  }
  await recoverAdmin(JSON.parse(value.replace(/^\uFEFF/, "")));
  value = "";
  console.log("Contraseña actualizada. Todas las sesiones fueron revocadas. Ingresa con tu contraseña nueva.");
}
main().catch(() => { console.error("Recuperación no completada. Revisa el correo, la conexión y la longitud de la contraseña."); process.exitCode = 1; }).finally(() => db.close());
