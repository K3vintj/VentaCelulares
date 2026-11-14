import type {
  Admin,
  BusinessConfig,
  DashboardData,
  Delivery,
  Order,
  OrderConfirmation,
  Product,
  Sale,
  Status,
} from "@/types/models"
const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "")
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
  }
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      signal:
        options.signal ||
        AbortSignal.timeout(options.body instanceof Blob ? 60000 : 20000),
      credentials: "include",
      headers: {
        "X-Requested-With": "VentaCelulares",
        ...(options.body && !(options.body instanceof Blob)
          ? { "Content-Type": "application/json" }
          : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
      0,
    )
  }
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (
      response.status === 401 &&
      path !== "/auth/me" &&
      path !== "/auth/login"
    )
      window.dispatchEvent(new Event("vc:unauthorized"))
    throw new ApiError(
      body.error || "No se pudo completar la operación",
      response.status,
      body.fields,
    )
  }
  return body as T
}
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
})
const productBody = (p: Product) => ({
  ...p,
  sku: p.id,
  biometric:
    p.biometric === "Face ID"
      ? "FACE_ID"
      : p.biometric === "Touch ID"
        ? "TOUCH_ID"
        : "NO_APLICA",
})
export const api = {
  products: (admin = false) =>
    request<{ products: Product[] }>(admin ? "/admin/products" : "/products"),
  login: (email: string, password: string) =>
    request<{ admin: Admin }>("/auth/login", json("POST", { email, password })),
  me: () => request<{ admin: Admin }>("/auth/me"),
  logout: () => request<{ ok: true }>("/auth/logout", json("POST")),
  changePassword: (currentPassword: string, newPassword: string) =>
    request("/auth/password", json("POST", { currentPassword, newPassword })),
  createOrder: (body: unknown, key: string) =>
    request<OrderConfirmation>("/orders", {
      ...json("POST", body),
      headers: { "Idempotency-Key": key },
    }),
  saveProduct: (p: Product, editing: boolean) =>
    request<{ product: Product }>(
      `/admin/products${editing ? `/${encodeURIComponent(p.id)}` : ""}`,
      json(editing ? "PUT" : "POST", productBody(p)),
    ),
  archiveProduct: (id: string) =>
    request(`/admin/products/${encodeURIComponent(id)}`, json("DELETE")),
  productStatus: (id: string, status: Status, expectedStatus: Status) =>
    request<{ product: Product }>(
      `/admin/products/${encodeURIComponent(id)}/status`,
      json("PATCH", { status, expectedStatus }),
    ),
  uploadPhoto: (id: string, file: File) =>
    request(`/admin/products/${encodeURIComponent(id)}/photos`, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    }),
  deletePhoto: (id: string, photoId: string) =>
    request(
      `/admin/products/${encodeURIComponent(id)}/photos/${photoId}`,
      json("DELETE"),
    ),
  orderPhotos: (id: string, photoIds: string[]) =>
    request(
      `/admin/products/${encodeURIComponent(id)}/photos`,
      json("PUT", { photoIds }),
    ),
  orders: () => request<{ orders: Order[] }>("/admin/orders"),
  orderStatus: (id: string, status: string) =>
    request(`/admin/orders/${id}`, json("PATCH", { status })),
  saveDelivery: (id: string, delivery: Omit<Delivery, "id">) =>
    request(`/admin/orders/${id}/delivery`, json("PUT", delivery)),
  sales: () => request<{ sales: Sale[] }>("/admin/sales"),
  createSale: (body: {
    productId: string
    orderId?: string
    finalPrice: number
    paymentMethod: string
  }) => request("/admin/sales", json("POST", body)),
  dashboard: () => request<DashboardData>("/admin/dashboard"),
  config: () => request<{ config: BusinessConfig }>("/config"),
  saveConfig: (config: BusinessConfig) =>
    request<{ config: BusinessConfig }>("/admin/config", json("PUT", config)),
}
