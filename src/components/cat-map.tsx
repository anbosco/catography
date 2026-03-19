"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import maplibregl, { type StyleSpecification } from "maplibre-gl";
import { getNeighborhoodFeatureCollection } from "@/lib/toulouse-neighborhoods";
import type { CatSighting, Coordinates, MapFocusTarget } from "@/lib/types";

type HighlightedNeighborhood = {
  name: string;
  color: string;
};

type CatMapProps = {
  sightings: CatSighting[];
  selectable?: boolean;
  selectedCoordinates?: Coordinates | null;
  onSelectCoordinates?: (coordinates: Coordinates) => void;
  onToggleLike?: (id: string) => void;
  heightClassName?: string;
  highlightedNeighborhoods?: HighlightedNeighborhood[];
  initialFocus?: MapFocusTarget | null;
};

type PopupOffset = {
  x: number;
  y: number;
};

type PopupPosition = {
  left: number;
  top: number;
};

type MarkerTone = {
  key: string;
  color: string;
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
        "raster-opacity": 0.94,
        "raster-saturation": -0.28,
        "raster-contrast": 0.05,
      },
    },
  ],
};

const initialPopupOffset: PopupOffset = {
  x: 0,
  y: -32,
};

const defaultPopupSize = {
  width: 320,
  height: 360,
};

const markerSourceId = "catography-sightings";
const markerIconLayerId = `${markerSourceId}-icon`;
const markerEmojiLayerId = `${markerSourceId}-emoji`;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getMarkerTone(color: string): MarkerTone {
  const normalized = color.trim().toLowerCase();

  if (normalized.includes("noir")) {
    return { key: "charcoal", color: "#5a434b" };
  }

  if (normalized.includes("blanc") || normalized.includes("crème") || normalized.includes("creme")) {
    return { key: "cream", color: "#e4c896" };
  }

  if (normalized.includes("roux") || normalized.includes("ginger") || normalized.includes("orange")) {
    return { key: "orange", color: "#d67d43" };
  }

  if (
    normalized.includes("écaille") ||
    normalized.includes("ecaille") ||
    normalized.includes("isabelle") ||
    normalized.includes("calico")
  ) {
    return { key: "calico", color: "#c78862" };
  }

  if (
    normalized.includes("chocolat") ||
    normalized.includes("marron") ||
    normalized.includes("brun")
  ) {
    return { key: "brown", color: "#9a6a50" };
  }

  if (normalized.includes("bleu") || normalized.includes("gris")) {
    return { key: "slate", color: "#7d8ea8" };
  }

  return { key: "pink", color: "#f08cab" };
}

function getMarkerIconId(sighting: CatSighting) {
  if (sighting.status === "pending") {
    return "cat-pin-pending";
  }

  return `cat-pin-${getMarkerTone(sighting.color).key}`;
}

function buildMarkerSvg(fill: string) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="58" height="76" viewBox="0 0 58 76" fill="none">
      <defs>
        <filter id="shadow" x="0" y="0" width="58" height="76" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="5" stdDeviation="3" flood-color="rgba(145,91,118,0.22)"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="29" cy="26" r="23" fill="${fill}" stroke="#FFF7FB" stroke-width="3"/>
        <rect x="19" y="39" width="20" height="20" rx="3" fill="${fill}" transform="rotate(45 29 49)"/>
      </g>
    </svg>
  `;
}

function loadMarkerImage(
  map: maplibregl.Map,
  id: string,
  fill: string,
) {
  if (map.hasImage(id)) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (!map.hasImage(id)) {
        map.addImage(id, image, { pixelRatio: 2 });
      }
      resolve();
    };
    image.onerror = () => reject(new Error(`Impossible de charger l'icone ${id}.`));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildMarkerSvg(fill))}`;
  });
}

