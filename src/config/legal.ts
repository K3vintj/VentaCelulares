export type LegalDocument = "privacy" | "cookies"

// Public editorial content. Never place administrator details or secrets here.
// This informative draft describes the current app; owner details and final
// retention/ARCO procedures must be completed before legal publication.
export const legalContent = {
  revision: "2026-11-15",
  updatedLabel: "15 de noviembre de 2026",
  privacy: {
    title: "Aviso de privacidad",
    lead: "Tu privacidad,",
    accent: "con claridad.",
    description: "Conoce qué información compartes y cómo se utiliza para atender tu solicitud.",
    sections: [
      {
        id: "datos",
        title: "Los datos que compartes",
        paragraphs: [
          "Al solicitar un equipo, compartes tu nombre y teléfono o WhatsApp. Si eliges envío, también indicas el destino. La solicitud incluye el equipo elegido, su precio de referencia, un folio y la fecha de registro.",
          "La página no solicita datos de tarjetas ni procesa pagos en línea. Evita escribir contraseñas, documentos de identidad o información sensible en el formulario o en los mensajes de atención.",
        ],
      },
      {
        id: "finalidades",
        title: "Para qué se utiliza",
        paragraphs: [
          "La información permite responder a tu interés, confirmar disponibilidad, dar seguimiento a la solicitud y coordinar la compra, entrega y atención relacionada con el equipo. Enviar la solicitud no realiza un pago ni reserva automáticamente la unidad.",
          "El formulario no incorpora una suscripción a publicidad. La versión actual de la tienda no incluye herramientas de analítica ni píxeles publicitarios.",
        ],
      },
      {
        id: "whatsapp",
        title: "Tú decides cuándo abrir WhatsApp",
        paragraphs: [
          "Primero se guarda tu solicitud en la tienda. Después puedes abrir WhatsApp con un mensaje que contiene el folio y la referencia del equipo; la página no envía ese mensaje por ti.",
          "Al abrir WhatsApp o Instagram pasas a un servicio externo que aplica sus propias condiciones y políticas de privacidad. Los datos que compartas durante esa conversación se gestionan también en ese servicio.",
          "La página de contacto muestra un mapa de Google Maps y una vista incrustada del perfil público de Instagram. Al cargar esa página, tu navegador se conecta con esos proveedores y les comunica datos técnicos de conexión. El mapa es una referencia de la zona; la entrega se coordina con el negocio.",
        ],
      },
      {
        id: "servicios",
        title: "Servicios que hacen posible la atención",
        paragraphs: [
          "El alojamiento de la página se realiza en Render y el almacenamiento de solicitudes y fotografías en Supabase. Estos proveedores pueden tratar información técnica y alojar datos fuera de México para prestar el servicio.",
          "Las fuentes se cargan desde Google Fonts y algunas fotografías pueden provenir de Unsplash. Al descargarlas, tu navegador comunica a esos proveedores información técnica de la conexión, como la dirección IP.",
        ],
      },
      {
        id: "proteccion",
        title: "Acceso y conservación",
        paragraphs: [
          "Los datos de las solicitudes se consultan desde el área administrativa con una sesión autenticada. No se muestran en el catálogo público. La conexión pública utiliza HTTPS y se realizan respaldos cifrados de los datos de la aplicación.",
          "Las solicitudes y su historial permanecen guardados en la tienda. La versión actual no realiza una eliminación automática por antigüedad; los plazos de conservación y el procedimiento operativo de supresión deben definirse antes de la publicación del aviso definitivo.",
        ],
      },
      {
        id: "derechos",
        title: "Tus derechos y los cambios a este aviso",
        paragraphs: [
          "Tienes derechos de acceso, rectificación, cancelación y oposición respecto de tus datos personales, así como la posibilidad de solicitar la revocación del consentimiento o limitar su uso en los casos que procedan.",
          "Para consultas sobre esta información puedes utilizar el canal público de atención de la tienda. Esta página presenta información sobre su funcionamiento actual.",
          "Las actualizaciones de esta información se publicarán en esta misma página, con su fecha de revisión. Puedes consultar por separado la política de cookies y las condiciones comerciales.",
        ],
      },
    ],
  },
  cookies: {
    title: "Política de cookies",
    lead: "Solo lo necesario",
    accent: "para funcionar.",
    description: "Información sencilla sobre la sesión y el almacenamiento que utiliza esta tienda.",
    sections: [
      {
        id: "uso",
        title: "Qué utiliza la aplicación",
        paragraphs: [
          "Una cookie es un pequeño dato que el navegador guarda para un sitio. Esta aplicación utiliza una cookie necesaria cuando el administrador inicia sesión. No necesitas iniciar sesión ni aceptar cookies publicitarias para explorar el catálogo o enviar una solicitud.",
        ],
      },
      {
        id: "preferencias",
        title: "Tu elección queda en tu navegador",
        paragraphs: [
          "Si cierras el aviso informativo de cookies, guardamos únicamente esa elección en el almacenamiento local de este navegador durante seis meses. No contiene tu nombre, teléfono ni datos de la solicitud, y no se envía al servidor.",
          "Puedes volver a consultar esta política desde el pie de página y restablecer el aviso cuando quieras. Si el navegador bloquea el almacenamiento, puedes seguir usando la tienda.",
        ],
      },
      {
        id: "terceros",
        title: "Servicios externos y su almacenamiento",
        paragraphs: [
          "La tienda no añade Google Analytics ni un píxel publicitario propio. Los contenidos incrustados de Google Maps e Instagram se sirven desde servicios externos que pueden utilizar sus propias cookies y tecnologías de seguimiento; consulta sus políticas para conocer su funcionamiento.",
          "El proveedor de alojamiento puede aplicar sus propias medidas técnicas de seguridad. Al abrir WhatsApp o una red social, las cookies de ese servicio se rigen por sus propias políticas.",
          "Al abrir Contacto se cargan contenidos incrustados de Google Maps e Instagram. Estos proveedores pueden utilizar cookies u otro almacenamiento conforme a sus propias políticas. Puedes controlar el contenido y las cookies de terceros desde la configuración de tu navegador.",
        ],
      },
      {
        id: "control",
        title: "Cómo controlar el almacenamiento",
        paragraphs: [
          "Puedes bloquear o eliminar cookies y datos del sitio desde la configuración de tu navegador. Eliminar o bloquear la cookie de sesión impide mantener el acceso administrativo; el catálogo público sigue disponible. Borrar el almacenamiento local hará que vuelva a mostrarse el aviso informativo.",
        ],
      },
    ],
  },
} as const

export const legalPath = (document: LegalDocument) =>
  `${import.meta.env.BASE_URL}${document === "privacy" ? "privacidad" : "cookies"}`

export function legalDocumentAtPath(pathname: string): LegalDocument | null {
  const path = pathname.replace(/\/$/, "")
  if (path === legalPath("privacy")) return "privacy"
  if (path === legalPath("cookies")) return "cookies"
  return null
}
