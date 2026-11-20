import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { env } from "../env.js";
import models from "./iphone-library.json" with { type: "json" };

export { iphoneModels, normalize, resolveReference } from "./references.js";
import { normalize, resolveReference } from "./references.js";
export function referenceIsAvailable(id: string) {
  const reference = resolveReference(id);
  if (!reference) return false;
  const directory = env.SERVE_FRONTEND === "true" ? "dist" : "public";
  return existsSync(fileURLToPath(new URL(`../../../${directory}${reference.url}`, import.meta.url)));
}
export function matchingReference(name: string, color: string) {
  const model = models.find((item) => normalize(item.name) === normalize(name));
  const aliases: Record<string, string> = { dorado: "oro", "blanco estelar": "blanco estrella" };
  const normalizedColor = aliases[normalize(color)] || normalize(color);
  const variant = model?.colors.find((item) => normalize(item.name) === normalizedColor);
  return model && variant ? `${model.id}/${variant.id}` : null;
}
export const library = Router();
library.get("/", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({ models: models.map((model) => ({ ...model, available: model.colors.every((color) => referenceIsAvailable(`${model.id}/${color.id}`)) })) });
});
