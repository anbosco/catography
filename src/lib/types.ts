export type SightingStatus = "approved" | "pending";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type PolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

export type MultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type NeighborhoodGeometry = PolygonGeometry | MultiPolygonGeometry;

export type ToulouseNeighborhood = {
  code: string;
  name: string;
  geometry: NeighborhoodGeometry;
};

export type CatSighting = {
  id: string;
  name: string;
  neighborhood: string;
  color: string;
  behavior: string;
  note: string;
  seenAt: string;
  latitude: Coordinates["latitude"];
  longitude: Coordinates["longitude"];
  status: SightingStatus;
  image: string;
};

export type CreateSightingInput = {
  name: string;
  neighborhood: string;
  color: string;
  behavior: string;
  note: string;
  latitude: Coordinates["latitude"];
  longitude: Coordinates["longitude"];
};
