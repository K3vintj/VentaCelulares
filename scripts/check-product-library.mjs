import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";

const models = JSON.parse(await readFile("backend/src/catalog/iphone-library.json", "utf8"));
const { assets } = JSON.parse(await readFile("docs/product-library/sources.json", "utf8"));
assert.equal(models.length, 28);
assert.equal(assets.length, 126);
const variantIds = new Set(), paths = new Set();
let bytes = 0;
for (const model of models) {
  assert(model.colors.length && model.storage.length, model.id);
  for (const color of model.colors) {
    const id = `${model.id}/${color.id}`;
    assert(!variantIds.has(id), `Duplicate variant: ${id}`);
    variantIds.add(id);
    assert.match(color.imageUrl, /^\/product-library\/[a-z0-9-]+-v\d+\.webp$/);
    assert(!paths.has(color.imageUrl), `Wrong shared photo between variants: ${id}`);
    paths.add(color.imageUrl);
    const source = assets.find((item) => item.variantId === id);
    assert(source && source.sourceUrl === color.sourceImageUrl && source.assetUrl === color.imageUrl, id);
    assert.equal(new URL(source.sourceUrl).hostname, "www.apple.com");
    assert.equal(source.opaquePixelChanges, 0);
    const data = await readFile(`public${color.imageUrl}`);
    assert.equal(createHash("sha256").update(data).digest("hex"), source.assetSha256, `Photo changed: ${id}`);
    assert.equal(data.length, source.bytes);
    const metadata = await sharp(data).metadata();
    assert.equal(metadata.format, "webp");
    assert(metadata.hasAlpha && metadata.width === source.width && metadata.height === source.height, id);
    bytes += data.length;
  }
}
assert.equal((await readdir("public/product-library")).filter((file) => file.endsWith(".webp")).length, paths.size);
console.log(`Verified library: ${models.length} models, ${variantIds.size} exact model/color photos, ${(bytes / 1024 / 1024).toFixed(1)} MiB. All hashes, formats and provenance match.`);
