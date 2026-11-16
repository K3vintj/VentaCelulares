import { db } from "../prisma/db.js";
import { matchingReference, referenceIsAvailable, resolveReference } from "../catalog/library.js";
import { audit } from "../domain.js";

async function main() {
  const apply = process.argv.includes("--apply");
  const products = await db.orm.public.Product.where({ referenceVariantId: null, isArchived: false }).all();
  const matches = products.flatMap((product) => {
    const id = matchingReference(product.name, product.color), reference = resolveReference(id);
    return id && reference && referenceIsAvailable(id) && reference.model.storage.includes(product.storage) ? [{ product, id }] : [];
  });
  if (apply && matches.length) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (!email) throw new Error("Falta ADMIN_EMAIL para registrar la operación");
    const admin = await db.orm.public.AdminUser.where({ email }).first();
    if (!admin) throw new Error("No se encontró al administrador para la bitácora");
    await db.transaction(async (tx) => {
      for (const { product, id } of matches) {
        const current = await tx.orm.public.Product.where({ id: product.id }).forNoKeyUpdate().first();
        if (!current || current.referenceVariantId || current.isArchived || matchingReference(current.name, current.color) !== id || !resolveReference(id)?.model.storage.includes(current.storage)) throw new Error("El producto cambió; vuelve a ejecutar la revisión");
        await tx.orm.public.Product.where({ id: current.id }).update({ referenceVariantId: id });
        await audit(tx, admin.id, "assign_reference", "Product", current.id, { referenceVariantId: id, ownPhotosPreserved: true });
      }
    });
  }
  console.log(JSON.stringify({ mode: apply ? "applied" : "preview", matched: matches.map(({ product, id }) => ({ sku: product.sku, referenceVariantId: id })), unmatched: products.length - matches.length, ownPhotosPreserved: true }));
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "No se asignaron las imágenes"); process.exitCode = 1; }).finally(() => db.close());
