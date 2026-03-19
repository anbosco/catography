import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { CatsCatalog } from "@/components/cats-catalog";
import { getSightings } from "@/lib/sightings-store";
import { readViewerToken } from "@/lib/visitor-token";

export const dynamic = "force-dynamic";

export default async function CatsPage() {
  noStore();

  const cookieStore = await cookies();
  const viewerToken = readViewerToken(cookieStore);
  const approvedSightings = await getSightings("approved", viewerToken);

  return (
    <main className="mx-auto flex w-full max-w-[88rem] flex-1 flex-col px-6 py-10 sm:px-10 lg:px-12">
      <CatsCatalog initialSightings={approvedSightings} />
    </main>
  );
}
