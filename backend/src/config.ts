import { Router } from "express";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { audit } from "./domain.js";
import { ensure } from "./http.js";
import { configSchema } from './validation.js';
export { configSchema } from './validation.js';

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
