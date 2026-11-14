export const mxn = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value)

export const formatDate = (value: string) => new Date(value).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })
