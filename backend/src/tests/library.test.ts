import { test } from "node:test";
import assert from "node:assert/strict";
import { iphoneModels, matchingReference, referenceIsAvailable, resolveReference } from "../catalog/library.js";
import { productSchema } from "../domain.js";

test("library distinguishes real model families and camera layouts", () => {
  assert.equal(iphoneModels.length, 28);
  assert.equal(iphoneModels.reduce((count, model) => count + model.colors.length, 0), 126);
  assert.equal(iphoneModels.some((model) => ["iphone-14-mini", "iphone-17-plus", "iphone-18"].includes(model.id)), false);
  assert.notEqual(resolveReference("iphone-12/negro")?.model.cameraLayout, resolveReference("iphone-13/medianoche")?.model.cameraLayout);
  assert.equal(resolveReference("iphone-15/negro")?.model.cameraCount, 2);
  assert.equal(resolveReference("iphone-15-pro/titanio-negro")?.model.cameraCount, 3);
  assert.equal(resolveReference("iphone-16e/negro")?.model.cameraCount, 1);
  assert.equal(resolveReference("iphone-15-pro/rosa"), null);
  assert.equal(resolveReference("iphone-12/negro/"), null);
  assert.equal(resolveReference("../../secrets/key"), null);
  assert.equal(matchingReference(" iPhone 15 Pro ", "Titanio natural"), "iphone-15-pro/titanio-natural");
  assert.equal(matchingReference("iPhone 15 Pro Max", "Rosa"), null);
});

test("every registered model/color resolves to an available distinct photograph", () => {
  const urls = new Set<string>();
  for (const model of iphoneModels) for (const color of model.colors) {
    const id = `${model.id}/${color.id}`;
    assert(referenceIsAvailable(id), id);
    const reference = resolveReference(id)!;
    assert(!urls.has(reference.url), `Photo incorrectly reused: ${id}`);
    urls.add(reference.url);
  }
});

test("publishing rejects a photo for another model, finish or capacity", () => {
  const product = {
    sku: "VC-LIBRARY-TEST", name: "iPhone 15 Pro", storage: "256 GB", color: "Titanio natural",
    referenceVariantId: "iphone-15-pro/titanio-natural", battery: "95%", price: 10000,
    condition: "seminuevo", warrantyDays: 30, physicalCondition: "Bueno", screenCondition: "Original",
    cameraStatus: "Correctas", biometric: "FACE_ID", unlockStatus: "Liberado", repairHistory: "Sin reparaciones",
    accessories: "Cable", observations: "", description: "Unidad de prueba", isPublished: true,
    verifiedNotRefurbished: true, verifiedNoReplacedParts: true, techInfoVerified: true,
  };
  assert(productSchema.safeParse(product).success);
  for (const patch of [
    { name: "iPhone 15 Pro Max" }, { color: "Rosa" }, { storage: "64 GB" },
    { referenceVariantId: "iphone-15/negro" }, { referenceVariantId: "iphone-18/negro" },
    { techInfoVerified: false }, { verifiedNoReplacedParts: false },
  ]) assert.equal(productSchema.safeParse({ ...product, ...patch }).success, false, JSON.stringify(patch));
  assert(productSchema.safeParse({ ...product, name: "Otro teléfono", referenceVariantId: null }).success);
});
