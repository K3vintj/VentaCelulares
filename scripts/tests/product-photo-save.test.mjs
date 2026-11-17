import { test } from "node:test"
import assert from "node:assert/strict"
import { saveProductWithPhotos } from "../../src/utils/save-product-with-photos.ts"

const product = { id: "VC-TEST", isPublished: true, referenceVariantId: "iphone-15-pro/titanio-natural" }
const files = [new File(["front"], "frente.jpg", { type: "image/jpeg" }), new File(["back"], "atras.jpg", { type: "image/jpeg" })]

test("new products are published only after every selected photo is saved", async () => {
  const events = []
  const client = {
    async saveProduct(input, editing) { events.push(["save", editing, input.isPublished]); return { product: { ...input } } },
    async uploadPhoto(id, file) { assert.equal(id, product.id); events.push(["upload", file.name]) },
  }
  const saved = await saveProductWithPhotos(product, false, files, client,
    (p) => events.push(["persisted", p.isPublished]),
    (file) => events.push(["uploaded", file.name]),
  )
  assert.equal(saved.isPublished, true)
  assert.equal(saved.referenceVariantId, product.referenceVariantId)
  assert.deepEqual(events, [
    ["save", false, false], ["persisted", false],
    ["upload", "frente.jpg"], ["uploaded", "frente.jpg"],
    ["upload", "atras.jpg"], ["uploaded", "atras.jpg"],
    ["save", true, true], ["persisted", true],
  ])
})

test("a failed upload keeps the saved draft and only the remaining photos for retry", async () => {
  const writes = [], uploads = []
  let persisted, remaining = [...files], fail = true
  const client = {
    async saveProduct(input, editing) { writes.push({ editing, published: input.isPublished }); return { product: { ...input } } },
    async uploadPhoto(_id, file) {
      if (file === files[1] && fail) throw new Error("Storage no disponible")
      uploads.push(file.name)
    },
  }
  const onPersisted = (p) => { persisted = p }
  const onUploaded = (file) => { remaining = remaining.filter((f) => f !== file) }
  await assert.rejects(saveProductWithPhotos(product, false, remaining, client, onPersisted, onUploaded), /Storage/)
  assert.equal(persisted.id, product.id)
  assert.equal(persisted.isPublished, false)
  assert.deepEqual(remaining, [files[1]])
  assert.deepEqual(writes, [{ editing: false, published: false }])
  fail = false
  await saveProductWithPhotos({ ...persisted, isPublished: true }, true, remaining, client, onPersisted, onUploaded)
  assert.deepEqual(uploads, ["frente.jpg", "atras.jpg"])
  assert.deepEqual(remaining, [])
  assert.equal(writes.filter((w) => !w.editing).length, 1)
  assert.deepEqual(writes.slice(1), [{ editing: true, published: false }, { editing: true, published: true }])
})

test("draft saves upload photos without publishing and existing live products stay live", async () => {
  for (const [editing, published] of [[false, false], [true, true]]) {
    const states = []
    let uploads = 0
    const saved = await saveProductWithPhotos({ ...product, isPublished: published }, editing, files, {
      async saveProduct(input) { states.push(input.isPublished); return { product: input } },
      async uploadPhoto() { uploads++ },
    }, () => {}, () => {}, editing && published)
    assert.deepEqual(states, [published])
    assert.equal(saved.isPublished, published)
    assert.equal(uploads, 2)
  }
})

test("if publication fails after uploading, retry updates the same draft without re-uploading", async () => {
  let persisted, remaining = [...files], writes = 0, uploads = 0
  const client = {
    async saveProduct(input) {
      writes++
      if (writes === 2) throw new Error("Publicación no disponible")
      return { product: input }
    },
    async uploadPhoto() { uploads++ },
  }
  const onPersisted = (p) => { persisted = p }
  const onUploaded = (file) => { remaining = remaining.filter((f) => f !== file) }
  await assert.rejects(saveProductWithPhotos(product, false, remaining, client, onPersisted, onUploaded), /Publicación/)
  assert.equal(persisted.isPublished, false)
  assert.deepEqual(remaining, [])
  await saveProductWithPhotos({ ...persisted, isPublished: true }, true, remaining, client, onPersisted, onUploaded)
  assert.equal(uploads, 2)
  assert.equal(persisted.id, product.id)
  assert.equal(persisted.isPublished, true)
})
