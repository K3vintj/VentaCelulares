import type { BiometricOption, DeviceCondition, Status } from "@/types/models"

export type ProductFormValues = {
  id: string
  name: string
  storage: string
  color: string
  condition: DeviceCondition
  conditionNote: string
  price: string
  status: Status
  battery: string
  warrantyDays: string
  physicalCondition: string
  screenCondition: string
  cameraStatus: string
  biometric: BiometricOption
  unlockStatus: string
  repairHistory: string
  accessories: string
  observations: string
  description: string
  image: string
  verifiedNotRefurbished: boolean
  verifiedNoReplacedParts: boolean
  techInfoVerified: boolean
}

export type ProductFormErrors = Partial<Record<keyof ProductFormValues | "form", string>>
