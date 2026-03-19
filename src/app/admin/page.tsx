import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { AdminModerationPanel } from "@/components/admin-moderation-panel";
import { getCurrentAdminAccount } from "@/lib/admin-auth";
import { getSightings } from "@/lib/sightings-store";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  noStore();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const currentAdmin = await getCurrentAdminAccount(user);

  if (!currentAdmin) {
    redirect("/login?next=/admin");
  }

  const sightings = await getSightings();

  return <AdminModerationPanel initialSightings={sightings} />;
}
