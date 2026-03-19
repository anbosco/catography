import { NextResponse } from "next/server";
import { deleteSighting, updateSightingStatus } from "@/lib/sightings-store";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as { status?: "approved" | "pending" };

  if (body.status !== "approved" && body.status !== "pending") {
    return NextResponse.json(
      { error: "Statut invalide." },
      { status: 400 },
    );
  }

  const updated = await updateSightingStatus(id, body.status);

  if (!updated) {
    return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const deleted = await deleteSighting(id);

  if (!deleted) {
    return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
