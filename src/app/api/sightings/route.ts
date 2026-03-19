import sharp from "sharp";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createSighting, getSightings } from "@/lib/sightings-store";
import type { CreateSightingInput, UploadedPhoto } from "@/lib/types";
import { readViewerToken } from "@/lib/visitor-token";

export const dynamic = "force-dynamic";

const maxPhotoSizeInBytes = 12 * 1024 * 1024;

function isCreateSightingInput(value: unknown): value is CreateSightingInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CreateSightingInput>;

  return (
    typeof payload.latitude === "number" &&
    Number.isFinite(payload.latitude) &&
    typeof payload.longitude === "number" &&
    Number.isFinite(payload.longitude) &&
    Array.isArray(payload.behaviors)
  );
}

async function compressPhoto(file: File): Promise<UploadedPhoto> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Le fichier doit etre une image.");
  }

  if (file.size > maxPhotoSizeInBytes) {
    throw new Error("La photo depasse 12 Mo avant compression.");
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(inputBuffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1600,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    buffer: outputBuffer,
    contentType: "image/webp",
  };
}

async function parseCreateSightingRequest(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const input: CreateSightingInput = {
      name: String(formData.get("name") || ""),
      neighborhood: String(formData.get("neighborhood") || ""),
      color: String(formData.get("color") || ""),
      behaviors: formData
        .getAll("behaviors")
        .map((value) => String(value).trim())
        .filter(Boolean),
      note: String(formData.get("note") || ""),
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
    };

    const photoEntry = formData.get("photo");
    const photo =
      photoEntry instanceof File && photoEntry.size > 0
        ? await compressPhoto(photoEntry)
        : null;

    return { input, photo };
  }

  return {
    input: (await request.json()) as CreateSightingInput,
    photo: null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const cookieStore = await cookies();
  const viewerToken = readViewerToken(cookieStore);

  if (status === "approved" || status === "pending") {
    const sightings = await getSightings(status, viewerToken);
    return NextResponse.json(sightings);
  }

  const sightings = await getSightings(undefined, viewerToken);
  return NextResponse.json(sightings);
}

export async function POST(request: Request) {
  try {
    const { input, photo } = await parseCreateSightingRequest(request);

    if (!isCreateSightingInput(input)) {
      return NextResponse.json(
        { error: "Coordonnees invalides ou manquantes." },
        { status: 400 },
      );
    }

    const created = await createSighting(input, { photo });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "La soumission a echoue.",
      },
      { status: 400 },
    );
  }
}
