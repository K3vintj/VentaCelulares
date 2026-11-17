import type { Product } from "@/types/models"

type PhotoClient = {
  saveProduct: (product: Product, editing: boolean) => Promise<{ product: Product }>
  uploadPhoto: (id: string, file: File) => Promise<unknown>
}

export async function saveProductWithPhotos(
  product: Product,
  editing: boolean,
  files: readonly File[],
  client: PhotoClient,
  onPersisted: (product: Product) => void,
  onUploaded: (file: File) => void,
  wasPublished = false,
) {
  // Draft units (including partial retries) wait for all selected photos.
  // Already published units remain visible while adding optional photos.
  const deferPublication = !wasPublished && product.isPublished && files.length > 0
  let saved = (await client.saveProduct({ ...product, isPublished: deferPublication ? false : product.isPublished }, editing)).product
  onPersisted(saved)
  for (const file of files) {
    await client.uploadPhoto(saved.id, file)
    onUploaded(file)
  }
  if (deferPublication) {
    saved = (await client.saveProduct({ ...product, id: saved.id, isPublished: true }, true)).product
    onPersisted(saved)
  }
  return saved
}
