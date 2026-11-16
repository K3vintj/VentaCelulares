import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";

// Deterministic processing only. Phone RGB pixels are never recolored or generated.
const models = JSON.parse(await readFile("backend/src/catalog/iphone-library.json", "utf8"));
const cache = ".tmp-product-library-originals";
await mkdir(cache, { recursive: true });
await mkdir("public/product-library", { recursive: true });
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const assets = [];
for (const model of models) {
  for (const color of model.colors) {
    const url = new URL(color.sourceImageUrl);
    if (url.protocol !== "https:" || url.hostname !== "www.apple.com") throw new Error("Unverified photo source");
    const originalPath = `${cache}/${model.id}-${color.id}.jpg`;
    let original;
    try { original = await readFile(originalPath); } catch { /* Download exact registered source. */ }
    if (!original || original.length < 512) {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`Photo unavailable: ${model.id}/${color.id}`);
      original = Buffer.from(await response.arrayBuffer());
      if (original.length < 512) throw new Error("Empty source photo");
      await writeFile(originalPath, original);
    }
    const { data, info } = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width, height } = info;
    const count = width * height;
    const visited = new Uint8Array(count), queue = new Int32Array(count);
    let head = 0, tail = 0;
    const enqueue = (p) => {
      const i = p * 4, min = Math.min(data[i], data[i + 1], data[i + 2]), max = Math.max(data[i], data[i + 1], data[i + 2]);
      if (!visited[p] && min >= 248 && max - min <= 5) { visited[p] = 1; queue[tail++] = p; }
    };
    for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
    for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
    while (head < tail) {
      const p = queue[head++], x = p % width;
      data[p * 4 + 3] = 0;
      if (x > 0) enqueue(p - 1);
      if (x < width - 1) enqueue(p + 1);
      if (p >= width) enqueue(p - width);
      if (p < count - width) enqueue(p + width);
    }
    if (tail < count * .001 || tail > count * .7) throw new Error(`Review background mask: ${model.id}/${color.id}`);
    const result = await sharp(data, { raw: { width, height, channels: 4 } }).webp({ lossless: true, effort: 6 }).toBuffer();
    const decoded = await sharp(result).ensureAlpha().raw().toBuffer();
    for (let p = 0; p < count; p++) if (data[p * 4 + 3] === 255) {
      for (let c = 0; c < 4; c++) if (data[p * 4 + c] !== decoded[p * 4 + c]) throw new Error("Opaque phone pixel changed");
    }
    if (!/^\/product-library\/[a-z0-9-]+-v\d+\.webp$/.test(color.imageUrl)) throw new Error("Invalid asset path");
    await writeFile(`public${color.imageUrl}`, result);
    assets.push({ variantId: `${model.id}/${color.id}`, sourceUrl: url.href, sourceSha256: hash(original), assetUrl: color.imageUrl, assetSha256: hash(result), width, height, transparentPixels: tail, opaquePixelChanges: 0, bytes: result.length, method: "Verified Apple photo; alpha-only flood fill of edge-connected white background; lossless WebP. No generative edits." });
  }
  console.log(`Prepared ${model.name}`);
}
await writeFile("docs/product-library/sources.json", JSON.stringify({ verifiedOn: "2026-11-15", identificationSource: "https://support.apple.com/es-es/108044", photoSource: "https://www.apple.com/iphone/compare/", assets: assets.sort((a, b) => a.variantId.localeCompare(b.variantId)) }, null, 2) + "\n");
console.log(`Prepared ${assets.length} verified photographs; opaque pixels unchanged.`);
