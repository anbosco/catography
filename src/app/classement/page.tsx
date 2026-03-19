import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { RankingBoard } from "@/components/ranking-board";
import { getSightings } from "@/lib/sightings-store";
import { readViewerToken } from "@/lib/visitor-token";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  noStore();

  const cookieStore = await cookies();
  const viewerToken = readViewerToken(cookieStore);
  const approvedSightings = await getSightings("approved", viewerToken);

  return <RankingBoard initialSightings={approvedSightings} />;
}
