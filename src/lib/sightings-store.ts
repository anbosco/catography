import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  formatBehaviorLabel,
  normalizeBehaviors,
} from "@/lib/cat-taxonomy";
import { getAdminAccountsByUserIds } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { inferNeighborhoodFromCoordinates } from "@/lib/toulouse-neighborhoods";
import type {
  CatSighting,
  CreateSightingInput,
  SightingStatus,
  ToggleLikeResult,
  UploadedPhoto,
} from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "sightings.json");
const reactionsFile = path.join(dataDir, "reactions.json");
const uploadsDir = path.join(dataDir, "uploads");
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "cats";
const fallbackImage = "/cats/ginger.svg";

type StoredCatSighting = {
  id: string;
  name: string;
  neighborhood: string;
  color: string;
  behavior?: string;
  behaviors?: string[];
  note: string;
  seenAt: string;
  latitude: number;
  longitude: number;
  status: SightingStatus;
  image?: string;
  imagePath?: string | null;
  approvedAt?: string | null;
  approvedByUserId?: string | null;
  approvedByName?: string | null;
};

type LocalReaction = {
  sightingId: string;
  visitorToken: string;
};

type SupabaseSightingRow = {
  id: string;
  name: string;
  neighborhood: string;
  color: string;
  behavior: string | null;
  behaviors: string[] | null;
  note: string;
  latitude: number;
  longitude: number;
  status: SightingStatus;
  image_path: string | null;
  seen_at: string;
  created_at: string;
  approved_by: string | null;
  approved_at: string | null;
};

type SupabaseReactionRow = {
  sighting_id: string;
  visitor_token: string;
};

function needsNeighborhoodInference(neighborhood: string) {
  const normalized = neighborhood.trim().toLowerCase();
  return normalized === "" || normalized === "quartier inconnu" || normalized === "x";
}

function resolveImageUrl(sighting: {
  id: string;
  image?: string;
  imagePath?: string | null;
}) {
  if (sighting.imagePath) {
    return `/api/sightings/${sighting.id}/image`;
  }

  return sighting.image || fallbackImage;
}

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function shouldFallbackToLocal(error: unknown) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  const message =
    error && typeof error === "object" && "message" in error
      ? String(error.message)
      : error instanceof Error
        ? error.message
        : String(error);

  return /cat_sightings|cat_reactions|relation|table|column|fetch failed|network|timed out|pgrst|does not exist/i.test(
    `${code} ${message}`,
  );
}

async function ensureDataDir() {
  await mkdir(dataDir, { recursive: true });
}

