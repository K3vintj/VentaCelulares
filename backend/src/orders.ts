import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit, deliverySchema, findProduct, orderSchema } from "./domain.js";
import { ensure, rateLimit } from "./http.js";

export const publicOrders = Router();
publicOrders.post("/", rateLimit(20, 15 * 60_000), async (req, res) => {
  const input = orderSchema.parse(req.body);
  const requestKey = z.uuid().parse(req.get("Idempotency-Key"));
  const order = await db.transaction(async (tx) => {
    // All reservation/sale/order operations lock the product first, then the order.
    const p = await findProduct(tx, input.productId, true);
    ensure(p, 404, "Equipo no encontrado");
    const existing = await tx.orm.public.Order.where({ requestKey }).first();
    if (existing) {
      ensure(existing.productId === p.id && existing.customerName === input.customerName && existing.customerPhone === input.customerPhone && existing.deliveryMode === input.deliveryMode && (existing.shippingDestination || "") === (input.deliveryMode === "envio" ? input.shippingDestination : ""), 409, "La clave de solicitud ya se usó con otros datos");
      return existing;
    }
    ensure(p.isPublished && !p.isArchived && p.status === "Disponible", 409, "El equipo ya no está disponible. Consulta el catálogo.");
    const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "America/Mexico_City" }).format(new Date());
    // A cryptographic suffix plus a database UNIQUE constraint prevents duplicate folios.
    const folio = `VC-${year}-${randomBytes(6).toString("hex").toUpperCase()}`;
    return tx.orm.public.Order.create({
      ...input, productId: p.id, requestKey, folio,
      productNameSnapshot: `${p.name} · ${p.storage}`, priceSnapshot: p.price,
      shippingDestination: input.deliveryMode === "envio" ? input.shippingDestination! : null,
    });
  });
  const config = await db.orm.public.BusinessConfig.where({ id: "default" }).first();
  ensure(config?.whatsapp, 503, "El contacto del negocio no está configurado");
  const message = `Hola, envié la solicitud ${order.folio}. Equipo: ${order.productNameSnapshot}. Precio de referencia: $${order.priceSnapshot.toLocaleString("es-MX")} MXN. Entrega: ${order.deliveryMode === "envio" ? "envío" : "local"}. Entiendo que la solicitud no reserva ni paga el equipo.`;
  res.status(201).json({ order: { id: order.id, folio: order.folio, customerName: order.customerName, productNameSnapshot: order.productNameSnapshot, priceSnapshot: order.priceSnapshot, deliveryMode: order.deliveryMode, status: order.status }, whatsappUrl: `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}` });
});

export const orders = Router();
orders.get("/", async (_req, res) => {
  res.json({ orders: await db.orm.public.Order.include("product").include("sale").include("delivery").orderBy((o) => o.createdAt.desc()).all() });
});
orders.patch("/:id", async (req, res) => {
  const { status } = z.object({ status: z.enum(["pendiente", "confirmada", "completada", "cancelada"]) }).parse(req.body);
  const order = await db.transaction(async (tx) => {
    const initial = await tx.orm.public.Order.where({ id: req.params.id as string }).first();
    ensure(initial, 404, "Solicitud no encontrada");
    const p = await findProduct(tx, initial.productId, true);
    ensure(p, 404, "Equipo no encontrado");
    const o = await tx.orm.public.Order.where({ id: initial.id }).forNoKeyUpdate().first();
    ensure(o, 404, "Solicitud no encontrada");
    ensure(o.status !== "completada" && o.status !== "cancelada", 409, "Esta solicitud ya está cerrada");
    ensure(status !== o.status, 409, "La solicitud ya tiene ese estado");
    ensure(status !== "completada", 400, "Completa la solicitud registrando una venta");
    ensure(status !== "pendiente", 400, "Para liberar una reserva cancela la solicitud");
    if (status === "confirmada") {
      ensure(p.status === "Disponible" && !p.isArchived, 409, "La unidad ya está reservada o vendida");
      await tx.orm.public.Product.where({ id: p.id }).update({ status: "Reservado" });
      await audit(tx, res.locals.admin.id, "reserve", "Product", p.id, { orderId: o.id });
    } else if (status === "cancelada" && o.status === "confirmada") {
      ensure(p.status === "Reservado", 409, "El inventario cambió. Revisa la venta asociada.");
      await tx.orm.public.Product.where({ id: p.id }).update({ status: "Disponible" });
      await audit(tx, res.locals.admin.id, "release", "Product", p.id, { orderId: o.id });
    }
    await tx.orm.public.Order.where({ id: o.id }).update({ status });
    await audit(tx, res.locals.admin.id, "status", "Order", o.id, { from: o.status, to: status });
    return tx.orm.public.Order.where({ id: o.id }).include("product").include("sale").include("delivery").first();
  });
  res.json({ order });
});
orders.put("/:id/delivery", async (req, res) => {
  const input = deliverySchema.parse(req.body);
  const delivery = await db.transaction(async (tx) => {
    const order = await tx.orm.public.Order.where({ id: req.params.id as string }).forNoKeyUpdate().first();
    ensure(order && order.status !== "cancelada", 409, "La solicitud no existe o está cancelada");
    ensure((order.status === "confirmada" || order.status === "completada") || input.status === "pendiente", 409, "Confirma la solicitud antes de iniciar la entrega");
    const current = await tx.orm.public.Delivery.where({ orderId: order.id }).first();
    if (current) await tx.orm.public.Delivery.where({ id: current.id }).update(input);
    else await tx.orm.public.Delivery.create({ ...input, orderId: order.id });
    await tx.orm.public.Order.where({ id: order.id }).update({ deliveryMode: input.mode, shippingDestination: input.mode === "envio" ? input.destination : null });
    await audit(tx, res.locals.admin.id, "delivery", "Order", order.id, { status: input.status, mode: input.mode });
    return tx.orm.public.Delivery.where({ orderId: order.id }).first();
  });
  res.json({ delivery });
});
