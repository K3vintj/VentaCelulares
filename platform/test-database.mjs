import { PGlite } from "@electric-sql/pglite"
import { readFile, readdir } from "node:fs/promises"
import assert from "node:assert/strict"

const migrationRoot = new URL("../backend/migrations/app/", import.meta.url)
const db = new PGlite()
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role vc_runtime;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
  `)
  for (const migration of (await readdir(migrationRoot)).filter((name) => /^\d/.test(name)).sort()) {
    const operations = JSON.parse(await readFile(new URL(migration + "/ops.json", migrationRoot), "utf8"))
    for (const statement of operations.flatMap((operation) => operation.execute)) {
      if (statement.params?.length) await db.query(statement.sql, statement.params)
      else await db.exec(statement.sql)
    }
  }
  await db.exec(await readFile(new URL("../supabase/migrations/202611200001_store_platform.sql", import.meta.url), "utf8"))
  await db.exec(`
    insert into public."AdminUser"(id,email,name,"passwordHash","updatedAt")
      values('test-admin','admin@example.invalid','Admin de prueba','test',now());
    insert into auth.users values('00000000-0000-4000-8000-000000000001');
    insert into public."StoreAdminAuth"("adminId","authUserId",enabled)
      values('test-admin','00000000-0000-4000-8000-000000000001',true);
    set role anon;
  `)
  await assert.rejects(db.query("select public.vc_store_call('public.products')"), { code: "42501" })
  await db.exec("set role authenticated")
  await assert.rejects(db.query("select public.vc_store_call('admin.orders')"), { code: "42501" })
  await db.exec("set role service_role")
  const call = async (operation, args = {}, actor = "test-admin") => {
    const { rows } = await db.query("select public.vc_store_call($1,$2::jsonb,$3) as result", [operation, JSON.stringify(args), actor])
    return rows[0].result
  }
  const userId = "00000000-0000-4000-8000-000000000001"
  const sessionHash = "a".repeat(64)
  await assert.rejects(call("auth.me", { userId, sessionHash }), { code: "P0001", detail: "401" })
  await call("auth.open", { userId, sessionHash })
  assert.equal((await call("auth.me", { userId, sessionHash })).admin.id, "test-admin")
  await call("admin.auth.close", { sessionHash })
  await assert.rejects(call("auth.me", { userId, sessionHash }), { code: "P0001", detail: "401" })
  await assert.rejects(call("admin.orders", {}, null), { code: "P0001", detail: "401" })
  await call("admin.config", { businessName: "Tienda de prueba", whatsapp: "520000000000", warrantyDays: 30, noticesJson: [] })
  assert.equal((await call("public.ready")).database, true)
  const product = {
    sku: "VC-TEST", name: "iPhone 15 Pro", storage: "256 GB", color: "Titanio natural",
    referenceVariantId: "iphone-15-pro/titanio-natural", battery: "90%", price: 1000,
    condition: "usado", warrantyDays: 30, physicalCondition: "Bueno", screenCondition: "Original",
    cameraStatus: "Correcto", biometric: "FACE_ID", unlockStatus: "Liberado", repairHistory: "Sin reparaciones",
    accessories: "", observations: "", description: "Prueba", verifiedNotRefurbished: true,
    verifiedNoReplacedParts: true, techInfoVerified: true, isPublished: true,
  }
  const { product: created } = await call("admin.product.create", { product })
  const { product: updated } = await call("admin.product.update", { id: created.id, product: { ...product, price: 1100 } })
  assert.equal(updated.price, 1100)
  const { photo } = await call("admin.photo.add", { id: product.sku, url: "https://example.invalid/photo.jpg", storageKey: "test/photo.jpg" })
  await call("admin.photo.reorder", { id: product.sku, photoIds: [photo.id] })
  assert.equal((await call("admin.photo.remove", { id: product.sku, photoId: photo.id })).storageKey, "test/photo.jpg")
  const request = { productId: product.sku, requestKey: crypto.randomUUID(), customerName: "Cliente de prueba", customerPhone: "0000000000", deliveryMode: "local" }
  const { order } = await call("public.order.create", request)
  assert.equal((await call("public.order.create", request)).order.id, order.id)
  await call("admin.reserve", { productId: product.sku, expectedStatus: "Disponible", orderId: order.id })
  assert.equal((await call("admin.orders", { status: "confirmada", deliveryStatus: "pendiente" })).total, 1)
  assert.equal((await call("admin.products")).products[0].linkedOrder.id, order.id)
  assert.equal(Object.hasOwn((await call("public.products")).products[0], "linkedOrder"), false)
  await call("admin.order.status", { id: order.id, status: "cancelada" })
  assert.equal((await call("public.product", { id: product.sku })).product.status, "Disponible")
  const { order: reserved } = await call("admin.reserve", { ...request, requestKey: crypto.randomUUID(), expectedStatus: "Disponible" })
  const sale = { orderId: reserved.id, productId: product.sku, finalPrice: 1100, paymentMethod: "Efectivo" }
  await call("admin.sale.create", sale)
  await assert.rejects(call("admin.sale.create", sale), { code: "P0001", detail: "409" })
  const delivery = { mode: "local", status: "entregado", destination: null, carrier: null, trackingNumber: null, notes: null }
  await call("admin.delivery", { id: reserved.id, delivery })
  assert.equal((await call("admin.orders", { status: "sold", deliveryStatus: "entregado" })).total, 1)
  assert.equal((await call("admin.dashboard")).revenue, 1100)
  assert.equal((await call("admin.sales")).sales.length, 1)
  assert.equal((await call("admin.audit", { action: "sale", limit: 1 })).total, 1)
  await call("admin.product.archive", { id: product.sku })
  assert.equal((await call("public.products")).total, 0)
  const rate = () => db.query("select public.vc_store_rate('test',1,60) as allowed")
  assert.equal((await rate()).rows[0].allowed, true)
  assert.equal((await rate()).rows[0].allowed, false)
  console.log("PostgreSQL: verified permissions, sessions, catalog, photos, orders, reservations, sales, delivery and audit.")
} finally {
  await db.close()
}
