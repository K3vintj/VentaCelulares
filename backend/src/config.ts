import { Router } from "express";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit } from "./domain.js";
import { ensure } from "./http.js";
export const configSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  whatsapp: z.string().regex(/^\d{10,15}$/),
  warrantyDays: z.number().int().min(1).max(3650),
  noticesJson: z.array(z.object({ id: z.string().min(1).max(50), title: z.string().min(1).max(180), text: z.string().min(1).max(2000), icon: z.string().max(40).default("info"), featured: z.boolean().default(false), positive: z.boolean().default(true) })).max(12),
});
export const publicConfig = Router();
publicConfig.get("/", async (_req, res) => {
  const config = await db.orm.public.BusinessConfig.where({ id: "default" }).first();
  ensure(config, 503, "La configuración del negocio está pendiente");
  res.json({ config });
});
export const adminConfig = Router();
adminConfig.put("/", async (req, res) => {
  const input = configSchema.parse(req.body);
  await db.transaction(async (tx) => {
    const current = await tx.orm.public.BusinessConfig.where({ id: "default" }).first();
    if (current) await tx.orm.public.BusinessConfig.where({ id: "default" }).update(input);
    else await tx.orm.public.BusinessConfig.create({ ...input, id: "default" });
    await audit(tx, res.locals.admin.id, "update", "BusinessConfig", "default");
  });
  res.json({ config: await db.orm.public.BusinessConfig.where({ id: "default" }).first() });
});
