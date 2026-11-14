import "../env.js";
import { initializeKey } from "../operations/archive.js";
import { createBackup, verifyBackup } from "../operations/backup.js";
const command = process.argv[2] || "create";
async function main() {
  if (command === "init") await initializeKey();
  else if (command === "create") console.log(JSON.stringify(await createBackup(process.argv[3]), null, 2));
  else if (command === "verify" && process.argv[3]) console.log(JSON.stringify(await verifyBackup(process.argv[3]), null, 2));
  else if (command === "recover" && process.argv[3]) console.log(JSON.stringify(await verifyBackup(process.argv[3], true), null, 2));
  else throw new Error("Uso: backup init | create [archivo] | verify archivo | recover archivo");
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Operación de respaldo fallida"); process.exitCode = 1; });
