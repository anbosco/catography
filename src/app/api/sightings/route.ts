import { NextResponse } from "next/server";
import { createSighting, getSightings } from "@/lib/sightings-store";
import type { CreateSightingInput } from "@/lib/types";

export const dynamic = "force-dynamic";

function isCreateSightingInput(value: unknown): value is CreateSightingInput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<CreateSightingInput>;

  return (
    typeof payload.latitude === "number" &&
    Number.isFinite(payload.latitude) &&
    typeof payload.longitude === "number" &&
    Number.isFinite(payload.longitude)
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  if (status === "approved" || status === "pending") {
    const sightings = await getSightings(status);
    return NextResponse.json(sightings);
  }

  const sightings = await getSightings();
  return NextResponse.json(sightings);
}

export async function POST(request: Request) {
  const body = await request.json();

  if (!isCreateSightingInput(body)) {
    return NextResponse.json(
      { error: "Coordonnees invalides ou manquantes." },
      { status: 400 },
    );
  }

  const created = await createSighting(body);

  return NextResponse.json(created, { status: 201 });
}
