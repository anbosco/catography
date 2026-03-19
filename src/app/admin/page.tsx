import { unstable_noStore as noStore } from "next/cache";
import { AdminModerationPanel } from "@/components/admin-moderation-panel";
import { getSightings } from "@/lib/sightings-store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  noStore();
  const sightings = await getSightings();

  return <AdminModerationPanel initialSightings={sightings} />;
}
