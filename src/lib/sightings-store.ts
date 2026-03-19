import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { inferNeighborhoodFromCoordinates } from "@/lib/toulouse-neighborhoods";
import type { CatSighting, CreateSightingInput, SightingStatus } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "sightings.json");

function needsNeighborhoodInference(neighborhood: string) {
  const normalized = neighborhood.trim().toLowerCase();
  return normalized === "" || normalized === "quartier inconnu" || normalized === "x";
}

function normalizeSightings(sightings: CatSighting[]) {
  let hasChanges = false;

  const normalized = sightings.map((sighting) => {
    if (!needsNeighborhoodInference(sighting.neighborhood)) {
      return sighting;
    }

    hasChanges = true;

    return {
      ...sighting,
      neighborhood: inferNeighborhoodFromCoordinates({
        latitude: sighting.latitude,
        longitude: sighting.longitude,
      }),
    };
  });

  return { normalized, hasChanges };
}

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });
}

async function readSightingsFile() {
  await ensureDataFile();
  const content = await readFile(dataFile, "utf8");
  return JSON.parse(content) as CatSighting[];
}

async function writeSightingsFile(sightings: CatSighting[]) {
  await ensureDataFile();
  await writeFile(dataFile, JSON.stringify(sightings, null, 2) + "\n", "utf8");
}

export async function getSightings(status?: SightingStatus) {
  const sightings = await readSightingsFile();
  const { normalized, hasChanges } = normalizeSightings(sightings);

  if (hasChanges) {
    await writeSightingsFile(normalized);
  }

  if (!status) {
    return normalized;
  }

  return normalized.filter((sighting) => sighting.status === status);
}

export async function createSighting(input: CreateSightingInput) {
  const sightings = await readSightingsFile();
  const inferredNeighborhood = inferNeighborhoodFromCoordinates({
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const newSighting: CatSighting = {
    id: randomUUID(),
    name: input.name || "Chat anonyme",
    neighborhood: inferredNeighborhood,
    color: input.color || "Non precise",
    behavior: input.behavior || "Mystere felin",
    note: input.note || "Aucun commentaire",
    seenAt: new Date().toISOString().slice(0, 10),
    latitude: input.latitude,
    longitude: input.longitude,
    status: "pending",
    image: "/cats/ginger.svg",
  };

  sightings.unshift(newSighting);
  await writeSightingsFile(sightings);

  return newSighting;
}

export async function updateSightingStatus(
  id: string,
  status: SightingStatus,
) {
  const sightings = await readSightingsFile();
  const index = sightings.findIndex((sighting) => sighting.id === id);

  if (index === -1) {
    return null;
  }

  sightings[index] = {
    ...sightings[index],
    status,
  };

  await writeSightingsFile(sightings);

  return sightings[index];
}

export async function deleteSighting(id: string) {
  const sightings = await readSightingsFile();
  const filtered = sightings.filter((sighting) => sighting.id !== id);

  if (filtered.length === sightings.length) {
    return false;
  }

  await writeSightingsFile(filtered);
  return true;
}
