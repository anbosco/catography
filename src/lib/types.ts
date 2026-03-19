export type SightingStatus = "approved" | "pending";

export type Coordinates = {
  latitude: number;
  longitude: number;
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
