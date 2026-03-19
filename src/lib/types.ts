export type SightingStatus = "approved" | "pending";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type MapFocusTarget = Coordinates & {
  zoom?: number;
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
  behaviors: string[];
  behaviorLabel: string;
  note: string;
  seenAt: string;
  latitude: Coordinates["latitude"];
  longitude: Coordinates["longitude"];
  status: SightingStatus;
  image: string;
  imagePath?: string | null;
  likesCount: number;
  likedByViewer: boolean;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  approvedByName?: string | null;
};

export type CreateSightingInput = {
  name: string;
  neighborhood: string;
  color: string;
  behaviors: string[];
  note: string;
  latitude: Coordinates["latitude"];
  longitude: Coordinates["longitude"];
};

export type UploadedPhoto = {
  buffer: Buffer;
  contentType: string;
};

export type ToggleLikeResult = Pick<
  CatSighting,
  "id" | "likesCount" | "likedByViewer"
>;
