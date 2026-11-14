/**
 * Configuración comercial pública de Alexxziño Store / VentaCelulares.
 *
 * Los valores editables se hidratan desde GET /api/config mediante
 * applyBusinessConfig. Este archivo conserva textos y estilos base.
 * No incluir contraseñas, tokens ni credenciales en este módulo.
 */

export type OptionalValue = string | null

export type CommercialNotice = {
  id: string

  icon: string

  title: string

  text: string

  featured: boolean

  positive: boolean
}

export type LegalLink = {
  label: string

  href: OptionalValue

  internal: "notices" | "contact" | null

  badge: string | null
}

export type CommercialConfig = {
  businessName: string

  description: string

  logoSrc: string

  contact: {
    whatsapp: OptionalValue

    /** Texto visible para WhatsApp (sin inventar si falta). */

    whatsappLabel: OptionalValue

    phone: OptionalValue

    email: OptionalValue

    supportHours: OptionalValue
  }

  social: {
    facebook: OptionalValue

    instagram: OptionalValue

    tiktok: OptionalValue
  }

  policies: {
    warrantyDays: number

    warrantyTitle: string

    warrantyText: string

    warrantyTermsHref: OptionalValue

    unlockedTitle: string

    unlockedText: string

    unlockedStatusLabel: string

    notRefurbishedTitle: string

    notRefurbishedText: string

    noReplacedPartsTitle: string

    noReplacedPartsText: string

    stockMixTitle: string

    stockMixText: string

    /**
     * Modalidades de entrega confirmadas por el cliente.
     * null = pendiente; no inventar opciones públicas.
     */

    deliveryModes: string[] | null
  }

  legal: LegalLink[]

  notices: {
    eyebrow: string

    titleLead: string

    titleAccent: string

    subtitle: string

    disclaimer: string

    items: CommercialNotice[]
  }

  integration: {
    persistence: "frontend-provisional"

    note: string
  }
}

export const commercialConfig: CommercialConfig = {
  businessName: "Alexxziño Store",

  description:
    "Especialistas en iPhone. Equipos nuevos y seminuevos con información clara, atención directa y una experiencia de compra premium.",

  logoSrc: "/logo-alexxzino.jpg",

  contact: {
    whatsapp: "529211191936",

    whatsappLabel: "921 119 1936",

    phone: "+52 921 119 1936",

    email: null,

    supportHours: null,
  },

  social: {
    facebook: null,

    instagram: "https://www.instagram.com/alexxzino_store/",

    tiktok: null,
  },

  policies: {
    warrantyDays: 30,

    warrantyTitle: "30 días de garantía",

    warrantyText: "Garantía comercial de 30 días sobre el equipo adquirido.",

    warrantyTermsHref: null,

    unlockedTitle: "Equipos liberados",

    unlockedText:
      "Todos los dispositivos se venden liberados para operadores compatibles.",

    unlockedStatusLabel: "Liberado",

    notRefurbishedTitle: "No reacondicionados",

    notRefurbishedText: "No comercializamos equipos reacondicionados.",

    noReplacedPartsTitle: "Sin piezas reemplazadas",

    noReplacedPartsText: "No comercializamos equipos con piezas reemplazadas.",

    stockMixTitle: "Nuevos, seminuevos y usados según disponibilidad",

    stockMixText:
      "El inventario puede incluir estas condiciones según existencias.",

    deliveryModes: null,
  },

  legal: [
    {
      label: "Garantías",

      href: null,

      internal: "notices",

      badge: "30 días", // sincronizado con policies.warrantyDays
    },

    {
      label: "Términos y condiciones",

      href: null,

      internal: null,

      badge: null,
    },

    {
      label: "Aviso de privacidad",

      href: null,

      internal: null,

      badge: null,
    },

    {
      label: "Políticas de entrega y devolución",

      href: null,

      internal: null,

      badge: null,
    },
  ],

  notices: {
    eyebrow: "Condiciones comerciales",

    titleLead: "Tu confianza es",

    titleAccent: "nuestra prioridad",

    subtitle:
      "Conoce las condiciones de nuestros equipos antes de elegir tu próximo iPhone.",

    disclaimer:
      "Condiciones declaradas por el negocio y sujetas a verificación comercial. La garantía no representa una cobertura ilimitada. Revisa cada ficha antes de solicitar.",

    items: [
      {
        id: "warranty",

        icon: "shield",

        title: "30 días de garantía",

        text: "Garantía comercial de 30 días sobre el equipo adquirido.",

        featured: true,

        positive: true,
      },

      {
        id: "unlocked",

        icon: "unlock",

        title: "Equipos liberados",

        text: "Todos los dispositivos se venden liberados para operadores compatibles.",

        featured: false,

        positive: true,
      },

      {
        id: "parts",

        icon: "check",

        title: "Sin piezas reemplazadas",

        text: "No comercializamos equipos con piezas reemplazadas.",

        featured: false,

        positive: true,
      },

      {
        id: "refurb",

        icon: "box",

        title: "No reacondicionados",

        text: "No comercializamos equipos reacondicionados.",

        featured: false,

        positive: false,
      },

      {
        id: "stock",

        icon: "grid",

        title: "Nuevos, seminuevos y usados según disponibilidad",

        text: "El inventario puede incluir estas condiciones según existencias.",

        featured: false,

        positive: false,
      },
    ],
  },

  integration: {
    persistence: "frontend-provisional",

    note: "Configuración frontend provisional. Conectar a API administrativa sin exponer secretos.",
  },
}

