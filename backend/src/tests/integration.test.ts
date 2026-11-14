import { test } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { once } from "node:events"
import argon2 from "argon2"
import { app } from "../app.js"
import { db } from "../prisma/db.js"
import { recoverAdmin } from "../operations/admin-recovery.js"
import { changeAdminEmail } from "../operations/admin-email.js"
import { env } from "../env.js"

// Opt-in only: creates and removes its own isolated data in the configured development DB.
test(
  "real API: authentication, products/photos, idempotency, reservations, concurrent sales, deliveries and totals",
  { skip: process.env.VC_INTEGRATION !== "true" || env.NODE_ENV === "production", timeout: 120000 },
  async () => {
    const marker = randomUUID().slice(0, 8)
    const password = randomUUID()
    const admin = await db.orm.public.AdminUser.create({
      email: `vc-test-${marker}@example.invalid`,
      name: "Prueba de integración",
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
    })
    const server = app.listen(0, "127.0.0.1")
    await once(server, "listening")
    const address = server.address()
    assert(address && typeof address !== "string")
    const base = `http://127.0.0.1:${address.port}/api`
    let cookie = ""
    const productIds: string[] = []
    async function call(
      path: string,
      method = "GET",
      body?: unknown,
      headers: Record<string, string> = {},
    ) {
      const response = await fetch(base + path, {
        method,
        headers: {
          "X-Requested-With": "VentaCelulares",
          Origin: "http://localhost:8443",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(body && !(body instanceof Uint8Array)
            ? { "Content-Type": "application/json" }
            : {}),
          ...headers,
        },
        ...(body
          ? { body: body instanceof Uint8Array ? body : JSON.stringify(body) }
          : {}),
      })
      const data = await response.json()
      return { response, data }
    }
    try {
      assert.equal((await call("/health/ready")).response.status, 200)
      assert.equal((await call("/admin/orders")).response.status, 401)
      assert.equal((await call("/admin/audit")).response.status, 401)
      assert.equal(
        (
          await call("/auth/login", "POST", {
            email: admin.email,
            password: "incorrect",
          })
        ).response.status,
        401,
      )
      const login = await call("/auth/login", "POST", {
        email: admin.email,
        password,
      })
      assert.equal(login.response.status, 200)
      assert.match(login.response.headers.get("set-cookie") || "", /HttpOnly/i)
      cookie = login.response.headers.get("set-cookie")!.split(";")[0]!
      assert.equal((await call("/auth/me")).data.admin.id, admin.id)
      const initialDashboard = (await call("/admin/dashboard")).data
      const body = {
        sku: `VC-TEST-${marker.toUpperCase()}`,
        name: "iPhone de prueba",
        storage: "128 GB",
        color: "Negro",
        battery: "90%",
        price: 1000,
        condition: "usado",
        warrantyDays: 30,
        physicalCondition: "Bueno",
        screenCondition: "Original",
        cameraStatus: "Correcto",
        biometric: "FACE_ID",
        unlockStatus: "Liberado",
        repairHistory: "Sin reparaciones",
        accessories: "Cable",
        observations: "",
        description: "Unidad aislada para prueba de integración",
        verifiedNotRefurbished: true,
        verifiedNoReplacedParts: true,
        techInfoVerified: true,
        isPublished: false,
      }
      const created = await call("/admin/products", "POST", body)
      assert.equal(created.response.status, 201, JSON.stringify(created.data))
      const product = created.data.product
      productIds.push(product.dbId)
      assert.equal((await call(`/products/${product.id}`)).response.status, 404)
      assert.equal(
        (
          await call(`/admin/products/${product.id}`, "PUT", {
            ...body,
            isPublished: true,
          })
        ).response.status,
        400,
      )
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6ZWkAAAAASUVORK5CYII=",
        "base64",
      )
      const upload = await call(
        `/admin/products/${product.id}/photos`,
        "POST",
        png,
        { "Content-Type": "image/png" },
      )
      assert.equal(upload.response.status, 201, JSON.stringify(upload.data))
      const secondUpload = await call(`/admin/products/${product.id}/photos`, "POST", png, { "Content-Type": "image/png" })
      assert.equal(secondUpload.response.status, 201)
      assert.equal((await call(`/admin/products/${product.id}/photos`, "PUT", { photoIds: [secondUpload.data.photo.id, upload.data.photo.id] })).response.status, 200)
      assert.equal(
        (
          await call(
            `/admin/products/${product.id}/photos`,
            "POST",
            Buffer.from("this is not a real image"),
            { "Content-Type": "image/png" },
          )
        ).response.status,
        400,
      )
      assert.equal(
        (
          await call(`/admin/products/${product.id}`, "PUT", {
            ...body,
            isPublished: true,
          })
        ).response.status,
        200,
      )
      assert.equal((await call(`/products/${product.id}`)).response.status, 200)
      assert.equal((await call(`/products/${product.id}`)).data.product.photos[0].id, secondUpload.data.photo.id)
      assert.equal((await call(`/admin/products/${product.id}/photos/${secondUpload.data.photo.id}`, "DELETE")).response.status, 200)
      assert.equal((await call(`/admin/products/${product.id}/photos/${upload.data.photo.id}`, "DELETE")).response.status, 409)
      const orderBody = {
        productId: product.dbId,
        customerName: "Cliente de prueba",
        customerPhone: "0000000000",
        consentAccepted: true,
        deliveryMode: "local",
      }
      assert.equal(
        (
          await call(
            "/orders",
            "POST",
            { ...orderBody, consentAccepted: false },
            { "Idempotency-Key": randomUUID() },
          )
        ).response.status,
        400,
      )
      const key = randomUUID()
      const attempts = await Promise.all([
        call("/orders", "POST", orderBody, { "Idempotency-Key": key }),
        call("/orders", "POST", orderBody, { "Idempotency-Key": key }),
      ])
      assert(
        attempts.every((a) => a.response.status === 201),
        JSON.stringify(attempts.map((a) => a.data)),
      )
      assert.equal(attempts[0]!.data.order.folio, attempts[1]!.data.order.folio)
      const order = attempts[0]!.data.order
      assert.match(order.folio, /^VC-\d{4}-[0-9A-F]{12}$/)
      assert(
        attempts[0]!.data.whatsappUrl.includes(encodeURIComponent(order.folio)),
      )
      const another = await call("/orders", "POST", orderBody, {
        "Idempotency-Key": randomUUID(),
      })
      assert.notEqual(another.data.order.folio, order.folio)
      assert.equal(
        (
          await call(`/admin/orders/${order.id}`, "PATCH", {
            status: "confirmada",
          })
        ).response.status,
        200,
      )
      assert.equal(
        (
          await call(`/admin/orders/${another.data.order.id}`, "PATCH", {
            status: "confirmada",
          })
        ).response.status,
        409,
      )
      assert.equal(
        (
          await call(`/admin/orders/${order.id}`, "PATCH", {
            status: "cancelada",
          })
        ).response.status,
        200,
      )
      assert.equal(
        (
          await call(`/admin/orders/${another.data.order.id}`, "PATCH", {
            status: "confirmada",
          })
        ).response.status,
        200,
      )
      const winnerOrder = another.data.order
      const saleBody = {
        productId: product.dbId,
        orderId: winnerOrder.id,
        finalPrice: 950,
        paymentMethod: "Efectivo",
      }
      const sales = await Promise.all([
        call("/admin/sales", "POST", saleBody),
        call("/admin/sales", "POST", saleBody),
      ])
      assert.deepEqual(sales.map((s) => s.response.status).sort(), [201, 409])
      assert.equal(
        (
          await call("/orders", "POST", orderBody, {
            "Idempotency-Key": randomUUID(),
          })
        ).response.status,
        409,
      )
      assert.equal(
        (
          await call(`/admin/products/${product.id}/status`, "PATCH", {
            status: "Disponible",
            expectedStatus: "Vendido",
          })
        ).response.status,
        409,
      )
      assert.equal(
        (
          await call(`/admin/orders/${winnerOrder.id}/delivery`, "PUT", {
            mode: "envio",
            destination: "Calle Prueba 123, Ciudad, CP 00000",
            carrier: "Prueba",
            trackingNumber: "TEST-001",
            status: "en_ruta",
            notes: "Prueba sin envío real",
          })
        ).response.status,
        200,
      )
      assert.equal(
        (
          await call(`/admin/orders/${winnerOrder.id}/delivery`, "PUT", {
            mode: "envio",
            destination: "Calle Prueba 123, Ciudad, CP 00000",
            status: "entregado",
          })
        ).response.status,
        200,
      )
      const dashboard = (await call("/admin/dashboard")).data
      assert.equal(dashboard.revenue - initialDashboard.revenue, 950)
      assert.equal(dashboard.salesCount - initialDashboard.salesCount, 1)
      assert((await call("/admin/orders")).data.orders.some((o: { id: string }) => o.id === order.id))
      assert((await call("/admin/sales")).data.sales.some((s: { productId: string }) => s.productId === product.dbId))
      assert((await call("/admin/audit")).data.logs.some((l: { entityId: string }) => l.entityId === product.dbId))
      const auditPage = await call(`/admin/audit?entityType=Product&entityId=${product.dbId}&limit=2&page=1`)
      assert.equal(auditPage.response.status, 200)
      assert.equal(auditPage.data.logs.length, 2)
      assert(auditPage.data.total > 2)
      assert(auditPage.data.pages > 1)
      assert(auditPage.data.logs.every((log: { entityId: string; entityType: string; admin: Record<string, unknown> }) => log.entityId === product.dbId && log.entityType === "Product" && !Object.hasOwn(log.admin, "passwordHash")))
      assert(new Date(auditPage.data.logs[0].createdAt) >= new Date(auditPage.data.logs[1].createdAt))
      const auditNext = await call(`/admin/audit?entityId=${product.dbId}&limit=2&page=2`)
      assert.equal(auditNext.data.page, 2)
      assert(auditNext.data.logs.every((entry: { id: string }) => !auditPage.data.logs.some((first: { id: string }) => first.id === entry.id)))
      const saleAudit = await call(`/admin/audit?entityId=${product.dbId}&action=sale`)
      assert.equal(saleAudit.data.total, 1)
      assert.equal(saleAudit.data.logs[0].action, "sale")
      assert.equal((await call("/admin/audit?from=2026-11-15&to=2026-11-14")).response.status, 400)
      assert.equal((await call("/admin/audit?limit=999")).response.status, 400)
      assert.equal((await call("/admin/audit?entityId=does-not-exist")).data.total, 0)
      assert.equal(
        (await call(`/admin/products/${product.id}`, "DELETE")).response.status,
        200,
      )
      assert.equal((await call(`/products/${product.id}`)).response.status, 404)
      assert.equal(
        (
          await call("/auth/logout", "POST", undefined, {
            Origin: "https://untrusted.example",
          })
        ).response.status,
        403,
      )
      assert.equal((await call("/auth/logout", "POST")).response.status, 200)
      assert.equal(
        (await call("/auth/me")).response.status,
        401,
        "The old session token must be invalid after logout",
      )
      const again = await call("/auth/login", "POST", {
        email: admin.email,
        password,
      })
      cookie = again.response.headers.get("set-cookie")!.split(";")[0]!
      const newPassword = randomUUID()
      assert.equal(
        (
          await call("/auth/password", "POST", {
            currentPassword: "incorrect",
            newPassword,
          })
        ).response.status,
        400,
      )
      assert.equal(
        (
          await call("/auth/password", "POST", {
            currentPassword: password,
            newPassword,
          })
        ).response.status,
        200,
      )
      assert.equal(
        (await call("/auth/me")).response.status,
        401,
        "Password changes revoke all sessions",
      )
      assert.equal(
        (await call("/auth/login", "POST", { email: admin.email, password }))
          .response.status,
        401,
      )
      const changed = await call("/auth/login", "POST", {
        email: admin.email,
        password: newPassword,
      })
      assert.equal(changed.response.status, 200)
      cookie = changed.response.headers.get("set-cookie")!.split(";")[0]!
      const nextEmail = `vc-test-${marker}-updated@example.invalid`
      const emailChange = await changeAdminEmail(admin.id, nextEmail)
      assert.equal(emailChange.changed, true)
      assert.equal((await call("/auth/me")).response.status, 401, "Changing email revokes sessions")
      assert.equal((await call("/auth/login", "POST", { email: admin.email, password: newPassword })).response.status, 401)
      const updatedLogin = await call("/auth/login", "POST", { email: nextEmail, password: newPassword })
      assert.equal(updatedLogin.response.status, 200, "Email changes preserve the existing password")
      cookie = updatedLogin.response.headers.get("set-cookie")!.split(";")[0]!
      await recoverAdmin({ email: nextEmail, password: randomUUID() })
      assert.equal((await call("/auth/me")).response.status, 401, "Operator recovery revokes existing sessions")
      assert.equal((await call("/auth/login", "POST", { email: nextEmail, password: newPassword })).response.status, 401)
    } catch (error) {
      console.error("Integration assertion failed:", error)
      throw error
    } finally {
      try {
        const { storage } = await import("../storage.js")
        const { env } = await import("../env.js")
        for (const id of productIds) {
          const photos = await db.orm.public.ProductPhoto.where({
            productId: id,
          }).all()
          if (storage && photos.length)
            await storage.storage
              .from(env.SUPABASE_STORAGE_BUCKET)
              .remove(photos.map((p) => p.storageKey))
          await db.transaction(async (tx) => {
            const orders = await tx.orm.public.Order.where({
              productId: id,
            }).all()
            for (const order of orders)
              await tx.orm.public.Delivery.where({
                orderId: order.id,
              }).deleteAll()
            await tx.orm.public.Sale.where({ productId: id }).deleteAll()
            await tx.orm.public.Order.where({ productId: id }).deleteAll()
            await tx.orm.public.ProductPhoto.where({
              productId: id,
            }).deleteAll()
            await tx.orm.public.Product.where({ id }).deleteAll()
          })
        }
        await db.orm.public.AuditLog.where({ adminId: admin.id }).deleteAll()
        await db.orm.public.AdminSession.where({
          adminId: admin.id,
        }).deleteAll()
        await db.orm.public.AdminUser.where({ id: admin.id }).deleteAll()
      } finally {
        server.closeAllConnections()
        await new Promise<void>((resolve) => server.close(() => resolve()))
        await db.close()
      }
    }
  },
)
