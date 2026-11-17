import { Router } from "express";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit, createOrderFolio, findProduct, orderSchema } from "./domain.js";
import { ensure } from "./http.js";

const base = {
  productId: z.string().min(1).max(80),
  expectedStatus: z.enum(["Disponible", "Reservado"]),
};
export const reservationSchema = z.union([
  z.object({ ...base, orderId: z.string().min(1).max(80) }),
  z.object({ ...base,
    customerName: orderSchema.shape.customerName,
    customerPhone: orderSchema.shape.customerPhone,
    deliveryMode: orderSchema.shape.deliveryMode,
    shippingDestination: orderSchema.shape.shippingDestination,
  }).refine((v) => v.deliveryMode !== "envio" || (v.shippingDestination?.length || 0) >= 8,
    { path: ["shippingDestination"], message: "Indica el destino del envío" }),
]);

export const reservations = Router();
reservations.post("/", async (req, res) => {
  const input = reservationSchema.parse(req.body);
  const requestKey = z.uuid().parse(req.get("Idempotency-Key"));
  const order = await db.transaction(async (tx) => {
    // All competing reserve/cancel/sale paths lock the product first.
    const p = await findProduct(tx, input.productId, true);
    ensure(p && !p.isArchived, 404, "Equipo no encontrado");
    const selected = "orderId" in input
      ? await tx.orm.public.Order.where({ id: input.orderId }).forNoKeyUpdate().first()
      : await tx.orm.public.Order.where({ requestKey }).first();
    if ("orderId" in input) {
      ensure(selected && selected.productId === p.id, 409, "El pedido no corresponde a este equipo");
      if (selected.status === "confirmada" && p.status === "Reservado") return selected;
      ensure(selected.status === "pendiente", 409, "Este pedido ya está cerrado o confirmado");
    } else if (selected) {
      ensure(selected.productId === p.id && selected.customerName === input.customerName && selected.customerPhone === input.customerPhone && selected.deliveryMode === input.deliveryMode &&
        (selected.shippingDestination || "") === (input.deliveryMode === "envio" ? input.shippingDestination : ""), 409, "La clave de reserva ya se usó con otros datos");
      return selected;
    }
    ensure(p.status === input.expectedStatus, 409, "La disponibilidad cambió. Actualiza el inventario");
    ensure(!await tx.orm.public.Sale.where({ productId: p.id }).first(), 409, "Esta unidad ya tiene una venta registrada");
    ensure(!await tx.orm.public.Order.where({ productId: p.id, status: "confirmada" }).first(), 409, "Esta unidad ya tiene una reserva. Abre el pedido asociado");
    const reserved = "orderId" in input
      ? await tx.orm.public.Order.where({ id: input.orderId }).update({ status: "confirmada" })
      : await tx.orm.public.Order.create({
        productId: p.id, requestKey, folio: createOrderFolio(), status: "confirmada",
        productNameSnapshot: `${p.name} · ${p.storage}`, priceSnapshot: p.price,
        customerName: input.customerName, customerPhone: input.customerPhone,
        deliveryMode: input.deliveryMode,
        shippingDestination: input.deliveryMode === "envio" ? input.shippingDestination! : null,
        // This is an administrator's record, not consent submitted on the public form.
        consentAccepted: false,
      });
    ensure(reserved, 409, "No se pudo confirmar el pedido");
    await tx.orm.public.Product.where({ id: p.id }).update({ status: "Reservado" });
    if (!await tx.orm.public.Delivery.where({ orderId: reserved.id }).first())
      await tx.orm.public.Delivery.create({ orderId: reserved.id, mode: reserved.deliveryMode, destination: reserved.shippingDestination, status: "pendiente" });
    await audit(tx, res.locals.admin.id, "reserve", "Product", p.id, { orderId: reserved.id, source: "inventory", previousStatus: p.status });
    await audit(tx, res.locals.admin.id, "orderId" in input ? "status" : "create", "Order", reserved.id, { source: "inventory", from: "orderId" in input ? "pendiente" : null, to: "confirmada" });
    return reserved;
  });
  res.status(201).json({ order });
});
