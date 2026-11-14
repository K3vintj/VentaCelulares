import { commercialConfig } from "@/config/commercial"
import type { DeviceCondition, Product } from "@/types/models"

export const createProductDefaults =
  (): Omit<Product, "id" | "name" | "storage" | "color" | "battery" | "price" | "status" | "condition" | "image" | "description"> => ({
    conditionNote: undefined,
    warrantyDays: commercialConfig.policies.warrantyDays,
    physicalCondition: "",
    screenCondition: "",
    cameraStatus: "",
    biometric: "Face ID",
    unlockStatus: commercialConfig.policies.unlockedStatusLabel,
    repairHistory: "Sin reparaciones conocidas",
    accessories: "",
    observations: "",
    verifiedNotRefurbished: false,
    verifiedNoReplacedParts: false,
    techInfoVerified: false,
    isPublished: false,
  })

export const DEVICE_CONDITIONS: DeviceCondition[] = ["nuevo", "seminuevo", "usado"]

export const CONDITION_LABELS: Record<DeviceCondition, string> = {
  nuevo: "Nuevo",
  seminuevo: "Seminuevo",
  usado: "Usado",
}

const isDeviceCondition = (value: string): value is DeviceCondition =>
  DEVICE_CONDITIONS.includes(value as DeviceCondition)

/** Compatibilidad con datos legacy tipo "Seminuevo · Excelente". */
export const normalizeCondition = (value: string): DeviceCondition => {
  const normalized = value.toLowerCase().trim()
  if (isDeviceCondition(normalized)) return normalized
  if (normalized.includes("seminuevo")) return "seminuevo"
  if (normalized.includes("usado")) return "usado"
  if (normalized.includes("nuevo")) return "nuevo"
  return "seminuevo"
}

export const getConditionLabel = (condition: DeviceCondition | string) =>
  CONDITION_LABELS[normalizeCondition(condition)]
