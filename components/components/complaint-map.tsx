 "use client"

import "leaflet/dist/leaflet.css"

import { useEffect, useRef } from "react"
import type { Complaint } from "@/lib/types"
import L, { type Map as LeafletMap, type Marker as LeafletMarker, type LayerGroup } from "leaflet"

interface ComplaintMapProps {
  complaint: Pick<Complaint, "latitude" | "longitude" | "location">
}

export function ComplaintMap({ complaint }: ComplaintMapProps) {
  const GEOAPIFY_API_KEY =
    process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "14949184d70f47f1a732df67f90c56c2"

  const mapContainerId = `complaint-map-${complaint.latitude}-${complaint.longitude}`
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const placesLayerRef = useRef<LayerGroup | null>(null)

  const defaultMarkerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!GEOAPIFY_API_KEY) return
    if (mapRef.current) return

    const { latitude, longitude, location } = complaint
    const map = L.map(mapContainerId, {
      center: [latitude, longitude],
      zoom: 15,
    })
    mapRef.current = map

    const lightLayer = L.tileLayer(
      `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
      {
        attribution:
          'Powered by Geoapify | © OpenStreetMap contributors',
        maxZoom: 20,
      }
    )

    const satelliteLayer = L.tileLayer(
      `https://maps.geoapify.com/v1/tile/osm-bright-grey/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
      {
        attribution:
          'Powered by Geoapify | © OpenStreetMap contributors',
        maxZoom: 20,
      }
    )

    lightLayer.addTo(map)
    ;(map as any)._baseLayers = { lightLayer, satelliteLayer }

    placesLayerRef.current = L.layerGroup().addTo(map)

    markerRef.current = L.marker([latitude, longitude], {
      draggable: true,
      icon: defaultMarkerIcon,
      title: location,
    })
      .addTo(map)
      .bindPopup(location)

    const fetchNearbyPlaces = async (lat: number, lng: number) => {
      if (!placesLayerRef.current) return
      try {
        const url = new URL("https://api.geoapify.com/v2/places")
        url.searchParams.set(
          "categories",
          "education.school,healthcare.hospital,government.police"
        )
        url.searchParams.set("filter", `circle:${lng},${lat},1500`)
        url.searchParams.set("limit", "30")
        url.searchParams.set("apiKey", GEOAPIFY_API_KEY)

        const res = await fetch(url.toString())
        if (!res.ok) return
        const data = await res.json()

        placesLayerRef.current.clearLayers()

        ;(data.features || []).forEach((feature: any) => {
          const [fLng, fLat] = feature.geometry?.coordinates || []
          if (typeof fLat !== "number" || typeof fLng !== "number") return

          const props = feature.properties || {}
          const name = props.name || "Unnamed place"
          const category = (props.categories || [])[0] || "Place"

          const marker = L.marker([fLat, fLng], { icon: defaultMarkerIcon })
          marker.bindPopup(
            `<strong>${name}</strong><br />${category.replace(".", " · ")}`
          )
          marker.addTo(placesLayerRef.current as LayerGroup)
        })
      } catch {
        // ignore
      }
    }

    void fetchNearbyPlaces(latitude, longitude)

    markerRef.current.on("dragend", () => {
      const m = markerRef.current
      if (!m) return
      const pos = m.getLatLng()
      void fetchNearbyPlaces(pos.lat, pos.lng)
    })

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
      placesLayerRef.current = null
    }
  }, [GEOAPIFY_API_KEY, complaint, mapContainerId])

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div id={mapContainerId} className="h-72 w-full" />
    </div>
  )
}


