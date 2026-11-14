import { secureDatabaseUrl } from "../operations/database.js";
import "../env.js"
import { Client } from "pg"
import { env } from "../env.js"
import { storage } from "../storage.js"
// Only the integration suite's explicitly marked synthetic fixtures are eligible.
const client = new Client({
  connectionString: secureDatabaseUrl(process.env.DIRECT_URL || env.DATABASE_URL),
  connectionTimeoutMillis: 10000,
})
async function main() {
  await client.connect()
  const { rows: products } = await client.query(
    `SELECT id FROM "Product" WHERE sku LIKE 'VC-TEST-%' AND description='Unidad aislada para prueba de integración'`,
  )
  for (const product of products) {
    const { rows: photos } = await client.query(
      `SELECT "storageKey" FROM "ProductPhoto" WHERE "productId"=$1`,
      [product.id],
    )
    if (storage && photos.length) {
      const { error } = await storage.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove(photos.map((p) => p.storageKey))
      if (error) throw error
    }
    await client.query("BEGIN")
    try {
      await client.query(
        `DELETE FROM "Delivery" WHERE "orderId" IN (SELECT id FROM "Order" WHERE "productId"=$1)`,
        [product.id],
      )
      await client.query(`DELETE FROM "Sale" WHERE "productId"=$1`, [
        product.id,
      ])
      await client.query(`DELETE FROM "Order" WHERE "productId"=$1`, [
        product.id,
      ])
      await client.query(`DELETE FROM "ProductPhoto" WHERE "productId"=$1`, [
        product.id,
      ])
      await client.query(`DELETE FROM "Product" WHERE id=$1`, [product.id])
      await client.query("COMMIT")
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    }
  }
  await client.query("BEGIN")
  try {
    const { rows: admins } = await client.query(
      `SELECT id FROM "AdminUser" WHERE email LIKE 'vc-test-%@example.invalid' AND name='Prueba de integración'`,
    )
    for (const admin of admins) {
      await client.query(`DELETE FROM "AuditLog" WHERE "adminId"=$1`, [
        admin.id,
      ])
      await client.query(`DELETE FROM "AdminSession" WHERE "adminId"=$1`, [
        admin.id,
      ])
      await client.query(`DELETE FROM "AdminUser" WHERE id=$1`, [admin.id])
    }
    await client.query("COMMIT")
    console.log(
      `Limpieza terminada: ${products.length} unidades y ${admins.length} administradores de prueba. Datos del negocio conservados.`,
    )
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }
}
main()
  .catch(() => {
    console.error("No se pudo completar la limpieza de pruebas.")
    process.exitCode = 1
  })
  .finally(() => client.end())
