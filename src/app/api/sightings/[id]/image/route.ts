import { NextResponse } from "next/server";
import { getCurrentAdminAccount } from "@/lib/admin-auth";
import { getSightingById, getSightingImage } from "@/lib/sightings-store";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const sighting = await getSightingById(id);

  if (!sighting?.imagePath) {
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  }

  if (sighting.status !== "approved") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!(await getCurrentAdminAccount(user))) {
      return NextResponse.json({ error: "Connexion admin requise." }, { status: 401 });
    }
  }

  const image = await getSightingImage(id);

  if (!image) {
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  }

  return new NextResponse(image.buffer, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control":
        sighting.status === "approved"
          ? "public, max-age=3600, stale-while-revalidate=86400"
          : "private, no-store",
    },
  });
}
