import { NextResponse } from "next/server";
import { getCurrentAdminAccount } from "@/lib/admin-auth";
import { deleteSighting, updateSightingStatus } from "@/lib/sightings-store";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getCurrentAdminAccount(user);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const adminAccount = await requireAdminSession();

  if (!adminAccount) {
    return NextResponse.json({ error: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { status?: "approved" | "pending" };

  if (body.status !== "approved" && body.status !== "pending") {
    return NextResponse.json(
      { error: "Statut invalide." },
      { status: 400 },
    );
  }

  const updated = await updateSightingStatus(id, body.status, {
    approvedByUserId: body.status === "approved" ? adminAccount.userId : null,
    approvedByName: body.status === "approved" ? adminAccount.displayName : null,
  });

  if (!updated) {
    return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const adminAccount = await requireAdminSession();

  if (!adminAccount) {
    return NextResponse.json({ error: "Connexion admin requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteSighting(id);

  if (!deleted) {
    return NextResponse.json({ error: "Signalement introuvable." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
