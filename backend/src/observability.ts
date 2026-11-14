import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "./env.js";
export const observe: RequestHandler = (req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  const start = performance.now();
  res.on("finish", () => {
    if (env.logRequests) console.log(JSON.stringify({ level: res.statusCode >= 500 ? "error" : "info", requestId, method: req.method, route: req.route?.path || "unmatched", status: res.statusCode, durationMs: Math.round(performance.now() - start) }));
  });
  next();
};
