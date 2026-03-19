"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import type { CatSighting, Coordinates } from "@/lib/types";

type CatMapProps = {
  sightings: CatSighting[];
  selectable?: boolean;
  selectedCoordinates?: Coordinates | null;
  onSelectCoordinates?: (coordinates: Coordinates) => void;
};

const toulouseBounds = new maplibregl.LngLatBounds(
  [1.3535, 43.556],
  [1.504, 43.648],
);

const toulouseMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster",
      type: "raster",
      source: "osm-raster",
      paint: {
        "raster-opacity": 0.92,
        "raster-saturation": -0.48,
        "raster-contrast": 0.08,
      },
    },
  ],
};

export function CatMap({
  sightings,
  selectable = false,
  selectedCoordinates = null,
  onSelectCoordinates,
}: CatMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const sightingMarkersRef = useRef<maplibregl.Marker[]>([]);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);

  const handleSelectCoordinates = useEffectEvent((coordinates: Coordinates) => {
    onSelectCoordinates?.(coordinates);
  });

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: toulouseMapStyle,
      center: [1.4442, 43.6047],
      zoom: 12.2,
      attributionControl: false,
      maxBounds: toulouseBounds,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      "bottom-right",
    );

    map.on("load", () => {
      map.fitBounds(toulouseBounds, {
        padding: 36,
        duration: 0,
      });
    });

    if (selectable) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", (event) => {
        handleSelectCoordinates({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
      });
    }

    return () => {
      sightingMarkersRef.current.forEach((marker) => marker.remove());
      selectedMarkerRef.current?.remove();
      map.remove();
      mapInstanceRef.current = null;
      sightingMarkersRef.current = [];
      selectedMarkerRef.current = null;
    };
  }, [selectable]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    sightingMarkersRef.current.forEach((marker) => marker.remove());

    sightingMarkersRef.current = sightings.map((sighting) => {
      const markerColor =
        sighting.status === "approved" ? "#f08cab" : "#915b76";

      const popup = new maplibregl.Popup({ offset: 18 }).setHTML(
        `
          <div class="catography-popup">
            <p class="catography-popup__eyebrow">${sighting.neighborhood}</p>
            <h3 class="catography-popup__title">${sighting.name}</h3>
            <p class="catography-popup__meta">${sighting.color} • ${sighting.behavior}</p>
            <p class="catography-popup__note">${sighting.note}</p>
          </div>
        `,
      );

      return new maplibregl.Marker({ color: markerColor })
        .setLngLat([sighting.longitude, sighting.latitude])
        .setPopup(popup)
        .addTo(map);
    });
  }, [sightings]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    selectedMarkerRef.current?.remove();

    if (!selectedCoordinates) {
      selectedMarkerRef.current = null;
      return;
    }

    const element = document.createElement("button");
    element.type = "button";
    element.className = "catography-selected-pin";
    element.setAttribute("aria-label", "Point selectionne");

    selectedMarkerRef.current = new maplibregl.Marker({
      element,
      anchor: "bottom",
    })
      .setLngLat([selectedCoordinates.longitude, selectedCoordinates.latitude])
      .addTo(map);
  }, [selectedCoordinates]);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-[#f8ecf2] shadow-[var(--shadow)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
            Carte interactive
          </p>
          <p className="text-sm text-muted">
            {selectable
              ? "Clique pour choisir l'emplacement du chat."
              : "Carte reelle de Toulouse avec tuiles OpenStreetMap."}
          </p>
        </div>
        <span className="rounded-full bg-[#ffe2ed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
          Toulouse
        </span>
      </div>
      <div ref={mapRef} className="h-[28rem] w-full" />
    </div>
  );
}
