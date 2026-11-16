import { Icon } from "@/components/ui"
import { Skeleton } from "@/components/ui/Skeleton"
import {
  ALEXXZINO_MAP_STYLES,
  COATZACOALCOS,
  LOCAL_ZOOM,
  MEXICO_BOUNDS,
  googleMapsApiKey,
  hasGoogleMapsKey,
} from "@/config/maps"
import {
  loadGoogleMaps,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
} from "@/lib/load-google-maps"
import { useEffect, useId, useRef, useState } from "react"

type DeliveryMode = "local" | "national"
type MapStatus = "idle" | "loading" | "ready" | "error" | "not_configured"

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const modeCopy: Record<
  DeliveryMode,
  { title: string; description: string; control: string }
> = {
  local: {
    control: "Entrega local",
    title: "Entrega local en Coatzacoalcos",
    description:
      "Coordina la entrega de tu próximo iPhone directamente con nosotros.",
  },
  national: {
    control: "Envío nacional",
    title: "Envíos dentro de México",
    description:
      "Consulta con nosotros la disponibilidad y las condiciones de envío a tu destino.",
  },
}

export function DeliveryModesCard() {
  const groupId = useId()
  const shellRef = useRef<HTMLDivElement>(null)
  const mapNodeRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GoogleMapInstance | null>(null)
  const markerRef = useRef<GoogleMarkerInstance | null>(null)
  const [mode, setMode] = useState<DeliveryMode>("local")
  const [status, setStatus] = useState<MapStatus>(
    hasGoogleMapsKey ? "idle" : "not_configured",
  )
  const [shouldLoad, setShouldLoad] = useState(false)
  const copy = modeCopy[mode]

  useEffect(() => {
    if (!hasGoogleMapsKey || shouldLoad) return
    const node = shellRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setShouldLoad(true)
        observer.disconnect()
      },
      { rootMargin: "120px 0px", threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shouldLoad])

  useEffect(() => {
    if (!shouldLoad || !hasGoogleMapsKey || mapRef.current) return
    let cancelled = false
    setStatus("loading")
    void loadGoogleMaps(googleMapsApiKey)
      .then((google) => {
        if (cancelled || !mapNodeRef.current) return
        const map = new google.maps.Map(mapNodeRef.current, {
          center: COATZACOALCOS,
          zoom: LOCAL_ZOOM,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: "cooperative",
          styles: ALEXXZINO_MAP_STYLES,
          backgroundColor: "#121214",
        })
        const marker = new google.maps.Marker({
          map,
          position: COATZACOALCOS,
          title: `${COATZACOALCOS.label} · Referencia de la zona`,
          optimized: true,
        })
        mapRef.current = map
        markerRef.current = marker
        setStatus("ready")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [shouldLoad])

  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== "ready") return
    const reduced = prefersReducedMotion()
    if (mode === "local") {
      if (reduced) {
        map.setCenter(COATZACOALCOS)
        map.setZoom(LOCAL_ZOOM)
      } else {
        map.panTo(COATZACOALCOS)
        window.setTimeout(() => map.setZoom(LOCAL_ZOOM), 180)
      }
      return
    }
    void loadGoogleMaps(googleMapsApiKey).then((google) => {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend({ lat: MEXICO_BOUNDS.south, lng: MEXICO_BOUNDS.west })
      bounds.extend({ lat: MEXICO_BOUNDS.north, lng: MEXICO_BOUNDS.east })
      map.fitBounds(bounds, reduced ? 24 : 36)
    })
  }, [mode, status])

  useEffect(() => {
    return () => {
      markerRef.current?.setMap(null)
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  return (
    <article className="contact-card delivery-modes-card">
      <header className="delivery-modes-header">
        <h2 className="footer-heading">Modalidades de entrega</h2>
        <span className="delivery-modes-icon" aria-hidden="true">
          <Icon name="pin" size={18} />
        </span>
      </header>
      <div
        className="delivery-mode-switch"
        role="radiogroup"
        aria-label="Seleccionar modalidad de entrega"
      >
        {(["local", "national"] as const).map((value) => {
          const selected = mode === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`delivery-mode-option${selected ? " is-active" : ""}`}
              onClick={() => setMode(value)}
              id={`${groupId}-${value}`}
            >
              <span className="delivery-mode-option-label">
                {modeCopy[value].control}
              </span>
              {selected && (
                <span className="sr-only"> (seleccionado)</span>
              )}
            </button>
          )
        })}
      </div>
      <div ref={shellRef} className="delivery-map-shell">
        {(status === "idle" || status === "loading") && hasGoogleMapsKey && (
          <div className="delivery-map-skeleton" aria-busy="true">
            <span className="sr-only">Cargando mapa</span>
            <Skeleton className="delivery-map-skel" radius={12} />
          </div>
        )}
        {hasGoogleMapsKey && (
          <div
            ref={mapNodeRef}
            className={`delivery-map-canvas${status === "ready" ? " is-visible" : ""}`}
            role="img"
            aria-label={
              mode === "local"
                ? "Mapa de referencia de Coatzacoalcos, Veracruz"
                : "Mapa de referencia del territorio de México"
            }
          />
        )}
        {(status === "not_configured" || status === "error") && (
          <div className="delivery-map-fallback" role="status">
            <Icon name="pin" size={22} />
            <p>
              {status === "not_configured"
                ? "El mapa interactivo estará disponible cuando se configure la clave pública de Google Maps."
                : "No se pudo cargar el mapa en este momento."}
            </p>
            <a
              href={COATZACOALCOS.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="delivery-map-external"
            >
              Ver Coatzacoalcos en Google Maps
            </a>
          </div>
        )}
      </div>
      <div className="delivery-mode-info">
        <p className="delivery-mode-info-title">
          <Icon name="pin" size={16} />
          <span>{copy.title}</span>
        </p>
        <p className="delivery-mode-info-text">{copy.description}</p>
      </div>
    </article>
  )
}
