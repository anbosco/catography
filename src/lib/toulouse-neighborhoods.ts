import neighborhoodsData from "@/data/toulouse-neighborhoods.json";
import type {
  Coordinates,
  NeighborhoodGeometry,
  ToulouseNeighborhood,
} from "@/lib/types";

const neighborhoods = neighborhoodsData as ToulouseNeighborhood[];

type Point = [longitude: number, latitude: number];

function isPointInRing(point: Point, ring: number[][]) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInPolygon(point: Point, polygon: number[][][]) {
  if (!polygon.length || !isPointInRing(point, polygon[0])) {
    return false;
  }

  return !polygon.slice(1).some((hole) => isPointInRing(point, hole));
}

function isPointInGeometry(point: Point, geometry: NeighborhoodGeometry) {
  if (geometry.type === "Polygon") {
    return isPointInPolygon(point, geometry.coordinates);
  }

  return geometry.coordinates.some((polygon) => isPointInPolygon(point, polygon));
}

function getOuterRing(geometry: NeighborhoodGeometry) {
  if (geometry.type === "Polygon") {
    return geometry.coordinates[0] ?? [];
  }

  return geometry.coordinates[0]?.[0] ?? [];
}

function getApproximateCenter(geometry: NeighborhoodGeometry): Point {
  const ring = getOuterRing(geometry);

  if (!ring.length) {
    return [1.4442, 43.6047];
  }

  const { longitude, latitude } = ring.reduce(
    (accumulator, [lng, lat]) => ({
      longitude: accumulator.longitude + lng,
      latitude: accumulator.latitude + lat,
    }),
    { longitude: 0, latitude: 0 },
  );

  return [longitude / ring.length, latitude / ring.length];
}

function getDistanceSquared(point: Point, target: Point) {
  const [x1, y1] = point;
  const [x2, y2] = target;

  return (x1 - x2) ** 2 + (y1 - y2) ** 2;
}

export function getToulouseNeighborhoods() {
  return neighborhoods;
}

export function getNeighborhoodByName(name: string) {
  return neighborhoods.find((neighborhood) => neighborhood.name === name) ?? null;
}

export function getNeighborhoodFeatureCollection(names: string[]) {
  return {
    type: "FeatureCollection" as const,
    features: names
      .map((name) => getNeighborhoodByName(name))
      .filter((neighborhood): neighborhood is ToulouseNeighborhood => Boolean(neighborhood))
      .map((neighborhood) => ({
        type: "Feature" as const,
        properties: {
          name: neighborhood.name,
        },
        geometry: neighborhood.geometry,
      })),
  };
}

export function inferNeighborhoodFromCoordinates(coordinates: Coordinates) {
  const point: Point = [coordinates.longitude, coordinates.latitude];
  const exactMatch = neighborhoods.find((neighborhood) =>
    isPointInGeometry(point, neighborhood.geometry),
  );

  if (exactMatch) {
    return exactMatch.name;
  }

  // Fallback for border clicks: use the nearest official neighborhood center.
  const nearest = neighborhoods.reduce<{
    distance: number;
    neighborhood: ToulouseNeighborhood | null;
  }>(
    (closest, neighborhood) => {
      const center = getApproximateCenter(neighborhood.geometry);
      const distance = getDistanceSquared(point, center);

      if (distance < closest.distance) {
        return { distance, neighborhood };
      }

      return closest;
    },
    { distance: Number.POSITIVE_INFINITY, neighborhood: null },
  );

  return nearest.neighborhood?.name ?? "Toulouse";
}