export function CatMap({
  sightings,
  selectable = false,
  selectedCoordinates = null,
  onSelectCoordinates,
  onToggleLike,
  heightClassName = "h-[38rem] md:h-[42rem]",
  highlightedNeighborhoods = [],
  initialFocus = null,
}: CatMapProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const selectedMarkerRef = useRef<maplibregl.Marker | null>(null);
  const sightingsRef = useRef(sightings);
  const activeSightingIdRef = useRef<string | null>(null);
  const draggingPopupRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const popupOffsetRef = useRef<PopupOffset>(initialPopupOffset);
  const appliedFocusKeyRef = useRef<string | null>(null);

  const [activeSightingId, setActiveSightingId] = useState<string | null>(null);
  const [popupOffset, setPopupOffset] = useState<PopupOffset>(initialPopupOffset);
  const [popupDragActive, setPopupDragActive] = useState(false);
  const [projectedPoint, setProjectedPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [mapViewportSize, setMapViewportSize] = useState({ width: 0, height: 0 });
  const [popupSize, setPopupSize] = useState(defaultPopupSize);
  const [markerAssetsReady, setMarkerAssetsReady] = useState(false);

  const handleSelectCoordinates = useEffectEvent((coordinates: Coordinates) => {
    onSelectCoordinates?.(coordinates);
  });

  const activeSighting =
    sightings.find((sighting) => sighting.id === activeSightingId) ?? null;

  useEffect(() => {
    sightingsRef.current = sightings;
  }, [sightings]);

  useEffect(() => {
    activeSightingIdRef.current = activeSightingId;
  }, [activeSightingId]);

  useEffect(() => {
    popupOffsetRef.current = popupOffset;
  }, [popupOffset]);

  useEffect(() => {
    if (!mapViewportRef.current) {
      return;
    }

    const node = mapViewportRef.current;
    const updateSize = () => {
      setMapViewportSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!popupRef.current) {
      return;
    }

    const node = popupRef.current;
    const updateSize = () => {
      setPopupSize({
        width: node.offsetWidth || defaultPopupSize.width,
        height: node.offsetHeight || defaultPopupSize.height,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [activeSightingId]);

  const popupPosition = useMemo<PopupPosition | null>(() => {
    if (!projectedPoint || mapViewportSize.width === 0 || mapViewportSize.height === 0) {
      return null;
    }

    const horizontalMargin = 16;
    const verticalMargin = 16;
    const anchorGap = 18;

    const idealAboveTop = projectedPoint.y - popupSize.height - anchorGap + popupOffset.y;
    const idealBelowTop = projectedPoint.y + anchorGap + popupOffset.y;
    const opensBelow = idealAboveTop < verticalMargin;

    return {
      left: clamp(
        projectedPoint.x - popupSize.width / 2 + popupOffset.x,
        horizontalMargin,
        Math.max(
          horizontalMargin,
          mapViewportSize.width - popupSize.width - horizontalMargin,
        ),
      ),
      top: clamp(
        opensBelow ? idealBelowTop : idealAboveTop,
        verticalMargin,
        Math.max(
          verticalMargin,
          mapViewportSize.height - popupSize.height - verticalMargin,
        ),
      ),
    };
  }, [mapViewportSize.height, mapViewportSize.width, popupOffset.x, popupOffset.y, popupSize.height, popupSize.width, projectedPoint]);

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

    map.on("load", async () => {
      map.fitBounds(toulouseBounds, {
        padding: 40,
        duration: 0,
      });

      await Promise.all([
        loadMarkerImage(map, "cat-pin-pending", "#63c38a"),
        loadMarkerImage(map, "cat-pin-charcoal", "#5a434b"),
        loadMarkerImage(map, "cat-pin-cream", "#e4c896"),
        loadMarkerImage(map, "cat-pin-orange", "#d67d43"),
        loadMarkerImage(map, "cat-pin-calico", "#c78862"),
        loadMarkerImage(map, "cat-pin-brown", "#9a6a50"),
        loadMarkerImage(map, "cat-pin-slate", "#7d8ea8"),
        loadMarkerImage(map, "cat-pin-pink", "#f08cab"),
      ]);

      if (!map.getSource(markerSourceId)) {
        map.addSource(markerSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      if (!map.getLayer(markerIconLayerId)) {
        map.addLayer({
          id: markerIconLayerId,
          type: "symbol",
          source: markerSourceId,
          layout: {
            "icon-image": ["get", "markerIcon"] as never,
            "icon-anchor": "bottom",
            "icon-size": 1.32,
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
        });
      }

      if (!map.getLayer(markerEmojiLayerId)) {
        map.addLayer({
          id: markerEmojiLayerId,
          type: "symbol",
          source: markerSourceId,
          layout: {
            "text-field": "🐱",
            "text-font": ["Open Sans Regular"] as never,
            "text-size": 18,
            "text-anchor": "center",
            "text-offset": [0.02, -1.22] as never,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
          },
        });
      }

      map.on("mouseenter", markerIconLayerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", markerIconLayerId, () => {
        map.getCanvas().style.cursor = selectable ? "crosshair" : "";
      });

      map.on("click", markerIconLayerId, (event) => {
        const feature = event.features?.[0];
        const markerId = feature?.properties?.id;

        if (!markerId) {
          return;
        }

        const sighting = sightingsRef.current.find((entry) => entry.id === markerId);

        if (!sighting) {
          return;
        }

        setActiveSightingId(sighting.id);
        setPopupOffset(initialPopupOffset);
        const point = map.project([sighting.longitude, sighting.latitude]);
        setProjectedPoint({ x: point.x, y: point.y });
      });

      setMarkerAssetsReady(true);
    });

    const handleMapChange = () => {
      const currentActiveId = activeSightingIdRef.current;

      if (currentActiveId) {
        const currentSighting = sightingsRef.current.find(
          (sighting) => sighting.id === currentActiveId,
        );

        if (currentSighting) {
          const point = map.project([
            currentSighting.longitude,
            currentSighting.latitude,
          ]);
          setProjectedPoint({ x: point.x, y: point.y });
        }
      }
    };
    map.on("move", handleMapChange);
    map.on("zoom", handleMapChange);

    if (selectable) {
      map.getCanvas().style.cursor = "crosshair";
      map.on("click", (event) => {
        const markerFeatures = map.queryRenderedFeatures(event.point, {
          layers: [markerIconLayerId],
        });

        if (markerFeatures.length > 0) {
          return;
        }

        handleSelectCoordinates({
          latitude: event.lngLat.lat,
          longitude: event.lngLat.lng,
        });
      });
    }

    return () => {
      map.off("move", handleMapChange);
      map.off("zoom", handleMapChange);
      selectedMarkerRef.current?.remove();
      map.remove();
      mapInstanceRef.current = null;
      selectedMarkerRef.current = null;
    };
  }, [selectable]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !markerAssetsReady) {
      return;
    }

    const source = map.getSource(markerSourceId) as maplibregl.GeoJSONSource | undefined;

    if (!source) {
      return;
    }

    source.setData({
      type: "FeatureCollection",
      features: sightings.map((sighting) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [sighting.longitude, sighting.latitude],
        },
        properties: {
          id: sighting.id,
          markerIcon: getMarkerIconId(sighting),
        },
      })),
    } as GeoJSON.FeatureCollection);

    if (map.getLayer(markerIconLayerId)) {
      map.setLayoutProperty(
        markerIconLayerId,
        "icon-size",
        [
          "case",
          ["==", ["get", "id"], activeSightingId ?? ""],
          1.42,
          1.32,
        ] as never,
      );
    }

    if (map.getLayer(markerEmojiLayerId)) {
      map.setLayoutProperty(
        markerEmojiLayerId,
        "text-size",
        [
          "case",
          ["==", ["get", "id"], activeSightingId ?? ""],
          19,
          18,
        ] as never,
      );
      map.setLayoutProperty(
        markerEmojiLayerId,
        "text-offset",
        [
          "case",
          ["==", ["get", "id"], activeSightingId ?? ""],
          ["literal", [0.02, -1.2]],
          ["literal", [0.02, -1.22]],
        ] as never,
      );
    }
  }, [activeSightingId, markerAssetsReady, sightings]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map || !initialFocus || !markerAssetsReady) {
      return;
    }

    const focusKey = `${initialFocus.latitude}:${initialFocus.longitude}:${initialFocus.zoom ?? 14.6}`;

    if (appliedFocusKeyRef.current === focusKey) {
      return;
    }

    appliedFocusKeyRef.current = focusKey;
    map.easeTo({
      center: [initialFocus.longitude, initialFocus.latitude],
      zoom: initialFocus.zoom ?? 14.6,
      duration: 900,
      essential: true,
    });
  }, [initialFocus, markerAssetsReady]);

  useEffect(() => {
    const map = mapInstanceRef.current;

    if (!map) {
      return;
    }

    const sourceId = "catography-neighborhood-highlights";
    const featureCollection = getNeighborhoodFeatureCollection(
      highlightedNeighborhoods.map((entry) => entry.name),
    );

    const colorStops = [
      "match",
      ["get", "name"],
      ...highlightedNeighborhoods.flatMap((entry) => [entry.name, entry.color]),
      "rgba(240,140,171,0.2)",
    ] as unknown[];

    const outlineStops = [
      "match",
      ["get", "name"],
      ...highlightedNeighborhoods.flatMap((entry) => [entry.name, entry.color]),
      "rgba(145,91,118,0.6)",
    ] as unknown[];

    function applyLayers() {
      const currentMap = map as maplibregl.Map;
      const existingSource = currentMap.getSource(sourceId) as
        | maplibregl.GeoJSONSource
        | undefined;

      if (existingSource) {
        existingSource.setData(featureCollection);
      } else {
        currentMap.addSource(sourceId, {
          type: "geojson",
          data: featureCollection,
        });

        currentMap.addLayer({
          id: `${sourceId}-fill`,
          type: "fill",
          source: sourceId,
          paint: {
            "fill-color": colorStops as never,
            "fill-opacity": 0.22,
          },
        });

        currentMap.addLayer({
          id: `${sourceId}-line`,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": outlineStops as never,
            "line-width": 2.6,
            "line-opacity": 0.92,
          },
        });
      }
    }

    if (map.isStyleLoaded()) {
      applyLayers();
    } else {
      map.once("load", applyLayers);
    }
  }, [highlightedNeighborhoods]);

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
    element.setAttribute("aria-label", "Point sélectionné");

    selectedMarkerRef.current = new maplibregl.Marker({
      element,
      anchor: "bottom",
    })
      .setLngLat([selectedCoordinates.longitude, selectedCoordinates.latitude])
      .addTo(map);
  }, [selectedCoordinates]);

  useEffect(() => {
    if (!activeSighting) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (!draggingPopupRef.current) {
        return;
      }

      setPopupDragActive(true);
      const nextOffset = {
        x:
          draggingPopupRef.current.offsetX +
          (event.clientX - draggingPopupRef.current.startX),
        y:
          draggingPopupRef.current.offsetY +
          (event.clientY - draggingPopupRef.current.startY),
      };

      popupOffsetRef.current = nextOffset;
      setPopupOffset(nextOffset);
    }

    function handlePointerUp() {
      draggingPopupRef.current = null;
      setPopupDragActive(false);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeSighting]);

  return (
    <div
      ref={wrapperRef}
      className="rounded-[1.9rem] border border-border bg-[#f8ecf2] shadow-[var(--shadow)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-accent-deep">
            Carte interactive
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectable
              ? "Clique pour choisir l'emplacement du chat."
              : "Explore les chats déjà validés dans Toulouse."}
          </p>
        </div>
        <span className="rounded-full bg-[#ffe2ed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent-deep">
          Toulouse
        </span>
      </div>

      <div
        ref={mapViewportRef}
        className={`relative overflow-visible ${heightClassName}`}
      >
        <div
          className="h-full w-full overflow-hidden rounded-b-[1.9rem]"
          ref={mapRef}
        />

        {activeSighting && popupPosition ? (
          <div
            ref={popupRef}
            className={`catography-floating-popup ${
              popupDragActive ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              left: popupPosition.left,
              top: popupPosition.top,
            }}
          >
            <div className="catography-popup">
              <div
                className={`catography-popup__drag-handle ${
                  popupDragActive ? "cursor-grabbing" : "cursor-grab"
                }`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();

                  draggingPopupRef.current = {
                    startX: event.clientX,
                    startY: event.clientY,
                    offsetX: popupOffsetRef.current.x,
                    offsetY: popupOffsetRef.current.y,
                  };
                }}
              >
                <span>Déplacer</span>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="catography-popup__image"
                src={activeSighting.image}
                alt={activeSighting.name}
              />

                <button
                  type="button"
                  data-no-drag="true"
                  onClick={() => {
                    setActiveSightingId(null);
                    setProjectedPoint(null);
                  }}
                  className="catography-popup__dismiss"
                  aria-label="Fermer"
              >
                ×
              </button>

              <p className="catography-popup__eyebrow">
                {activeSighting.neighborhood}
              </p>
              <h3 className="catography-popup__title">{activeSighting.name}</h3>
              <p className="catography-popup__meta">
                {activeSighting.color} • {activeSighting.behaviorLabel}
              </p>
              <p className="catography-popup__note">{activeSighting.note}</p>

              <div className="catography-popup__footer">
                {activeSighting.status === "approved" ? (
                  <a
                    data-no-drag="true"
                    className="catography-popup__link"
                    href={`/cats#cat-${activeSighting.id}`}
                  >
                    Voir la fiche
                  </a>
                ) : (
                  <span className="catography-popup__link opacity-60">
                    En attente de moderation
                  </span>
                )}
                <button
                  type="button"
                  data-no-drag="true"
                  onClick={() => onToggleLike?.(activeSighting.id)}
                  className={
                    activeSighting.likedByViewer
                      ? "catography-popup__like catography-popup__like--active"
                      : "catography-popup__like"
                  }
                  aria-label={
                    activeSighting.likedByViewer
                      ? `Retirer une croquette de ${activeSighting.name}`
                      : `Donner une croquette a ${activeSighting.name}`
                  }
                >
                  {activeSighting.likedByViewer ? "♥" : "♡"}{" "}
                  {activeSighting.likesCount > 0
                    ? `${activeSighting.likesCount} croquette${
                        activeSighting.likesCount > 1 ? "s" : ""
                      }`
                    : "Donner une croquette"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
