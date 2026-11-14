import { secureDatabaseUrl } from "../operations/database.js";
import "../env.js"
import { readFile } from "node:fs/promises"
import { Client } from "pg"
import { env } from "../env.js"
const client = new Client({
  connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL),
  connectionTimeoutMillis: 10000,
})
async function main() {
  const sql = await readFile(
    new URL("../../sql/20261114_access.sql", import.meta.url),
    "utf8",
  )
  await client.connect()
  await client.query("BEGIN")
  try {
    await client.query(sql)
    // Prove the anonymous Data API role cannot read private data.
    await client.query("SET LOCAL ROLE anon")
    const { rows } = await client.query(
      `SELECT has_table_privilege(current_user, 'public."Order"', 'SELECT') AS can_read_orders, has_table_privilege(current_user, 'public."AdminUser"', 'SELECT') AS can_read_admins`,
    )
    if (rows[0].can_read_orders || rows[0].can_read_admins)
      throw new Error("Anonymous access remains enabled")
    await client.query("RESET ROLE")
    await client.query("COMMIT")
    console.log(
      "RLS activo en las nueve tablas. Sin privilegios para anon/authenticated/PUBLIC. Acceso anónimo a pedidos y administradores denegado.",
    )
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }
}
main()
  .catch(() => {
    console.error("No se aplicaron los cambios de acceso. Revisa permisos.")
    process.exitCode = 1
  })
  .finally(() => client.end())
