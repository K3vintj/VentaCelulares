import { randomBytes } from "node:crypto";
import { db } from "./prisma/db.js";
import { resolveReference } from "./catalog/references.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export { statusSchema, productSchema, orderSchema, deliverySchema } from "./validation.js";

export function createOrderFolio() {
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Mexico_City" }).format(new Date());
  return `VC-${year}-${randomBytes(6).toString("hex").toUpperCase()}`;
}

export async function audit(tx: Tx, adminId: string, action: string, entityType: string, entityId: string, details: Record<string, unknown> = {}) {
  await tx.orm.public.AuditLog.create({ adminId, action, entityType, entityId, details: JSON.parse(JSON.stringify(details)) });
}
export async function findProduct(tx: Pick<Tx, "orm">, identifier: string, lock = false) {
  const byId = tx.orm.public.Product.where({ id: identifier });
  const found = await (lock ? byId.forNoKeyUpdate() : byId).first();
  if (found) return found;
  const bySku = tx.orm.public.Product.where({ sku: identifier });
  return (lock ? bySku.forNoKeyUpdate() : bySku).first();
}
export const productQuery = (tx: Pick<Tx, "orm"> = db) => tx.orm.public.Product.include("photos", (p) => p.orderBy((f) => f.sortOrder.asc()));
type ProductWithPhotos = Awaited<ReturnType<ReturnType<typeof productQuery>["all"]>>[number];
export function formatProduct(p: ProductWithPhotos) {
  const reference = resolveReference(p.referenceVariantId);
  const photos = [
    ...(reference ? [{ id: `reference:${reference.id}`, url: reference.url, storageKey: "", sortOrder: -1, kind: "reference" as const }] : []),
    ...p.photos.map((photo) => ({ ...photo, kind: "unit" as const })),
  ];
  return { ...p, id: p.sku, dbId: p.id, biometric: p.biometric === "FACE_ID" ? "Face ID" : p.biometric === "TOUCH_ID" ? "Touch ID" : "No aplica", photos, image: photos[0]?.url || "/favicon.svg", imageKind: photos[0]?.kind || "unit" };
}
