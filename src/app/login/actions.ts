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
  const genericError = "Connexion admin impossible.";

  const adminAccount = await getAdminAccountByUsername(username);

  if (!adminAccount) {
    redirect(toRedirectUrl(nextPath, genericError));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminAccount.email,
    password,
  });

  if (error) {
    redirect(toRedirectUrl(nextPath, genericError));
  }

  const currentAdmin = await getCurrentAdminAccount(data.user);

  if (!currentAdmin) {
    await supabase.auth.signOut();
    redirect(toRedirectUrl(nextPath, genericError));
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
