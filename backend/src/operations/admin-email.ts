import { z } from "zod";
import { db } from "../prisma/db.js";
export async function changeAdminEmail(adminId: string, email: string) {
  const nextEmail = z.email().trim().toLowerCase().parse(email);
  return db.transaction(async (tx) => {
    const current = await tx.orm.public.AdminUser.where({ id: adminId }).forNoKeyUpdate().first();
    if (!current) throw new Error("Administrador no encontrado");
    if (current.email === nextEmail) return { changed: false, email: nextEmail };
    const existing = await tx.orm.public.AdminUser.where({ email: nextEmail }).first();
    if (existing) throw new Error("Ese correo ya pertenece a otra cuenta");
    await tx.orm.public.AdminUser.where({ id: current.id }).update({ email: nextEmail });
    await tx.orm.public.AdminSession.where({ adminId: current.id }).deleteAll();
    await tx.orm.public.AuditLog.create({ adminId: current.id, action: "operator_update_email", entityType: "AdminUser", entityId: current.id, details: { previousEmail: current.email, email: nextEmail } });
    return { changed: true, email: nextEmail };
  });
}
