 "use client"

import "leaflet/dist/leaflet.css"

import { useEffect, useMemo, useRef, useState } from "react"
import { useComplaints } from "@/lib/complaints-context"
import { useAuth } from "@/lib/auth-context"
import type { ComplaintCategory } from "@/lib/types"
import { categoryLabels } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComplaintCard } from "./complaint-card"
import { Button as IconButton } from "@/components/ui/button"
import L, { type Map as LeafletMap, type Marker as LeafletMarker, type LayerGroup } from "leaflet"
import { ArrowLeft, Image as ImageIcon, MapPin, Send, X } from "lucide-react"

interface CreateComplaintProps {
  onBack: () => void
}

export function CreateComplaint({ onBack }: CreateComplaintProps) {
  const { addComplaint, complaints } = useComplaints()
  const { user } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<ComplaintCategory | "">("")
  const [location, setLocation] = useState("")
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [district, setDistrict] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [autocompleteResults, setAutocompleteResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Leaflet map references
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const placesLayerRef = useRef<LayerGroup | null>(null)
  const searchTimeoutRef = useRef<number | null>(null)

  const GEOAPIFY_API_KEY =
    process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "14949184d70f47f1a732df67f90c56c2"

  // Configure a default Leaflet marker icon that works with Next.js bundling
  const defaultMarkerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  })

  const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024 // 3MB
  const MAX_IMAGES = 3

  // Initialize the Leaflet map once on mount
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!GEOAPIFY_API_KEY) return
    if (mapRef.current) return

    const initialLat = 13.0827 // Chennai
    const initialLng = 80.2707

    const map = L.map("complaint-location-map", {
      center: [initialLat, initialLng],
      zoom: 12,
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
      // Geoapify does not provide real satellite imagery; this is an alternative darker style
      `https://maps.geoapify.com/v1/tile/osm-bright-grey/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_API_KEY}`,
      {
        attribution:
          'Powered by Geoapify | © OpenStreetMap contributors',
        maxZoom: 20,
      }
    )

    lightLayer.addTo(map)

    // Store both layers on the map instance for easy toggling
    ;(map as any)._baseLayers = { lightLayer, satelliteLayer }

    // Create layer group for nearby places
    placesLayerRef.current = L.layerGroup().addTo(map)

    // Allow placing marker by clicking on map
    map.on("click", (e: L.LeafletMouseEvent) => {
      handleSetLocationFromCoords(e.latlng.lat, e.latlng.lng, "map-click")
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GEOAPIFY_API_KEY])

  // Helper to toggle between light and alternative tiles
  const toggleBaseLayer = () => {
    const map = mapRef.current as any
    if (!map || !map._baseLayers) return
    const { lightLayer, satelliteLayer } = map._baseLayers

    if (map.hasLayer(lightLayer)) {
      map.removeLayer(lightLayer)
      map.addLayer(satelliteLayer)
    } else {
      map.removeLayer(satelliteLayer)
      map.addLayer(lightLayer)
    }
  }

  // Reverse geocode to get district and human-readable location
  const fetchReverseGeocode = async (lat: number, lng: number) => {
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/reverse")
      url.searchParams.set("lat", String(lat))
      url.searchParams.set("lon", String(lng))
      url.searchParams.set("apiKey", GEOAPIFY_API_KEY)
      url.searchParams.set("lang", "en")

      const res = await fetch(url.toString())
      if (!res.ok) return
      const data = await res.json()
      const feature = data.features?.[0]
      if (!feature) return

      const props = feature.properties || {}
      const districtName =
        props.state_district ||
        props.county ||
        props.city ||
        props.suburb ||
        props.state ||
        ""
      const formatted = props.formatted || [props.name, props.street, props.city]
        .filter(Boolean)
        .join(", ")

      setDistrict(districtName)
      setLocation(formatted || `${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } catch {
      // ignore network errors, keep existing values
    }
  }

  // Fetch nearby schools, hospitals, and police stations using Geoapify Places API
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
      // ignore places errors; they are non-critical
    }
  }

  // Central helper to place or move marker and update map + data
  const handleSetLocationFromCoords = async (
    lat: number,
    lng: number,
    _source: "map-click" | "drag" | "search" | "current-location"
  ) => {
    setLatitude(lat)
    setLongitude(lng)

    const map = mapRef.current
    if (map) {
      map.setView([lat, lng], 15)
    }

    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], {
        draggable: true,
        icon: defaultMarkerIcon,
      }).addTo(map as LeafletMap)

      markerRef.current.on("dragend", () => {
        const m = markerRef.current
        if (!m) return
        const pos = m.getLatLng()
        void handleSetLocationFromCoords(pos.lat, pos.lng, "drag")
      })
    } else {
      markerRef.current.setLatLng([lat, lng])
    }

    await fetchReverseGeocode(lat, lng)
    await fetchNearbyPlaces(lat, lng)
  }

  // Autocomplete search for locations in India
  const runAutocomplete = async (text: string) => {
    if (!text.trim()) {
      setAutocompleteResults([])
      return
    }

    setIsSearching(true)
    try {
      const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete")
      url.searchParams.set("text", text)
      url.searchParams.set("filter", "countrycode:in")
      url.searchParams.set("limit", "7")
      url.searchParams.set("apiKey", GEOAPIFY_API_KEY)
      url.searchParams.set("lang", "en")

      const res = await fetch(url.toString())
      if (!res.ok) {
        setAutocompleteResults([])
        return
      }

      const data = await res.json()
      setAutocompleteResults(data.features || [])
    } catch {
      setAutocompleteResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced autocomplete handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setLocation(value)

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      void runAutocomplete(value)
    }, 300)
  }

  const handleSelectSuggestion = (feature: any) => {
    const props = feature.properties || {}
    const lat = feature.geometry?.coordinates?.[1]
    const lng = feature.geometry?.coordinates?.[0]
    if (typeof lat !== "number" || typeof lng !== "number") return

    const formatted = props.formatted || props.address_line1 || props.address_line2
    setSearchQuery(formatted || "")
    setLocation(formatted || "")
    setAutocompleteResults([])

    void handleSetLocationFromCoords(lat, lng, "search")
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      ;(async () => {
        const text = searchQuery.trim()
        if (!text) return

        try {
          const url = new URL("https://api.geoapify.com/v1/geocode/search")
          url.searchParams.set("text", text)
          url.searchParams.set("filter", "countrycode:in")
          url.searchParams.set("limit", "1")
          url.searchParams.set("apiKey", GEOAPIFY_API_KEY)
          url.searchParams.set("lang", "en")

          const res = await fetch(url.toString())
          if (!res.ok) return
          const data = await res.json()
          const feature = data.features?.[0]
          if (!feature) return

          handleSelectSuggestion(feature)
        } catch {
          // ignore
        }
      })()
    }
  }

  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        void handleSetLocationFromCoords(lat, lng, "current-location")
      },
      () => {
        // silently ignore geolocation errors
      }
    )
  }

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

  const uploadToCloudinary = async (file: File) => {
    const image = await fileToDataUrl(file)
    const res = await fetch("/api/upload/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return data.url as string
  }

  // Similar complaints nearby
  const similarComplaints = useMemo(() => {
    if (!title && !category) return []
    return complaints
      .filter((c) => {
        const matchesCategory = category && c.category === category
        const matchesTitle =
          title.length > 3 &&
          c.title.toLowerCase().includes(title.toLowerCase().slice(0, 10))
        return (matchesCategory || matchesTitle) && c.status !== "verified"
      })
      .slice(0, 3)
  }, [title, category, complaints])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !title ||
      !description ||
      !category ||
      !location ||
      !user ||
      latitude == null ||
      longitude == null ||
      !district
    )
      return
    if (images.length === 0) {
      setUploadError("At least one image is required.")
      return
    }

    setIsUploading(true)
    setUploadError("")

    try {
      const uploadedUrls = await Promise.all(images.map(uploadToCloudinary))

      await addComplaint({
        title,
        description,
        category: category as ComplaintCategory,
        status: "unsolved",
        location,
        // Use detected district as the complaint's region for district-based filtering
        region: district || user.region,
        latitude,
        longitude,
        images: uploadedUrls,
        userId: user.id,
        userName: user.name,
      })

      setSubmitted(true)
    } catch {
      setUploadError("Failed to upload image(s). Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
            <MapPin className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Complaint Registered Successfully
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            Your complaint has been submitted and mapped to your local municipality. You will receive updates as it progresses.
          </p>
          <Button onClick={onBack}>Back to Dashboard</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 gap-2 text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-xl font-bold text-foreground mb-1">Report an Issue</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Describe the civic issue and we will route it to the right authority
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="complaint-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="complaint-title"
              placeholder="Brief description of the issue"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-category">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ComplaintCategory)}
            >
              <SelectTrigger id="complaint-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="complaint-description"
              placeholder="Detailed description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="complaint-location">
              Location <span className="text-destructive">*</span>
            </Label>

            {/* Geoapify-powered search input with autocomplete suggestions */}
            <div className="space-y-1">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="complaint-location"
                  placeholder="Search for a location in India"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              {autocompleteResults.length > 0 && (
                <div className="z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow">
                  <ul className="py-1 text-sm">
                    {autocompleteResults.map((feature, idx) => {
                      const props = feature.properties || {}
                      const primary =
                        props.formatted || props.address_line1 || props.address_line2
                      return (
                        <li
                          key={feature.properties?.place_id || idx}
                          className="cursor-pointer px-3 py-1.5 hover:bg-muted/70"
                          onClick={() => handleSelectSuggestion(feature)}
                        >
                          {primary}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
              {isSearching && (
                <p className="text-xs text-muted-foreground">Searching addresses...</p>
              )}
            </div>

            {/* Map + controls in a fixed-height box */}
            <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Set the exact location on the map
                </p>
                <div className="flex gap-2">
                  <IconButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                  >
                    Use Current Location
                  </IconButton>
                  <IconButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleBaseLayer}
                  >
                    Toggle Satellite
                  </IconButton>
                </div>
              </div>

              <div
                id="complaint-location-map"
                className="mt-2 h-64 w-full overflow-hidden rounded-lg bg-muted"
              />

              <div className="grid gap-2 pt-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div>
                  <span className="font-semibold text-foreground">Latitude: </span>
                  {latitude != null ? latitude.toFixed(6) : "Not set"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Longitude: </span>
                  {longitude != null ? longitude.toFixed(6) : "Not set"}
                </div>
                <div>
                  <span className="font-semibold text-foreground">District: </span>
                  {district || "Not detected yet"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complaint-images">
              Images <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="complaint-images"
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={(e) => {
                  setUploadError("")
                  const files = Array.from(e.target.files || [])
                  const remaining = MAX_IMAGES - images.length
                  const next = files.slice(0, Math.max(0, remaining)).filter((f) => {
                    if (f.size > MAX_IMAGE_SIZE_BYTES) {
                      setUploadError("Each image must be 3MB or less.")
                      return false
                    }
                    return true
                  })
                  setImages((prev) => [...prev, ...next])
                  e.currentTarget.value = ""
                }}
              />
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                Up to {MAX_IMAGES} images, max 3MB each
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((file, idx) => (
                  <div
                    key={`${file.name}-${file.size}-${idx}`}
                    className="relative overflow-hidden rounded-lg border border-border bg-muted/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-24 w-full object-cover"
                      onLoad={(e) => {
                        URL.revokeObjectURL((e.target as HTMLImageElement).src)
                      }}
                    />
                    <button
                      type="button"
                      className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-background/80 text-foreground hover:bg-background"
                      onClick={() =>
                        setImages((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove image"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
          </div>

          {/* Similar complaints */}
          {similarComplaints.length > 0 && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-1">
                Similar complaints found nearby
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                {"You can support an existing complaint instead of creating a new one using the \"Facing Same Issue\" button."}
              </p>
              <div className="space-y-3">
                {similarComplaints.map((c) => (
                  <ComplaintCard
                    key={c.id}
                    complaint={c}
                    onSelect={() => {}}
                    compact
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={
              !title ||
              !description ||
              !category ||
              !location ||
              images.length === 0 ||
              isUploading ||
              latitude == null ||
              longitude == null ||
              !district
            }
          >
            <Send className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Submit Complaint"}
          </Button>
        </form>
      </div>
    </main>
  )
}
