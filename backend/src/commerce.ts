import { Router } from "express";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit, findProduct } from "./domain.js";
import { ensure } from "./http.js";

export const commerce = Router();
commerce.get("/sales", async (_req, res) => {
  res.json({ sales: await db.orm.public.Sale.include("product").include("order").orderBy((s) => s.soldAt.desc()).all() });
});
commerce.post("/sales", async (req, res) => {
  const input = z.object({ productId: z.string().min(1), orderId: z.string().optional(), finalPrice: z.number().int().min(1).max(10_000_000), paymentMethod: z.enum(["Efectivo", "Transferencia"]) }).parse(req.body);
  const sale = await db.transaction(async (tx) => {
    const p = await findProduct(tx, input.productId, true);
    ensure(p && !p.isArchived, 404, "Equipo no encontrado");
    ensure(p.status !== "Vendido" && !await tx.orm.public.Sale.where({ productId: p.id }).first(), 409, "Esta unidad ya tiene una venta registrada");
    const order = input.orderId ? await tx.orm.public.Order.where({ id: input.orderId }).forNoKeyUpdate().first() : null;
    if (input.orderId) ensure(order && order.productId === p.id && (order.status === "pendiente" || order.status === "confirmada"), 409, "La solicitud no corresponde o ya está cerrada");
    const reservedOrder = await tx.orm.public.Order.where({ productId: p.id, status: "confirmada" }).first();
    ensure(!reservedOrder || reservedOrder.id === order?.id, 409, "Esta unidad está reservada para otra solicitud");
    const sale = await tx.orm.public.Sale.create({ productId: p.id, orderId: order?.id || null, finalPrice: input.finalPrice, paymentMethod: input.paymentMethod });
    await tx.orm.public.Product.where({ id: p.id }).update({ status: "Vendido" });
    if (order) await tx.orm.public.Order.where({ id: order.id }).update({ status: "completada" });
    await audit(tx, res.locals.admin.id, "sale", "Product", p.id, { saleId: sale.id, orderId: order?.id, finalPrice: input.finalPrice });
    return sale;
  });
  res.status(201).json({ sale });
});
commerce.get("/dashboard", async (_req, res) => {
  // Read a consistent snapshot; totals are based exclusively on Sale records.
  const data = await db.transaction(async (tx) => {
    const products = await tx.orm.public.Product.all();
    const sales = await tx.orm.public.Sale.all();
    const orders = await tx.orm.public.Order.orderBy((o) => o.createdAt.desc()).all();
    const now = new Date();
    const monthKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit" }).format(date);
    const monthSales = sales.filter((s) => monthKey(s.soldAt) === monthKey(now));
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 15));
      return { label: new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "America/Mexico_City" }).format(date), revenue: sales.filter((s) => monthKey(s.soldAt) === monthKey(date)).reduce((sum, s) => sum + s.finalPrice, 0) };
    });
    return {
      revenue: sales.reduce((sum, s) => sum + s.finalPrice, 0), salesCount: sales.length,
      monthRevenue: monthSales.reduce((sum, s) => sum + s.finalPrice, 0), monthSalesCount: monthSales.length,
      inventory: { total: products.length, available: products.filter((p) => p.status === "Disponible" && !p.isArchived).length, reserved: products.filter((p) => p.status === "Reservado").length, sold: products.filter((p) => p.status === "Vendido").length, archived: products.filter((p) => p.isArchived).length },
      pendingOrders: orders.filter((o) => o.status === "pendiente").length,
      recentOrders: orders.slice(0, 8), months,
    };
  });
  res.json(data);
});
commerce.get("/audit", async (req, res) => {
  const input = z.object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    action: z.string().trim().max(80).optional(),
    entityType: z.string().trim().max(80).optional(),
    entityId: z.string().trim().max(100).optional(),
    from: z.iso.date().optional(), to: z.iso.date().optional(),
  }).refine((v) => !v.from || !v.to || v.from <= v.to, { message: "La fecha inicial debe ser anterior a la final" }).parse(req.query);
  let query = db.orm.public.AuditLog.where((l) => l.id.neq(""));
  if (input.action) query = query.where({ action: input.action });
  if (input.entityType) query = query.where({ entityType: input.entityType });
  if (input.entityId) query = query.where({ entityId: input.entityId });
  if (input.from) query = query.where((l) => l.createdAt.gte(new Date(`${input.from}T00:00:00-06:00`)));
  if (input.to) query = query.where((l) => l.createdAt.lt(new Date(new Date(`${input.to}T00:00:00-06:00`).getTime() + 86400000)));
  const totals = await query.aggregate((a) => ({ total: a.count() }));
  const logs = await query.include("admin", (admin) => admin.select("id", "name", "email"))
    .orderBy([(l) => l.createdAt.desc(), (l) => l.id.desc()])
    .offset((input.page - 1) * input.limit).limit(input.limit).all();
  res.json({ logs, page: input.page, limit: input.limit, total: totals.total, pages: Math.max(1, Math.ceil(totals.total / input.limit)) });
});
