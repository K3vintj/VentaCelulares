import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function ensure(value: unknown, status: number, message: string): asserts value {
  if (!value) throw new HttpError(status, message);
}
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: "Revisa los datos enviados", fields: error.flatten().fieldErrors });
  } else if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
  } else if (error?.type === "entity.too.large") {
    res.status(413).json({ error: "El archivo supera el límite de 5 MB" });
  } else if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({ error: "JSON inválido" });
  } else if (error?.sqlState === "23505" || error?.sqlState === "23503") {
    res.status(409).json({ error: "Los datos cambiaron o ya existe un registro con ese código. Actualiza e intenta nuevamente." });
  } else {
    // Log only a code: database errors can contain customer data or credentials.
    console.error(JSON.stringify({ level: "error", requestId: res.locals.requestId, code: typeof error?.code === "string" ? error.code : "INTERNAL" }));
    res.status(500).json({ error: "No pudimos completar la operación. Intenta nuevamente.", requestId: res.locals.requestId });
  }
};
export function rateLimit(max: number, windowMs: number): RequestHandler {
  const entries = new Map<string, { count: number; until: number }>();
  const timer = setInterval(() => {
    for (const [key, entry] of entries) if (entry.until < Date.now()) entries.delete(key);
  }, windowMs);
  timer.unref();
  return (req, res, next) => {
    const key = req.ip || "unknown";
    let entry = entries.get(key);
    if (!entry || entry.until < Date.now()) {
      entry = { count: 0, until: Date.now() + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > max) {
      res.setHeader("Retry-After", Math.ceil((entry.until - Date.now()) / 1000));
      res.status(429).json({ error: "Demasiados intentos. Espera unos minutos." });
    } else next();
  };
}
