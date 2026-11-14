import { Router } from "express";
import type { RequestHandler } from "express";
import { randomBytes, createHash } from "node:crypto";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "./prisma/db.js";
import { env } from "./env.js";
import { ensure, rateLimit } from "./http.js";

export type Admin = { id: string; email: string; name: string };
declare global { namespace Express { interface Locals { admin: Admin } } }
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const cookieOptions = { httpOnly: true, secure: env.COOKIE_SECURE === "true", sameSite: "lax" as const, path: "/" };
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.vc_session;
  ensure(typeof token === "string" && /^[a-f0-9]{64}$/.test(token), 401, "Inicia sesión para continuar");
  const session = await db.orm.public.AdminSession.where({ tokenHash: tokenHash(token) }).include("admin").first();
  ensure(session && session.expiresAt.getTime() > Date.now(), 401, "Sesión inválida o expirada");
  res.locals.admin = { id: session.admin.id, email: session.admin.email, name: session.admin.name };
  next();
};
export const auth = Router();
auth.post("/login", rateLimit(10, 15 * 60_000), async (req, res) => {
  const { email, password } = z.object({ email: z.email().trim().toLowerCase(), password: z.string().min(1).max(256) }).parse(req.body);
  const token = randomBytes(32).toString("hex");
  const admin = await db.transaction(async (tx) => {
    const admin = await tx.orm.public.AdminUser.where({ email }).forNoKeyUpdate().first();
    // Serialize login with password changes so an old password cannot open a new session.
    const valid = admin ? await argon2.verify(admin.passwordHash, password) : (await argon2.hash(password), false);
    ensure(admin && valid, 401, "Credenciales incorrectas");
    if (typeof req.cookies?.vc_session === "string") {
      await tx.orm.public.AdminSession.where({ tokenHash: tokenHash(req.cookies.vc_session) }).delete();
    }
    await tx.orm.public.AdminSession.create({ adminId: admin.id, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 12 * 60 * 60_000) });
    return admin;
  });
  res.cookie("vc_session", token, { ...cookieOptions, maxAge: 12 * 60 * 60_000 });
  res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
});
auth.get("/me", requireAdmin, (_req, res) => res.json({ admin: res.locals.admin }));
auth.post("/password", requireAdmin, rateLimit(5, 15 * 60_000), async (req, res) => {
  const input = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(14).max(256) }).parse(req.body);
  ensure(input.currentPassword !== input.newPassword, 400, "Elige una contraseña distinta de la actual");
  await db.transaction(async (tx) => {
    const admin = await tx.orm.public.AdminUser.where({ id: res.locals.admin.id }).forNoKeyUpdate().first();
    ensure(admin && await argon2.verify(admin.passwordHash, input.currentPassword), 400, "La contraseña actual es incorrecta");
    await tx.orm.public.AdminUser.where({ id: admin.id }).update({ passwordHash: await argon2.hash(input.newPassword, { type: argon2.argon2id }) });
    await tx.orm.public.AdminSession.where({ adminId: admin.id }).deleteAll();
    await tx.orm.public.AuditLog.create({ adminId: admin.id, action: "change_password", entityType: "AdminUser", entityId: admin.id });
  });
  res.clearCookie("vc_session", cookieOptions);
  res.json({ ok: true });
});
auth.post("/logout", async (req, res) => {
  if (typeof req.cookies?.vc_session === "string") {
    await db.orm.public.AdminSession.where({ tokenHash: tokenHash(req.cookies.vc_session) }).delete();
  }
  res.clearCookie("vc_session", cookieOptions);
  res.json({ ok: true });
});
