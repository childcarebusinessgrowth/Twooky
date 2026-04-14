"use client"

export type GoogleMapInstance = {
  setCenter: (position: { lat: number; lng: number }) => void
  setZoom: (zoom: number) => void
  panTo: (position: { lat: number; lng: number }) => void
  fitBounds: (bounds: GoogleLatLngBoundsInstance, padding?: number) => void
}

export type GoogleMarkerInstance = {
  getPosition: () => { lat: () => number; lng: () => number } | null
  addListener: (eventName: string, handler: () => void) => void
  setMap: (map: GoogleMapInstance | null) => void
}

export type GoogleInfoWindowInstance = {
  setContent: (content: string) => void
  open: (options: { map: GoogleMapInstance; anchor: GoogleMarkerInstance }) => void
}

export type GoogleLatLngBoundsInstance = {
  extend: (position: { lat: number; lng: number }) => void
}

/** Geocoder result shape used for fitting the map to a searched place. */
export type GoogleGeocodeResult = {
  geometry: {
    viewport?: GoogleLatLngBoundsInstance
    location?: { lat: () => number; lng: () => number }
  }
}

export type GoogleGeocoderInstance = {
  geocode: (
    request: { address: string },
    callback: (results: GoogleGeocodeResult[] | null, status: string) => void,
  ) => void
}

export type GoogleMapsNamespace = {
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>,
  ) => GoogleMapInstance
  Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance
  InfoWindow: new () => GoogleInfoWindowInstance
  LatLngBounds: new () => GoogleLatLngBoundsInstance
  Geocoder: new () => GoogleGeocoderInstance
  Size: new (width: number, height: number) => unknown
  Point: new (x: number, y: number) => unknown
  event: {
    trigger: (instance: GoogleMarkerInstance, eventName: string) => void
  }
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace
    }
    __googleMapsLoaderPromise?: Promise<GoogleMapsNamespace>
  }
}

export async function loadGoogleMapsApi(apiKey: string): Promise<GoogleMapsNamespace> {
  if (typeof window === "undefined") {
    throw new Error("Google Maps API can only be loaded in the browser.")
  }

  if (window.google?.maps) {
    return window.google.maps
  }

  if (window.__googleMapsLoaderPromise) {
    return window.__googleMapsLoaderPromise
  }

  window.__googleMapsLoaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps)
        return
      }
      reject(new Error("Google Maps API loaded but maps namespace is unavailable."))
    }
    script.onerror = () => {
      reject(new Error("Failed to load Google Maps API script."))
    }

    document.head.appendChild(script)
  })

  return window.__googleMapsLoaderPromise
}
