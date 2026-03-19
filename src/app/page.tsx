import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { HomeExperience } from "@/components/home-experience";
import { getSightings } from "@/lib/sightings-store";
import type { MapFocusTarget } from "@/lib/types";
import { readViewerToken } from "@/lib/visitor-token";

export const dynamic = "force-dynamic";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readFirstParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value) ? value[0] : value;
}

function parseMapFocus(
  params: Record<string, string | string[] | undefined>,
): MapFocusTarget | null {
  const latValue = Number(readFirstParam(params.lat));
  const lngValue = Number(readFirstParam(params.lng));
  const zoomValue = Number(readFirstParam(params.zoom));

  if (!Number.isFinite(latValue) || !Number.isFinite(lngValue)) {
    return null;
  }

  return {
    latitude: latValue,
    longitude: lngValue,
    zoom: Number.isFinite(zoomValue) ? zoomValue : 14.6,
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  noStore();

  const cookieStore = await cookies();
  const viewerToken = readViewerToken(cookieStore);
  const approvedSightings = await getSightings("approved", viewerToken);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialMapFocus = parseMapFocus(resolvedSearchParams);

  return (
    <HomeExperience
      initialSightings={approvedSightings}
      initialMapFocus={initialMapFocus}
    />
  );
}
