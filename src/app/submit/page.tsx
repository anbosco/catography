import { unstable_noStore as noStore } from "next/cache";
import { SubmitSightingForm } from "@/components/submit-sighting-form";
import { getSightings } from "@/lib/sightings-store";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  noStore();
  const approvedSightings = await getSightings("approved");

  return <SubmitSightingForm approvedSightings={approvedSightings} />;
}
