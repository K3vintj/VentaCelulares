import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { allowedOrigins, env } from "./env.js";
import { auth, requireAdmin } from "./auth.js";
import { publicProducts, products } from "./products.js";
import { orders, publicOrders } from "./orders.js";
import { commerce } from "./commerce.js";
import { adminConfig, publicConfig } from "./config.js";
import { db } from "./prisma/db.js";
import { errorHandler, ensure } from "./http.js";
import { observe } from "./observability.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.proxy);
app.use(observe);
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https://images.unsplash.com", ...(env.SUPABASE_URL ? [new URL(env.SUPABASE_URL).origin] : [])],
  connectSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
  upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
} } }));
if (env.NODE_ENV === "production") app.use((req, res, next) => {
  if (!req.secure && !["/api/health", "/api/health/ready"].includes(req.path)) {
    if (req.method === "GET" || req.method === "HEAD") { res.redirect(308, `${allowedOrigins[0]}${req.originalUrl}`); return; }
    res.status(400).json({ error: "Utiliza HTTPS para esta operación" }); return;
  }
  next();
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "256kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.get("Origin");
    ensure(!origin || allowedOrigins.includes(origin), 403, "Origen no permitido");
    // A cross-site form cannot set this header; a cross-site fetch must pass CORS preflight.
    ensure(req.get("X-Requested-With") === "VentaCelulares", 403, "Solicitud no autorizada");
  }
  next();
});
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "ventacelulares-api" }));
app.get("/api/health/ready", async (_req, res) => {
  const config = await db.orm.public.BusinessConfig.select("id").where({ id: "default" }).first();
  ensure(config, 503, "La configuración del negocio no está lista");
  res.json({ ok: true, database: true });
});
app.use("/api/auth", auth);
app.use("/api/products", publicProducts);
app.use("/api/orders", publicOrders);
app.use("/api/config", publicConfig);
app.use("/api/admin", requireAdmin);
app.use("/api/admin/products", products);
app.use("/api/admin/orders", orders);
app.use("/api/admin/config", adminConfig);
app.use("/api/admin", commerce);
if (env.SERVE_FRONTEND === "true") {
  const directory = fileURLToPath(new URL("../../dist/", import.meta.url));
  const index = fileURLToPath(new URL("../../dist/index.html", import.meta.url));
  if (!existsSync(index)) throw new Error("Falta compilar el frontend: ejecuta build:all");
  app.use(express.static(directory, { index: false, maxAge: 0, setHeaders(res, path) {
    if (/[\\/]assets[\\/]/.test(path)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    else res.setHeader("Cache-Control", "no-cache");
  } }));
  app.get(["/", "/admin"], (_req, res) => { res.setHeader("Cache-Control", "no-store"); res.sendFile(index); });
}
app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use(errorHandler);
