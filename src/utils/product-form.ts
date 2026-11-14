import { commercialConfig } from "@/config/commercial"
import type { Product } from "@/types/models"
import type { ProductFormValues } from "@/types/product-form"
import { normalizeCondition } from "@/utils/products"

export const buildEmptyProductForm = (nextId: string): ProductFormValues => ({
  id: nextId,
  name: "",
  storage: "128 GB",
  color: "",
  condition: "seminuevo",
  conditionNote: "",
  price: "",
  status: "Disponible",
  battery: "",
  warrantyDays: String(commercialConfig.policies.warrantyDays),
  physicalCondition: "",
  screenCondition: "",
  cameraStatus: "",
  biometric: "Face ID",
  unlockStatus: commercialConfig.policies.unlockedStatusLabel,
  repairHistory: "Sin reparaciones conocidas",
  accessories: "",
  observations: "",
  description: "",
  image: "",
  verifiedNotRefurbished: false,
  verifiedNoReplacedParts: false,
  techInfoVerified: false,
})

export const productToForm = (product: Product): ProductFormValues => ({
  id: product.id,
  name: product.name,
  storage: product.storage,
  color: product.color,
  condition: normalizeCondition(product.condition),
  conditionNote: product.conditionNote || "",
  price: String(product.price),
  status: product.status,
  battery: product.battery.replace("%", ""),
  warrantyDays: String(product.warrantyDays),
  physicalCondition: product.physicalCondition,
  screenCondition: product.screenCondition,
  cameraStatus: product.cameraStatus,
  biometric: product.biometric,
  unlockStatus: product.unlockStatus,
  repairHistory: product.repairHistory,
  accessories: product.accessories,
  observations: product.observations,
  description: product.description,
  image: product.image,
  verifiedNotRefurbished: product.verifiedNotRefurbished,
  verifiedNoReplacedParts: product.verifiedNoReplacedParts,
  techInfoVerified: product.techInfoVerified,
})

export const parseBatteryValue = (value: string) => {
  const cleaned = value.replace("%", "").trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : NaN
}
