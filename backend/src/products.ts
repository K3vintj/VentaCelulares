import { Router, raw } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit, findProduct, formatProduct, productQuery, productSchema, statusSchema } from "./domain.js";
import { ensure } from "./http.js";
import { storage } from "./storage.js";
import { env } from "./env.js";

export const publicProducts = Router();
publicProducts.get("/", async (req, res) => {
  const query = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(500).default(500), q: z.string().max(120).default("") }).parse(req.query);
  let products = await productQuery().where({ isPublished: true, isArchived: false }).orderBy((p) => p.createdAt.desc()).all();
  if (query.q) products = products.filter((p) => `${p.name} ${p.sku}`.toLowerCase().includes(query.q.toLowerCase()));
  res.json({ products: products.slice((query.page - 1) * query.limit, query.page * query.limit).map(formatProduct), total: products.length });
});
publicProducts.get("/:id", async (req, res) => {
  const p = await productQuery().where({ sku: req.params.id, isPublished: true, isArchived: false }).first();
  ensure(p, 404, "Equipo no encontrado");
  res.json({ product: formatProduct(p) });
});
export const products = Router();
products.get("/", async (_req, res) => {
  res.json({ products: (await productQuery().where({ isArchived: false }).orderBy((p) => p.createdAt.desc()).all()).map(formatProduct) });
});
products.post("/", async (req, res) => {
  const input = productSchema.parse(req.body);
  // New equipment must start as a draft, so its actual photos can be uploaded first.
  ensure(!input.isPublished, 400, "Guarda el borrador y agrega fotografías antes de publicar");
  const product = await db.transaction(async (tx) => {
    ensure(!await tx.orm.public.Product.where({ sku: input.sku }).first(), 409, "El código ya existe");
    const p = await tx.orm.public.Product.create({ ...input, conditionNote: input.conditionNote || null });
    await audit(tx, res.locals.admin.id, "create", "Product", p.id);
    return p;
  });
  res.status(201).json({ product: formatProduct({ ...product, photos: [] }) });
});
products.put("/:id", async (req, res) => {
  const input = productSchema.parse(req.body);
  const product = await db.transaction(async (tx) => {
    const p = await findProduct(tx, req.params.id as string, true);
    ensure(p && !p.isArchived, 404, "Equipo no encontrado");
    ensure(input.sku === p.sku, 400, "El código de una unidad existente no se puede cambiar");
    if (input.isPublished) ensure(await tx.orm.public.ProductPhoto.where({ productId: p.id }).first(), 400, "Agrega al menos una foto antes de publicar");
    await tx.orm.public.Product.where({ id: p.id }).update({ ...input, conditionNote: input.conditionNote || null });
    await audit(tx, res.locals.admin.id, "update", "Product", p.id);
    return productQuery(tx).where({ id: p.id }).first();
  });
  ensure(product, 404, "Equipo no encontrado");
  res.json({ product: formatProduct(product) });
});
products.patch("/:id/status", async (req, res) => {
  const input = z.object({ status: statusSchema, expectedStatus: statusSchema }).parse(req.body);
  const product = await db.transaction(async (tx) => {
    const p = await findProduct(tx, req.params.id as string, true);
    ensure(p && !p.isArchived, 404, "Equipo no encontrado");
    ensure(p.status === input.expectedStatus, 409, "La disponibilidad cambió. Actualiza el inventario.");
    ensure(input.status !== "Vendido", 400, "Registra la venta desde Pedidos o Ventas");
    ensure(p.status !== "Vendido", 409, "Una venta confirmada no se puede revertir desde inventario");
    ensure(input.status !== p.status, 409, "El equipo ya tiene ese estado");
    ensure(!await tx.orm.public.Order.where({ productId: p.id, status: "confirmada" }).first(), 409, "Actualiza o cancela primero el pedido confirmado");
    await tx.orm.public.Product.where({ id: p.id }).update({ status: input.status });
    await audit(tx, res.locals.admin.id, "status", "Product", p.id, { from: p.status, to: input.status });
    return productQuery(tx).where({ id: p.id }).first();
  });
  ensure(product, 404, "Equipo no encontrado");
  res.json({ product: formatProduct(product) });
});
products.delete("/:id", async (req, res) => {
  await db.transaction(async (tx) => {
    const p = await findProduct(tx, req.params.id as string, true);
    ensure(p, 404, "Equipo no encontrado");
    ensure(p.status !== "Reservado", 409, "Libera o resuelve la reserva antes de archivar");
    await tx.orm.public.Product.where({ id: p.id }).update({ isPublished: false, isArchived: true });
    await audit(tx, res.locals.admin.id, "archive", "Product", p.id);
  });
  res.json({ ok: true });
});

