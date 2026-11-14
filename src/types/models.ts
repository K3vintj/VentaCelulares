export type Status = "Disponible" | "Reservado" | "Vendido"
export type DeviceCondition = "nuevo" | "seminuevo" | "usado"
export type BiometricOption = "Face ID" | "Touch ID" | "No aplica"
export type ProductPhoto = {
  id: string
  url: string
  storageKey: string
  sortOrder: number
}
export type Product = {
  id: string
  dbId?: string
  name: string
  storage: string
  color: string
  battery: string
  price: number
  status: Status
  condition: DeviceCondition
  conditionNote?: string | null
  warrantyDays: number
  physicalCondition: string
  screenCondition: string
  cameraStatus: string
  biometric: BiometricOption
  unlockStatus: string
  repairHistory: string
  accessories: string
  observations: string
  image: string
  description: string
  verifiedNotRefurbished: boolean
  verifiedNoReplacedParts: boolean
  techInfoVerified: boolean
  isPublished: boolean
  isArchived?: boolean
  photos?: ProductPhoto[]
  createdAt?: string
  updatedAt?: string
}
export type Admin = { id: string; name: string; email: string }
export type OrderStatus = "pendiente" | "confirmada" | "completada" | "cancelada"
export type Delivery = {
  id: string
  mode: "local" | "envio"
  destination: string | null
  carrier: string | null
  trackingNumber: string | null
  status: "pendiente" | "en_ruta" | "entregado" | "incidencia"
  notes: string | null
}
export type Sale = {
  id: string
  productId: string
  orderId: string | null
  finalPrice: number
  paymentMethod: string
  soldAt: string
  product?: Product & { sku: string }
  order?: Order | null
}
export type Order = {
  id: string
  folio: string
  productId: string
  productNameSnapshot: string
  priceSnapshot: number
  customerName: string
  customerPhone: string
  deliveryMode: "local" | "envio"
  shippingDestination: string | null
  status: OrderStatus
  createdAt: string
  product?: Product & { sku: string }
  sale?: Sale | null
  delivery?: Delivery | null
}
export type OrderConfirmation = {
  order: Pick<Order, "id" | "folio" | "customerName" | "productNameSnapshot" | "priceSnapshot" | "deliveryMode" | "status">
  whatsappUrl: string
}
export type BusinessConfig = {
  businessName: string
  whatsapp: string
  warrantyDays: number
  noticesJson: {
    id: string
    title: string
    text: string
    icon?: string
    featured?: boolean
    positive?: boolean
  }[]
}
export type DashboardData = {
  revenue: number
  salesCount: number
  monthRevenue: number
  monthSalesCount: number
  pendingOrders: number
  inventory: {
    total: number
    available: number
    reserved: number
    sold: number
    archived: number
  }
  months: { label: string; revenue: number }[]
  recentOrders: Order[]
}
