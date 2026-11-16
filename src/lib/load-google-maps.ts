type GoogleNamespace = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts?: Record<string, unknown>,
    ) => GoogleMapInstance
    Marker: new (opts?: Record<string, unknown>) => GoogleMarkerInstance
    LatLngBounds: new () => GoogleLatLngBounds
    event: {
      addListenerOnce: (
        instance: unknown,
        name: string,
        handler: () => void,
      ) => void
      clearInstanceListeners: (instance: unknown) => void
    }
  }
}

export type GoogleMapInstance = {
  setCenter: (latLng: { lat: number; lng: number }) => void
  setZoom: (zoom: number) => void
  panTo: (latLng: { lat: number; lng: number }) => void
  fitBounds: (
    bounds: GoogleLatLngBounds,
    padding?: number | Record<string, number>,
  ) => void
  setOptions: (opts: Record<string, unknown>) => void
}

export type GoogleMarkerInstance = {
  setMap: (map: GoogleMapInstance | null) => void
  setPosition: (latLng: { lat: number; lng: number }) => void
  setTitle: (title: string) => void
}

export type GoogleLatLngBounds = {
  extend: (latLng: { lat: number; lng: number }) => void
}

declare global {
  interface Window {
    google?: GoogleNamespace
    __vcGoogleMapsCallback?: () => void
  }
}

let mapsPromise: Promise<GoogleNamespace> | null = null

export const loadGoogleMaps = (apiKey: string): Promise<GoogleNamespace> => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Maps solo está disponible en el navegador"))
  }
  if (window.google?.maps) return Promise.resolve(window.google)
  if (mapsPromise) return mapsPromise
  mapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      "script[data-vc-google-maps]",
    )
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.google?.maps) resolve(window.google)
        else reject(new Error("Google Maps no quedó disponible"))
      })
      existing.addEventListener("error", () =>
        reject(new Error("No se pudo cargar Google Maps")),
      )
      return
    }
    const callbackName = "__vcGoogleMapsCallback"
    window[callbackName] = () => {
      delete window[callbackName]
      if (window.google?.maps) resolve(window.google)
      else reject(new Error("Google Maps no quedó disponible"))
    }
    const script = document.createElement("script")
    script.dataset.vcGoogleMaps = "true"
    script.async = true
    script.defer = true
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callbackName}&v=weekly`
    script.onerror = () => {
      mapsPromise = null
      delete window[callbackName]
      reject(new Error("No se pudo cargar Google Maps"))
    }
    document.head.appendChild(script)
  })
  return mapsPromise
}