async function ensureUploadsDir() {
  await mkdir(uploadsDir, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T) {
  await ensureDataDir();

  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
}

async function writeJsonFile(filePath: string, value: unknown) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function readSightingsFile() {
  return readJsonFile<StoredCatSighting[]>(dataFile, []);
}

async function writeSightingsFile(sightings: StoredCatSighting[]) {
  await writeJsonFile(dataFile, sightings);
}

async function readReactionsFile() {
  return readJsonFile<LocalReaction[]>(reactionsFile, []);
}

async function writeReactionsFile(reactions: LocalReaction[]) {
  await writeJsonFile(reactionsFile, reactions);
}

function summarizeReactions(reactions: LocalReaction[], viewerToken?: string) {
  const counts = new Map<string, number>();
  const likedIds = new Set<string>();

  reactions.forEach((reaction) => {
    counts.set(reaction.sightingId, (counts.get(reaction.sightingId) || 0) + 1);

    if (viewerToken && reaction.visitorToken === viewerToken) {
      likedIds.add(reaction.sightingId);
    }
  });

  return { counts, likedIds };
}

function normalizeLocalSighting(
  sighting: StoredCatSighting,
  reactionSummary: ReturnType<typeof summarizeReactions>,
): CatSighting {
  const neighborhood = needsNeighborhoodInference(sighting.neighborhood)
    ? inferNeighborhoodFromCoordinates({
        latitude: sighting.latitude,
        longitude: sighting.longitude,
      })
    : sighting.neighborhood;
  const behaviors = normalizeBehaviors(sighting.behaviors || sighting.behavior);

  return {
    id: sighting.id,
    name: sighting.name || "Chat anonyme",
    neighborhood,
    color: sighting.color || "Autre motif",
    behaviors,
    behaviorLabel: formatBehaviorLabel(behaviors),
    note: sighting.note || "Aucun commentaire",
    seenAt: sighting.seenAt || new Date().toISOString().slice(0, 10),
    latitude: sighting.latitude,
    longitude: sighting.longitude,
    status: sighting.status,
    imagePath: sighting.imagePath,
    image: resolveImageUrl(sighting),
    likesCount: reactionSummary.counts.get(sighting.id) || 0,
    likedByViewer: reactionSummary.likedIds.has(sighting.id),
    approvedAt: sighting.approvedAt || null,
    approvedByUserId: sighting.approvedByUserId || null,
    approvedByName: sighting.approvedByName || null,
  };
}

function serializeLocalSighting(sighting: CatSighting): StoredCatSighting {
  return {
    id: sighting.id,
    name: sighting.name,
    neighborhood: sighting.neighborhood,
    color: sighting.color,
    behavior: sighting.behaviorLabel,
    behaviors: sighting.behaviors,
    note: sighting.note,
    seenAt: sighting.seenAt,
    latitude: sighting.latitude,
    longitude: sighting.longitude,
    status: sighting.status,
    imagePath: sighting.imagePath,
    image: sighting.imagePath ? fallbackImage : sighting.image,
    approvedAt: sighting.approvedAt,
    approvedByUserId: sighting.approvedByUserId,
    approvedByName: sighting.approvedByName,
  };
}

function mapSupabaseRowToSighting(
  row: SupabaseSightingRow,
  reactionSummary: {
    counts: Map<string, number>;
    likedIds: Set<string>;
  },
  approvedByName?: string | null,
): CatSighting {
  const behaviors = normalizeBehaviors(row.behaviors || row.behavior);

  return {
    id: row.id,
    name: row.name,
    neighborhood: needsNeighborhoodInference(row.neighborhood)
      ? inferNeighborhoodFromCoordinates({
          latitude: row.latitude,
          longitude: row.longitude,
        })
      : row.neighborhood,
    color: row.color,
    behaviors,
    behaviorLabel: formatBehaviorLabel(behaviors),
    note: row.note,
    seenAt: row.seen_at,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
    imagePath: row.image_path,
    image: resolveImageUrl({
      id: row.id,
      imagePath: row.image_path,
    }),
    likesCount: reactionSummary.counts.get(row.id) || 0,
    likedByViewer: reactionSummary.likedIds.has(row.id),
    approvedAt: row.approved_at,
    approvedByUserId: row.approved_by,
    approvedByName: approvedByName || null,
  };
}

async function getSupabaseReactionSummary(
  sightingIds: string[],
  viewerToken?: string,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("cat_reactions")
    .select("sighting_id, visitor_token")
    .in("sighting_id", sightingIds);

  if (error) {
    throw error;
  }

  const counts = new Map<string, number>();
  const likedIds = new Set<string>();

  (data as SupabaseReactionRow[]).forEach((reaction) => {
    counts.set(reaction.sighting_id, (counts.get(reaction.sighting_id) || 0) + 1);

    if (viewerToken && reaction.visitor_token === viewerToken) {
      likedIds.add(reaction.sighting_id);
    }
  });

  return { counts, likedIds };
}

async function getSupabaseSightings(
  status?: SightingStatus,
  viewerToken?: string,
) {
  const supabase = createAdminClient();
  let query = supabase
    .from("cat_sightings")
    .select(
      "id, name, neighborhood, color, behavior, behaviors, note, latitude, longitude, status, image_path, seen_at, created_at, approved_by, approved_at",
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = data as SupabaseSightingRow[];
  const reactionSummary =
    rows.length > 0
      ? await getSupabaseReactionSummary(
          rows.map((row) => row.id),
          viewerToken,
        )
      : { counts: new Map<string, number>(), likedIds: new Set<string>() };

  const adminAccounts = await getAdminAccountsByUserIds(
    rows
      .map((row) => row.approved_by)
      .filter((value): value is string => Boolean(value)),
  );

  return rows.map((row) =>
    mapSupabaseRowToSighting(
      row,
      reactionSummary,
      row.approved_by ? adminAccounts.get(row.approved_by)?.displayName : null,
    ),
  );
}

async function getLocalSightings(status?: SightingStatus, viewerToken?: string) {
  const sightings = await readSightingsFile();
  const reactions = await readReactionsFile();
  const reactionSummary = summarizeReactions(reactions, viewerToken);
  const normalized = sightings.map((sighting) =>
    normalizeLocalSighting(sighting, reactionSummary),
  );

  await writeSightingsFile(normalized.map(serializeLocalSighting));

  if (!status) {
    return normalized;
  }

  return normalized.filter((sighting) => sighting.status === status);
}

export async function getSightings(
  status?: SightingStatus,
  viewerToken?: string,
) {
  if (isSupabaseConfigured()) {
    try {
      return await getSupabaseSightings(status, viewerToken);
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  return getLocalSightings(status, viewerToken);
}

async function savePhotoLocally(id: string, photo: UploadedPhoto) {
  await ensureUploadsDir();
  const fileName = `${id}.webp`;
  await writeFile(path.join(uploadsDir, fileName), photo.buffer);
  return `local:${fileName}`;
}

async function deleteLocalPhoto(imagePath: string | null | undefined) {
  if (!imagePath || !imagePath.startsWith("local:")) {
    return;
  }

  await unlink(path.join(uploadsDir, imagePath.slice("local:".length))).catch(() => {});
}

async function uploadPhotoToSupabase(id: string, photo: UploadedPhoto) {
  const imagePath = `sightings/${id}.webp`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(storageBucket)
    .upload(imagePath, photo.buffer, {
      contentType: photo.contentType,
      cacheControl: "31536000",
      upsert: true,
    });

  if (error) {
    throw error;
  }

  return imagePath;
}

async function deletePhotoFromSupabase(imagePath: string | null | undefined) {
  if (!imagePath || imagePath.startsWith("local:")) {
    return;
  }

  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(storageBucket).remove([imagePath]);

  if (error) {
    throw error;
  }
}

async function createLocalSighting(
  id: string,
  input: CreateSightingInput,
  photo?: UploadedPhoto | null,
) {
  const sightings = await readSightingsFile();
  const inferredNeighborhood = inferNeighborhoodFromCoordinates({
    latitude: input.latitude,
    longitude: input.longitude,
  });
  const imagePath = photo ? await savePhotoLocally(id, photo) : null;

  const newSighting: StoredCatSighting = {
    id,
    name: input.name || "Chat anonyme",
    neighborhood: inferredNeighborhood,
    color: input.color || "Autre motif",
    behavior: formatBehaviorLabel(input.behaviors),
    behaviors: input.behaviors,
    note: input.note || "Aucun commentaire",
    seenAt: new Date().toISOString().slice(0, 10),
    latitude: input.latitude,
    longitude: input.longitude,
    status: "pending",
    imagePath,
    image: fallbackImage,
  };

  sightings.unshift(newSighting);
  await writeSightingsFile(sightings);

  return normalizeLocalSighting(newSighting, summarizeReactions([], undefined));
}

export async function createSighting(
  input: CreateSightingInput,
  options?: { photo?: UploadedPhoto | null },
) {
  const id = randomUUID();
  const inferredNeighborhood = inferNeighborhoodFromCoordinates({
    latitude: input.latitude,
    longitude: input.longitude,
  });
  const seenAt = new Date().toISOString().slice(0, 10);
  const behaviors = normalizeBehaviors(input.behaviors);

  if (isSupabaseConfigured()) {
    let imagePath: string | null = null;

    try {
      if (options?.photo) {
        imagePath = await uploadPhotoToSupabase(id, options.photo);
      }

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("cat_sightings")
        .insert({
          id,
          name: input.name || "Chat anonyme",
          neighborhood: inferredNeighborhood,
          color: input.color || "Autre motif",
          behavior: formatBehaviorLabel(behaviors),
          behaviors,
          note: input.note || "Aucun commentaire",
          latitude: input.latitude,
          longitude: input.longitude,
          status: "pending",
          image_path: imagePath,
          seen_at: seenAt,
          approved_by: null,
          approved_at: null,
        })
        .select(
          "id, name, neighborhood, color, behavior, behaviors, note, latitude, longitude, status, image_path, seen_at, created_at, approved_by, approved_at",
        )
        .single();

      if (error) {
        throw error;
      }

      return mapSupabaseRowToSighting(data as SupabaseSightingRow, {
        counts: new Map(),
        likedIds: new Set(),
      });
    } catch (error) {
      if (imagePath) {
        await deletePhotoFromSupabase(imagePath);
      }

      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  return createLocalSighting(
    id,
    {
      ...input,
      behaviors,
    },
    options?.photo,
  );
}

async function updateLocalSightingStatus(id: string, status: SightingStatus) {
  const sightings = await readSightingsFile();
  const reactions = await readReactionsFile();
  const reactionSummary = summarizeReactions(reactions, undefined);
  const index = sightings.findIndex((sighting) => sighting.id === id);

  if (index === -1) {
    return null;
  }

  sightings[index] = {
    ...sightings[index],
    status,
    approvedAt: status === "approved" ? new Date().toISOString() : null,
    approvedByUserId: null,
    approvedByName: null,
  };

  await writeSightingsFile(sightings);

  return normalizeLocalSighting(sightings[index], reactionSummary);
}

export async function updateSightingStatus(
  id: string,
  status: SightingStatus,
  options?: { approvedByUserId?: string | null; approvedByName?: string | null },
) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("cat_sightings")
        .update({
          status,
          approved_by:
            status === "approved" ? options?.approvedByUserId || null : null,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select(
          "id, name, neighborhood, color, behavior, behaviors, note, latitude, longitude, status, image_path, seen_at, created_at, approved_by, approved_at",
        )
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data
        ? mapSupabaseRowToSighting(
            data as SupabaseSightingRow,
            {
              counts: new Map(),
              likedIds: new Set(),
            },
            status === "approved" ? options?.approvedByName || null : null,
          )
        : null;
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  return updateLocalSightingStatus(id, status);
}

async function deleteLocalSighting(id: string) {
  const sightings = await readSightingsFile();
  const reactions = await readReactionsFile();
  const target = sightings.find((sighting) => sighting.id === id);
  const filteredSightings = sightings.filter((sighting) => sighting.id !== id);

  if (filteredSightings.length === sightings.length) {
    return false;
  }

  const filteredReactions = reactions.filter((reaction) => reaction.sightingId !== id);
  await writeSightingsFile(filteredSightings);
  await writeReactionsFile(filteredReactions);
  await deleteLocalPhoto(target?.imagePath);
  return true;
}

export async function deleteSighting(id: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: existing, error: readError } = await supabase
        .from("cat_sightings")
        .select("image_path")
        .eq("id", id)
        .maybeSingle();

      if (readError) {
        throw readError;
      }

      if (!existing) {
        return false;
      }

      if (existing.image_path) {
        await deletePhotoFromSupabase(existing.image_path);
      }

      const { error: reactionsError } = await supabase
        .from("cat_reactions")
        .delete()
        .eq("sighting_id", id);

      if (reactionsError) {
        throw reactionsError;
      }

      const { error } = await supabase.from("cat_sightings").delete().eq("id", id);

      if (error) {
        throw error;
      }
      return true;
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  return deleteLocalSighting(id);
}

export async function getSightingById(id: string, viewerToken?: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("cat_sightings")
        .select(
          "id, name, neighborhood, color, behavior, behaviors, note, latitude, longitude, status, image_path, seen_at, created_at, approved_by, approved_at",
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      const reactionSummary = await getSupabaseReactionSummary([id], viewerToken);
      const adminAccounts = await getAdminAccountsByUserIds(
        (data as SupabaseSightingRow).approved_by
          ? [(data as SupabaseSightingRow).approved_by as string]
          : [],
      );

      return mapSupabaseRowToSighting(
        data as SupabaseSightingRow,
        reactionSummary,
        (data as SupabaseSightingRow).approved_by
          ? adminAccounts.get((data as SupabaseSightingRow).approved_by as string)
              ?.displayName || null
          : null,
      );
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  const sightings = await readSightingsFile();
  const reactions = await readReactionsFile();
  const reactionSummary = summarizeReactions(reactions, viewerToken);
  const sighting = sightings.find((entry) => entry.id === id);
  return sighting ? normalizeLocalSighting(sighting, reactionSummary) : null;
}

export async function getSightingImage(id: string) {
  const sighting = await getSightingById(id);

  if (!sighting?.imagePath) {
    return null;
  }

  if (sighting.imagePath.startsWith("local:")) {
    const buffer = await readFile(
      path.join(uploadsDir, sighting.imagePath.slice("local:".length)),
    );

    return {
      buffer,
      contentType: "image/webp",
      status: sighting.status,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(storageBucket)
    .download(sighting.imagePath);

  if (error || !data) {
    throw error ?? new Error("Image introuvable dans le storage.");
  }

  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    contentType: data.type || "image/webp",
    status: sighting.status,
  };
}

async function toggleLocalSightingLike(id: string, viewerToken: string) {
  const sightings = await readSightingsFile();
  const reactions = await readReactionsFile();

  if (!sightings.some((sighting) => sighting.id === id && sighting.status === "approved")) {
    return null;
  }

  const existingIndex = reactions.findIndex(
    (reaction) =>
      reaction.sightingId === id && reaction.visitorToken === viewerToken,
  );

  if (existingIndex >= 0) {
    reactions.splice(existingIndex, 1);
  } else {
    reactions.push({
      sightingId: id,
      visitorToken: viewerToken,
    });
  }

  await writeReactionsFile(reactions);
  const reactionSummary = summarizeReactions(reactions, viewerToken);

  return {
    id,
    likesCount: reactionSummary.counts.get(id) || 0,
    likedByViewer: reactionSummary.likedIds.has(id),
  } satisfies ToggleLikeResult;
}

export async function toggleSightingLike(id: string, viewerToken: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data: sighting, error: sightingError } = await supabase
        .from("cat_sightings")
        .select("id, status")
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle();

      if (sightingError) {
        throw sightingError;
      }

      if (!sighting) {
        return null;
      }

      const { data: existing, error: existingError } = await supabase
        .from("cat_reactions")
        .select("sighting_id")
        .eq("sighting_id", id)
        .eq("visitor_token", viewerToken)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        const { error } = await supabase
          .from("cat_reactions")
          .delete()
          .eq("sighting_id", id)
          .eq("visitor_token", viewerToken);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("cat_reactions").insert({
          sighting_id: id,
          visitor_token: viewerToken,
        });

        if (error) {
          throw error;
        }
      }

      const { count, error: countError } = await supabase
        .from("cat_reactions")
        .select("*", { count: "exact", head: true })
        .eq("sighting_id", id);

      if (countError) {
        throw countError;
      }

      return {
        id,
        likesCount: count || 0,
        likedByViewer: !existing,
      } satisfies ToggleLikeResult;
    } catch (error) {
      if (!shouldFallbackToLocal(error)) {
        throw error;
      }
    }
  }

  return toggleLocalSightingLike(id, viewerToken);
}
