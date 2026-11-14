import argon2 from "argon2";
import { z } from "zod";
import { db } from "../prisma/db.js";
export async function recoverAdmin(input: unknown) {
  const { email, password } = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(14).max(256) }).parse(input);
  await db.transaction(async (tx) => {
    const admin = await tx.orm.public.AdminUser.where({ email }).forNoKeyUpdate().first();
    if (!admin) throw new Error("No existe el administrador indicado; no se creó ninguna cuenta");
    await tx.orm.public.AdminUser.where({ id: admin.id }).update({ passwordHash: await argon2.hash(password, { type: argon2.argon2id }) });
    await tx.orm.public.AdminSession.where({ adminId: admin.id }).deleteAll();
    await tx.orm.public.AuditLog.create({ adminId: admin.id, action: "operator_password_recovery", entityType: "AdminUser", entityId: admin.id });
  });
}
