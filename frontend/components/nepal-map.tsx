"use client"

import { useEffect, useRef, useState } from "react"
import type L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { School } from "@/lib/types"

interface NepalMapProps {
  schools: School[]
  onSchoolSelect: (school: School | null) => void
}

// Nepal's approximate center/bounds for the initial map view
const NEPAL_CENTER: [number, number] = [28.3949, 84.124]
const NEPAL_DEFAULT_ZOOM = 7

function schoolAddress(school: School): string {
  return [school.palika, school.district, school.province].filter(Boolean).join(", ")
}

function createMarkerIcon(leaflet: typeof L): L.DivIcon {
  const html = `
    <div class="looma-map-marker" style="width: 36px; height: 44px; cursor: pointer;">
      <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
        <!-- Teardrop pin -->
        <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 26 18 26s18-12.5 18-26C36 8.06 27.94 0 18 0z"
              fill="#1AA7E0" />
        <!-- White circle backdrop -->
        <circle cx="18" cy="18" r="12.5" fill="white" />
        <!-- Schoolhouse icon -->
        <g>
          <!-- flagpole + flag -->
          <line x1="18" y1="5.5" x2="18" y2="10" stroke="#1AA7E0" stroke-width="1.2" stroke-linecap="round" />
          <path d="M18 5.5 L22 6.7 L18 8.4 Z" fill="#1AA7E0" />
          <!-- roof -->
          <path d="M9 16.5 L18 10 L27 16.5 Z" fill="#1AA7E0" />
          <!-- building body -->
          <rect x="8.5" y="16.5" width="19" height="10.5" rx="1" fill="#1AA7E0" />
          <!-- windows -->
          <rect x="11" y="19" width="4" height="4" rx="0.5" fill="white" />
          <rect x="21" y="19" width="4" height="4" rx="0.5" fill="white" />
          <!-- door -->
          <rect x="16.2" y="21" width="3.6" height="6" rx="0.5" fill="white" />
        </g>
      </svg>
    </div>
  `

  return leaflet.divIcon({
    html,
    className: "looma-map-marker-wrapper",
    iconSize: [36, 44],
    iconAnchor: [18, 44], // bottom tip of the pin
    popupAnchor: [0, -38],
    tooltipAnchor: [0, -38],
  })
}

export function NepalMap({ schools, onSchoolSelect }: NepalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const leafletRef = useRef<typeof L | null>(null)

  const [mapReady, setMapReady] = useState(false)

  // Initialize map once — Leaflet is dynamically imported here so it never
  // runs during Next.js server-side rendering (Leaflet touches `window` on import).
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return
    let cancelled = false

    import("leaflet").then((leafletModule) => {
      if (cancelled || !mapContainerRef.current) return

      const leaflet = leafletModule.default
      leafletRef.current = leaflet

      const map = leaflet.map(mapContainerRef.current, {
        center: NEPAL_CENTER,
        zoom: NEPAL_DEFAULT_ZOOM,
        zoomControl: true,
      })

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        })
        .addTo(map)

      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  // Sync markers whenever the incoming (already filtered by parent) schools list changes
  useEffect(() => {
    const leaflet = leafletRef.current
    if (!mapRef.current || !mapReady || !leaflet) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const validSchools = schools.filter((s) => s.latitude != null && s.longitude != null)
    const bounds: L.LatLngExpression[] = []
    const icon = createMarkerIcon(leaflet)

    validSchools.forEach((school) => {
      const marker = leaflet
        .marker([school.latitude, school.longitude], { icon })
        .addTo(mapRef.current as L.Map)

      // Hover shows name + address. Leaflet attaches mouseover/mouseout
      // listeners automatically for tooltips — no manual event wiring needed.
      marker.bindTooltip(
        `
          <div style="font-family: inherit; padding: 1px 2px; min-width: 150px;">
            <div style="font-weight: 600; color: #1a2c5b; font-size: 13px;">${school.name}</div>
            <div style="color: #6b7280; font-size: 11.5px; margin-top: 2px;">${schoolAddress(school)}</div>
          </div>
        `,
        {
          direction: "top",
          offset: [0, -6],
          opacity: 0.97,
          className: "looma-map-tooltip",
        }
      )

      // Click opens the same detail interface as List view
      marker.on("click", () => {
        onSchoolSelect(school)
      })

      markersRef.current.push(marker)
      bounds.push([school.latitude, school.longitude])
    })

    // Fit bounds to whatever schools are currently passed in (e.g. the parent's
    // search/province filter has narrowed the list), otherwise show all of Nepal.
    if (bounds.length > 0) {
      mapRef.current.flyToBounds(leaflet.latLngBounds(bounds), {
        padding: [60, 60],
        maxZoom: 11,
        duration: 0.6,
      })
    } else {
      mapRef.current.flyTo(NEPAL_CENTER, NEPAL_DEFAULT_ZOOM, { duration: 0.6 })
    }
  }, [schools, mapReady, onSchoolSelect])

  return (
    <div className="w-full bg-card rounded-lg border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-orange-500">Looma School Locations Map</h2>
        <p className="text-sm text-muted-foreground">
          Discover schools using Looma devices throughout Nepal
        </p>
      </div>

      {/* Map */}
      <div className="w-full h-[600px] relative">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/*
        Leaflet's default pane z-indexes can get overridden by Tailwind/global
        CSS in Next.js, causing tooltips/popups to render behind the map tiles
        or marker icons. These overrides force the correct stacking order.
      */}
      <style jsx global>{`
        .leaflet-container {
          z-index: 0;
        }
        .leaflet-pane {
          z-index: 400;
        }
        .leaflet-tooltip-pane {
          z-index: 900 !important;
        }
        .leaflet-popup-pane {
          z-index: 900 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1000;
        }
        .looma-map-tooltip {
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          padding: 6px 4px;
        }
        .looma-map-tooltip::before {
          border-top-color: #e5e7eb;
        }
      `}</style>
    </div>
  )
}