// Raw image uploads avoid buffering multipart fields and never accept a storage key from the client.
products.post("/:id/photos", raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "5mb" }), async (req, res) => {
  ensure(storage, 503, "El almacenamiento de fotografías no está configurado");
  const bytes = req.body as Buffer;
  ensure(Buffer.isBuffer(bytes) && bytes.length > 12, 400, "Selecciona una imagen JPEG, PNG o WebP");
  const mime = req.get("Content-Type")?.split(";")[0];
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  ensure((mime === "image/jpeg" && jpeg) || (mime === "image/png" && png) || (mime === "image/webp" && webp), 400, "El contenido no corresponde a una imagen admitida");
  const p = await findProduct(db, req.params.id as string);
  ensure(p && !p.isArchived, 404, "Equipo no encontrado");
  const key = `${p.id}/${randomUUID()}.${png ? "png" : webp ? "webp" : "jpg"}`;
  const bucket = storage.storage.from(env.SUPABASE_STORAGE_BUCKET);
  const { error } = await bucket.upload(key, bytes, { contentType: mime!, upsert: false });
  ensure(!error, 502, "No se pudo subir la imagen. Verifica Storage.");
  try {
    const photo = await db.transaction(async (tx) => {
      const current = await findProduct(tx, p.id, true);
      ensure(current && !current.isArchived, 409, "El equipo fue archivado");
      const existing = await tx.orm.public.ProductPhoto.where({ productId: p.id }).all();
      ensure(existing.length < 12, 400, "Máximo 12 fotografías por equipo");
      const photo = await tx.orm.public.ProductPhoto.create({ productId: p.id, url: bucket.getPublicUrl(key).data.publicUrl, storageKey: key, sortOrder: Math.max(-1, ...existing.map((p) => p.sortOrder)) + 1 });
      await audit(tx, res.locals.admin.id, "upload_photo", "Product", p.id, { photoId: photo.id });
      return photo;
    });
    res.status(201).json({ photo });
  } catch (error) { await bucket.remove([key]); throw error; }
});
products.put("/:id/photos", async (req, res) => {
  const { photoIds } = z.object({ photoIds: z.array(z.string()).min(1).max(12) }).parse(req.body);
  await db.transaction(async (tx) => {
    const p = await findProduct(tx, req.params.id as string, true);
    ensure(p, 404, "Equipo no encontrado");
    const all = await tx.orm.public.ProductPhoto.where({ productId: p.id }).all();
    ensure(new Set(photoIds).size === all.length && photoIds.length === all.length && all.every((p) => photoIds.includes(p.id)), 400, "La lista debe contener todas las fotografías, sin duplicados");
    for (const [sortOrder, id] of photoIds.entries()) await tx.orm.public.ProductPhoto.where({ id }).update({ sortOrder });
    await audit(tx, res.locals.admin.id, "reorder_photos", "Product", p.id);
  });
  res.json({ ok: true });
});
products.delete("/:id/photos/:photoId", async (req, res) => {
  ensure(storage, 503, "Storage no configurado");
  // Remove DB references only after Storage succeeds; retries remain possible on storage failures.
  await db.transaction(async (tx) => {
    const p = await findProduct(tx, req.params.id as string, true);
    ensure(p, 404, "Equipo no encontrado");
    const photos = await tx.orm.public.ProductPhoto.where({ productId: p.id }).all();
    const photo = photos.find((p) => p.id === req.params.photoId);
    ensure(photo, 404, "Fotografía no encontrada");
    ensure(!p.isPublished || photos.length > 1, 409, "Oculta el producto antes de eliminar su última foto");
    const { error } = await storage!.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([photo.storageKey]);
    ensure(!error, 502, "No se pudo eliminar la foto de Storage");
    await tx.orm.public.ProductPhoto.where({ id: photo.id }).delete();
    await audit(tx, res.locals.admin.id, "delete_photo", "Product", p.id, { photoId: photo.id });
  });
  res.json({ ok: true });
});
