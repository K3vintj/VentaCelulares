import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import { env } from "../env.js";
import models from "./iphone-library.json" with { type: "json" };

export type LibraryModel = (typeof models)[number];
export const iphoneModels = models;
export const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
export function resolveReference(id: string | null | undefined) {
  if (!id) return null;
  const parts = id.split("/");
  if (parts.length !== 2) return null;
  const [modelId, colorId] = parts;
  const model = models.find((item) => item.id === modelId);
  const color = model?.colors.find((item) => item.id === colorId);
  if (!model || !color) return null;
  return { id, model, color, url: color.imageUrl };
}
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
