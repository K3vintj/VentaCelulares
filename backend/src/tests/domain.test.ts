import { test } from "node:test"
import assert from "node:assert/strict"
import { orderSchema, productSchema, deliverySchema } from "../domain.js"
test("an order requires consent and a shipping destination when applicable", () => {
  const data = {
    productId: "VC-001",
    customerName: "Cliente Prueba",
    customerPhone: "921 111 2222",
    consentAccepted: true,
    deliveryMode: "local",
  }
  assert.equal(orderSchema.parse(data).customerPhone, "9211112222")
  assert.equal(
    orderSchema.safeParse({ ...data, consentAccepted: false }).success,
    false,
  )
  assert.equal(
    orderSchema.safeParse({ ...data, deliveryMode: "envio" }).success,
    false,
  )
  assert.equal(
    orderSchema.safeParse({ ...data, customerPhone: "bad" }).success,
    false,
  )
})
test("published products require all verification flags and valid battery/price", () => {
  const data = {
    sku: "VC-TEST",
    name: "iPhone test",
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
    description: "Equipo de prueba",
    verifiedNotRefurbished: true,
    verifiedNoReplacedParts: true,
    techInfoVerified: true,
    isPublished: true,
  }
  assert.equal(productSchema.safeParse(data).success, true)
  assert.equal(
    productSchema.safeParse({ ...data, techInfoVerified: false }).success,
    false,
  )
  assert.equal(
    productSchema.safeParse({ ...data, battery: "101%" }).success,
    false,
  )
  assert.equal(productSchema.safeParse({ ...data, price: -1 }).success, false)
})
test("shipping deliveries require a meaningful address", () => {
  assert.equal(
    deliverySchema.safeParse({ mode: "envio", status: "pendiente" }).success,
    false,
  )
  assert.equal(
    deliverySchema.safeParse({ mode: "local", status: "entregado" }).success,
    true,
  )
})
