import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "./prisma/db.js";
import { normalize, referenceIsAvailable, resolveReference } from "./catalog/library.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export const statusSchema = z.enum(["Disponible", "Reservado", "Vendido"]);
const text = z.string().trim().max(2000);
export const productSchema = z.object({
  sku: z.string().trim().min(3).max(40).regex(/^[A-Z0-9-]+$/),
  name: text.min(2), storage: text.min(1), color: text.min(1),
  battery: z.string().regex(/^(100|[0-9]{1,2})%$/),
  price: z.number().int().min(1).max(10_000_000),
  condition: z.enum(["nuevo", "seminuevo", "usado"]), conditionNote: text.nullish(),
  warrantyDays: z.number().int().min(1).max(3650),
  physicalCondition: text.min(1), screenCondition: text.min(1), cameraStatus: text.min(1),
  biometric: z.enum(["FACE_ID", "TOUCH_ID", "NO_APLICA"]), unlockStatus: text.min(1),
  repairHistory: text.min(1), accessories: text, observations: text, description: text.min(1),
  verifiedNotRefurbished: z.boolean(), verifiedNoReplacedParts: z.boolean(), techInfoVerified: z.boolean(),
  isPublished: z.boolean(),
  referenceVariantId: z.string().max(120).nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.referenceVariantId) {
    const reference = resolveReference(value.referenceVariantId);
    if (!reference || !referenceIsAvailable(value.referenceVariantId)) ctx.addIssue({ code: "custom", path: ["referenceVariantId"], message: "Selecciona una imagen de biblioteca disponible" });
    else {
      if (normalize(reference.model.name) !== normalize(value.name) || normalize(reference.color.name) !== normalize(value.color)) ctx.addIssue({ code: "custom", path: ["referenceVariantId"], message: "La imagen debe coincidir con el modelo y su color" });
      if (!reference.model.storage.includes(value.storage)) ctx.addIssue({ code: "custom", path: ["storage"], message: "Esta capacidad no corresponde al modelo seleccionado" });
    }
  }
  if (value.isPublished && !(value.verifiedNotRefurbished && value.verifiedNoReplacedParts && value.techInfoVerified)) {
    ctx.addIssue({ code: "custom", path: ["isPublished"], message: "Completa las verificaciones comerciales y técnicas antes de publicar" });
  }
});
export const orderSchema = z.object({
  productId: z.string().min(1).max(80), customerName: text.min(2).max(120),
  customerPhone: z.string().trim().regex(/^\+?[\d\s()-]{10,25}$/).transform((v) => v.replace(/[^\d+]/g, "")),
  consentAccepted: z.literal(true), deliveryMode: z.enum(["local", "envio"]),
  shippingDestination: text.max(600).optional(),
}).refine((v) => v.deliveryMode !== "envio" || (v.shippingDestination?.length || 0) >= 8, { path: ["shippingDestination"], message: "Indica el destino del envío" });
export const deliverySchema = z.object({
  mode: z.enum(["local", "envio"]), destination: text.max(600).nullable().default(null),
  carrier: text.max(120).nullable().default(null), trackingNumber: text.max(120).nullable().default(null),
  status: z.enum(["pendiente", "en_ruta", "entregado", "incidencia"]), notes: text.nullable().default(null),
}).refine((v) => v.mode !== "envio" || (v.destination?.length || 0) >= 8, { message: "Indica el destino del envío" });

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
