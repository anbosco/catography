import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { toggleSightingLike } from "@/lib/sightings-store";
import {
  createViewerToken,
  readViewerToken,
  viewerCookieName,
  viewerCookieOptions,
} from "@/lib/visitor-token";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const cookieStore = await cookies();
  const existingViewerToken = readViewerToken(cookieStore);
  const viewerToken = existingViewerToken || createViewerToken();

  const result = await toggleSightingLike(id, viewerToken);

  if (!result) {
    return NextResponse.json({ error: "Chat introuvable." }, { status: 404 });
  }

  const response = NextResponse.json(result);

  if (!existingViewerToken) {
    response.cookies.set(viewerCookieName, viewerToken, viewerCookieOptions);
  }

  return response;
}
