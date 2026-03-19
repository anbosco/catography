"use client";

import type { Feature, LineString } from "geojson";
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

const localMapStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#efe4d2",
      },
    },
  ],
};

const ringRoadGeoJson: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [1.377, 43.58],
      [1.392, 43.612],
      [1.43, 43.634],
      [1.475, 43.632],
      [1.493, 43.603],
      [1.482, 43.572],
      [1.44, 43.56],
      [1.397, 43.565],
      [1.377, 43.58],
    ],
  },
};

const garonneGeoJson: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [1.418, 43.646],
      [1.425, 43.635],
      [1.433, 43.62],
      [1.431, 43.606],
      [1.438, 43.593],
      [1.447, 43.575],
      [1.454, 43.558],
    ],
  },
};

const canalGeoJson: Feature<LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [1.431, 43.621],
      [1.449, 43.618],
      [1.479, 43.616],
      [1.496, 43.609],
    ],
  },
};

const neighborhoods = [
  { label: "Saint-Cyprien", longitude: 1.425, latitude: 43.6 },
  { label: "Capitole", longitude: 1.444, latitude: 43.605 },
  { label: "Minimes", longitude: 1.435, latitude: 43.62 },
  { label: "Carmes", longitude: 1.448, latitude: 43.596 },
  { label: "Rangueil", longitude: 1.463, latitude: 43.57 },
];

export function CatMap({
  sightings,
  selectable = false,
  selectedCoordinates = null,
  onSelectCoordinates,
}: CatMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const sightingMarkersRef = useRef<maplibregl.Marker[]>([]);
  const labelMarkersRef = useRef<maplibregl.Marker[]>([]);
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
      style: localMapStyle,
      center: [1.4442, 43.6047],
      zoom: 12.2,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", () => {
      map.fitBounds(toulouseBounds, {
        padding: 36,
        duration: 0,
      });

      map.addSource("ring-road", {
        type: "geojson",
        data: ringRoadGeoJson,
      });
      map.addSource("garonne", {
        type: "geojson",
        data: garonneGeoJson,
      });
      map.addSource("canal", {
        type: "geojson",
        data: canalGeoJson,
      });

      map.addLayer({
        id: "ring-road-line",
        type: "line",
        source: "ring-road",
        paint: {
          "line-color": "#d9cab8",
          "line-width": 10,
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: "ring-road-core",
        type: "line",
        source: "ring-road",
        paint: {
          "line-color": "#fff6ea",
          "line-width": 6,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "garonne-line",
        type: "line",
        source: "garonne",
        paint: {
          "line-color": "#84b6c4",
          "line-width": 14,
          "line-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "canal-line",
        type: "line",
        source: "canal",
        paint: {
          "line-color": "#9cc8d3",
          "line-width": 8,
          "line-opacity": 0.85,
        },
      });

      labelMarkersRef.current = neighborhoods.map((neighborhood) => {
        const label = document.createElement("div");
        label.className = "catography-map-label";
        label.textContent = neighborhood.label;

        return new maplibregl.Marker({
          element: label,
          anchor: "center",
        })
          .setLngLat([neighborhood.longitude, neighborhood.latitude])
          .addTo(map);
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
      labelMarkersRef.current.forEach((marker) => marker.remove());
      selectedMarkerRef.current?.remove();
      map.remove();
      mapInstanceRef.current = null;
      sightingMarkersRef.current = [];
      labelMarkersRef.current = [];
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
        sighting.status === "approved" ? "#d86b3d" : "#7b3f28";

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
    <div className="overflow-hidden rounded-[1.75rem] border border-border bg-[#efe4d2] shadow-[var(--shadow)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-deep">
            Carte interactive
          </p>
          <p className="text-sm text-muted">
            {selectable
              ? "Clique pour choisir l'emplacement du chat."
              : "Base locale offline, plus stable que le fond externe."}
          </p>
        </div>
        <span className="rounded-full bg-[#f7e1d3] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
          Toulouse
        </span>
      </div>
      <div ref={mapRef} className="h-[28rem] w-full" />
    </div>
  );
}