/** Atajos tipados usados por la UI (derivados de policies/notices). */

export const getWarrantyLabel = (
  days = commercialConfig.policies.warrantyDays,
) => `${days} días`

export const getProductWarrantyText = (
  days = commercialConfig.policies.warrantyDays,
) => `${days} días con el negocio`

export const openExternal = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer")
}

export const getWhatsAppUrl = (message?: string) => {
  const number = commercialConfig.contact.whatsapp

  if (!number) return null

  const base = `https://wa.me/${number}`

  if (!message) return base

  return `${base}?text=${encodeURIComponent(message)}`
}

export const openWhatsApp = (message?: string) => {
  const url = getWhatsAppUrl(message)

  if (!url) return

  openExternal(url)
}

export const getConfiguredSocialLinks =
  (): Array<[icon: string, label: string, href: string]> =>
    ([
      ["facebook", "Facebook", commercialConfig.social.facebook],

      ["instagram", "Instagram", commercialConfig.social.instagram],

      ["tiktok", "TikTok", commercialConfig.social.tiktok],
    ] as const)

      .filter((entry) => Boolean(entry[2]))

      .map(([icon, label, href]) => [icon, label, href as string])

export const syncNoticeItemsFromPolicies = (): CommercialNotice[] => {
  const { policies } = commercialConfig

  return [
    {
      id: "warranty",

      icon: "shield",

      title: policies.warrantyTitle,

      text: policies.warrantyText,

      featured: true,

      positive: true,
    },

    {
      id: "unlocked",

      icon: "unlock",

      title: policies.unlockedTitle,

      text: policies.unlockedText,

      featured: false,

      positive: true,
    },

    {
      id: "parts",

      icon: "check",

      title: policies.noReplacedPartsTitle,

      text: policies.noReplacedPartsText,

      featured: false,

      positive: true,
    },

    {
      id: "refurb",

      icon: "box",

      title: policies.notRefurbishedTitle,

      text: policies.notRefurbishedText,

      featured: false,

      positive: false,
    },

    {
      id: "stock",

      icon: "grid",

      title: policies.stockMixTitle,

      text: policies.stockMixText,

      featured: false,

      positive: false,
    },
  ]
}

commercialConfig.notices.items = syncNoticeItemsFromPolicies()

/** Hydrate the public configuration from the API; credentials never enter this module. */

export function applyBusinessConfig(
  config: import("@/types/models").BusinessConfig,
) {
  commercialConfig.businessName = config.businessName

  commercialConfig.contact.whatsapp = config.whatsapp

  commercialConfig.contact.whatsappLabel = `+${config.whatsapp}`

  commercialConfig.policies.warrantyDays = config.warrantyDays

  commercialConfig.policies.warrantyTitle = `${config.warrantyDays} días de garantía`

  commercialConfig.policies.warrantyText = `Garantía comercial de ${config.warrantyDays} días sobre el equipo adquirido.`

  commercialConfig.policies.deliveryModes = ["Entrega local", "Envío"]

  commercialConfig.notices.items = config.noticesJson.map((notice) => ({
    ...notice,
    icon: notice.icon || "info",
    featured: notice.featured ?? false,
    positive: notice.positive ?? true,
  }))
}
