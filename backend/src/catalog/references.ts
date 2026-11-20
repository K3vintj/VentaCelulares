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
