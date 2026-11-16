/** Configuración pública de Maps. Solo claves de navegador restringidas por dominio. */

export const googleMapsApiKey = (
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
).trim()

export const hasGoogleMapsKey = Boolean(googleMapsApiKey)

/** Referencia geográfica general de Coatzacoalcos (no es dirección del negocio). */
export const COATZACOALCOS = {
  lat: 18.13967,
  lng: -94.45084,
  label: "Coatzacoalcos, Veracruz",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Coatzacoalcos%2C%20Veracruz%2C%20Mexico",
} as const

export const LOCAL_ZOOM = 12
export const NATIONAL_ZOOM = 5

/** Límites aproximados del territorio mexicano para la vista nacional. */
export const MEXICO_BOUNDS = {
  north: 32.72,
  south: 14.53,
  west: -118.45,
  east: -86.7,
} as const

/** Estilo oscuro alineado a la identidad Alexxziño Store. */
export const ALEXXZINO_MAP_STYLES: Array<Record<string, unknown>> = [
  { elementType: "geometry", stylers: [{ color: "#121214" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#121214" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a90" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3a3a3e" }],
  },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#c6a667" }, { weight: 1.1 }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a1a1a6" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#2a2a2e" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c2c2e" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0b0b0d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f6f75" }],
  },
]
