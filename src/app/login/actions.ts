"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminAccountByUsername, getCurrentAdminAccount } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

function toRedirectUrl(nextPath: string, error: string) {
  const params = new URLSearchParams({
    next: nextPath,
    error,
  });

  return `/login?${params.toString()}`;
}

export async function login(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = String(formData.get("next") || "/admin");

  const adminAccount = await getAdminAccountByUsername(username);

  if (!adminAccount) {
    console.error("[admin-login] username not found in admin_accounts", {
      username,
    });
    redirect(
      toRedirectUrl(
        nextPath,
        "Identifiant admin introuvable dans admin_accounts.",
      ),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminAccount.email,
    password,
  });

  if (error) {
    console.error("[admin-login] signInWithPassword failed", {
      username,
      email: adminAccount.email,
      message: error.message,
      code: error.code,
      status: error.status,
    });
    redirect(
      toRedirectUrl(
        nextPath,
        `Connexion Supabase refusée: ${error.message}`,
      ),
    );
  }

  const currentAdmin = await getCurrentAdminAccount(data.user);

  if (!currentAdmin) {
    console.error("[admin-login] auth ok but user is not an active admin", {
      username,
      userId: data.user?.id,
      email: data.user?.email,
    });
    await supabase.auth.signOut();
    redirect(
      toRedirectUrl(
        nextPath,
        "Authentification réussie, mais ce user n'est pas reconnu comme admin actif.",
      ),
    );
  }

  revalidatePath("/", "layout");
  redirect(nextPath);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
